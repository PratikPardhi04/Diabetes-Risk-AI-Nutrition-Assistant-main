import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mealsAPI } from '../services/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
} from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { chartColors, defaultGridProps, defaultXAxisProps, defaultYAxisProps, dateKey } from '@/components/charts/theme';
import { Input } from '@/components/ui/input';

const CustomTooltip = ({ active, label, payload, metric }) => {
  if (active && payload && payload.length) {
    const showCal = metric !== 'sugar';
    const showSugar = metric !== 'calories';
    const calories = showCal ? (payload.find((p) => p.dataKey === 'calories')?.value ?? 0) : null;
    const sugar = showSugar ? (payload.find((p) => p.dataKey === 'sugar')?.value ?? 0) : null;
    return (
      <div className="rounded-md border bg-white dark:bg-gray-900 dark:border-gray-700 p-3 text-sm shadow-sm text-gray-900 dark:text-gray-100">
        <div className="font-medium mb-1">{label}</div>
        {showCal && (
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: chartColors.calories }}></span>
            <span>Calories: <strong>{Number(calories ?? 0).toFixed(0)}</strong></span>
          </div>
        )}
        {showSugar && (
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: chartColors.sugar }}></span>
            <span>Sugar: <strong>{Number(sugar ?? 0).toFixed(1)} g</strong></span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const ReferenceLines = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) return null;
  const sum = (arr, key) => arr.reduce((acc, d) => acc + (Number(d[key]) || 0), 0);
  const avgCal = sum(data, 'calories') / data.length || 0;
  const avgSugar = sum(data, 'sugar') / data.length || 0;
  return (
    <>
      <ReferenceLine y={avgCal} stroke={chartColors.calories} strokeDasharray="4 4" ifOverflow="extendDomain" label={{ value: `Avg Cal (${avgCal.toFixed(0)})`, position: 'right', fill: chartColors.calories, fontSize: 12 }} />
      <ReferenceLine y={avgSugar} stroke={chartColors.sugar} strokeDasharray="4 4" ifOverflow="extendDomain" label={{ value: `Avg Sugar (${avgSugar.toFixed(1)}g)`, position: 'right', fill: chartColors.sugar, fontSize: 12 }} />
    </>
  );
};

const MealHistory = () => {
  const [meals, setMeals] = useState([]); // detailed list (7 days only)
  const [chartMeals, setChartMeals] = useState([]); // up to 30 days for charts
  const [chartData, setChartData] = useState([]);
  const [chartMode, setChartMode] = useState('lines'); // 'lines' | 'stacked'
  const [metric, setMetric] = useState('both'); // 'both' | 'calories' | 'sugar'
  const [rangeDays, setRangeDays] = useState(7); // 7 | 14 | 30
  const [goalCalories, setGoalCalories] = useState(2000);
  const [goalSugar, setGoalSugar] = useState(30);

  useEffect(() => {
    const savedMode = localStorage.getItem('mhChartMode');
    if (savedMode === 'lines' || savedMode === 'stacked') {
      setChartMode(savedMode);
    }
    const savedMetric = localStorage.getItem('mhMetric');
    if (savedMetric === 'both' || savedMetric === 'calories' || savedMetric === 'sugar') {
      setMetric(savedMetric);
    }
    const savedRange = Number(localStorage.getItem('mhRangeDays'));
    if ([7, 14, 30].includes(savedRange)) {
      setRangeDays(savedRange);
    }
    const gc = Number(localStorage.getItem('mhGoalCalories'));
    if (Number.isFinite(gc) && gc > 0) setGoalCalories(gc);
    const gs = Number(localStorage.getItem('mhGoalSugar'));
    if (Number.isFinite(gs) && gs > 0) setGoalSugar(gs);
  }, []);

  useEffect(() => {
    localStorage.setItem('mhChartMode', chartMode);
  }, [chartMode]);

  useEffect(() => {
    localStorage.setItem('mhMetric', metric);
  }, [metric]);

  useEffect(() => {
    localStorage.setItem('mhRangeDays', String(rangeDays));
    // Rebuild chartData when range changes, using the 30-day chartMeals source
    if (chartMeals.length) {
      const next = buildChartData(chartMeals, rangeDays);
      setChartData(next);
    }
  }, [rangeDays, chartMeals]);

  useEffect(() => {
    localStorage.setItem('mhGoalCalories', String(goalCalories));
  }, [goalCalories]);

  useEffect(() => {
    localStorage.setItem('mhGoalSugar', String(goalSugar));
  }, [goalSugar]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Helpers to ensure numeric operations work even if API returns strings
  const safeNumber = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };
  const normalizeMeal = (meal) => ({
    ...meal,
    calories: safeNumber(meal.calories, 0),
    carbs: safeNumber(meal.carbs, 0),
    protein: safeNumber(meal.protein, 0),
    fat: safeNumber(meal.fat, 0),
    sugar: safeNumber(meal.sugar, 0),
    fiber: safeNumber(meal.fiber, 0),
  });

  const buildChartData = (sortedMeals, days) => {
    const groupedByDate = {};
    sortedMeals.forEach((meal) => {
      const key = dateKey(meal.createdAt);
      if (!groupedByDate[key]) {
        groupedByDate[key] = { date: key, calories: 0, sugar: 0 };
      }
      groupedByDate[key].calories += safeNumber(meal.calories, 0);
      groupedByDate[key].sugar += safeNumber(meal.sugar, 0);
    });
    const series = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dateKey(d);
      series.push(groupedByDate[key] || { date: key, calories: 0, sugar: 0 });
    }
    return series;
  };

  useEffect(() => {
    fetchMeals();
  }, []);

  const fetchMeals = async () => {
    try {
      setLoading(true);
      const response = await mealsAPI.getAll({ limit: 200, days: 30 });
      const fetchedMeals = (response.data.meals || []).map(normalizeMeal);

      // Sort by date (newest first)
      const sortedMeals = fetchedMeals.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      // Keep 30 days for charts
      setChartMeals(sortedMeals);

      // Filter to last 7 days for the detailed list
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentMeals = sortedMeals.filter(m => new Date(m.createdAt) >= sevenDaysAgo);
      setMeals(recentMeals);

      // Build chart data for selected range from 30-day chart set
      const chartDataArray = buildChartData(sortedMeals, rangeDays);
      setChartData(chartDataArray);
    } catch (err) {
      setError('Failed to load meals');
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (impact) => {
    switch (impact?.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Compute dynamic Y-axis domain based on selected metric
  const maxCal = Math.max(0, ...chartData.map((d) => Number(d.calories) || 0));
  const maxSugar = Math.max(0, ...chartData.map((d) => Number(d.sugar) || 0));
  const yDomain = metric === 'calories'
    ? [0, Math.ceil(maxCal * 1.2) || 10]
    : metric === 'sugar'
      ? [0, 200]
      : undefined; // both -> auto
  const yTicks = metric === 'sugar' ? [0, 50, 100, 150, 200] : undefined;
  const yTickFormatter = metric === 'sugar' ? (v) => v : undefined;
  const yAxisExtra = yDomain ? { domain: yDomain, ...(yTicks ? { ticks: yTicks } : {}) } : {};
  const yAxisLabelProps = metric === 'sugar' ? { interval: 0, allowDecimals: false } : {};

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">Meal History</h2>
          <button
            onClick={() => navigate('/meals/add')}
            className="px-4 py-2 rounded-md border hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Add Meal
          </button>
        </div>

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {meals.length === 0 ? (
          <div className="rounded-lg border p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No meals logged yet.</p>
            <button
              onClick={() => navigate('/meals/add')}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
            >
              Add Your First Meal
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Charts */}
            <div className="rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Calories & Sugar Trends (Last {rangeDays} Days)</h3>
                <div className="flex items-center gap-2">
                  <Button variant={rangeDays === 7 ? 'default' : 'outline'} size="sm" onClick={() => setRangeDays(7)}>7d</Button>
                  <Button variant={rangeDays === 14 ? 'default' : 'outline'} size="sm" onClick={() => setRangeDays(14)}>14d</Button>
                  <Button variant={rangeDays === 30 ? 'default' : 'outline'} size="sm" onClick={() => setRangeDays(30)}>30d</Button>
                  <Button variant={chartMode === 'lines' ? 'default' : 'outline'} size="sm" onClick={() => setChartMode('lines')}>Lines</Button>
                  <Button variant={chartMode === 'stacked' ? 'default' : 'outline'} size="sm" onClick={() => setChartMode('stacked')}>Stacked</Button>
                  <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
                  <Button variant={metric === 'calories' ? 'default' : 'outline'} size="sm" onClick={() => setMetric('calories')}>Calories</Button>
                  <Button variant={metric === 'sugar' ? 'default' : 'outline'} size="sm" onClick={() => setMetric('sugar')}>Sugar</Button>
                  <Button variant={metric === 'both' ? 'default' : 'outline'} size="sm" onClick={() => setMetric('both')}>Both</Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Calories goal</span>
                  <Input type="number" className="h-8 w-24" value={goalCalories} min={0} onChange={(e) => setGoalCalories(Number(e.target.value) || 0)} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Sugar goal (g)</span>
                  <Input type="number" className="h-8 w-24" value={goalSugar} min={0} step="0.1" onChange={(e) => setGoalSugar(Number(e.target.value) || 0)} />
                </div>
              </div>

              <ResponsiveContainer width="100%" height={360}>
                {chartMode === 'lines' ? (
                  <LineChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid {...defaultGridProps} />
                    <XAxis dataKey="date" {...defaultXAxisProps} tickFormatter={(iso) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
                    <YAxis {...defaultYAxisProps} {...yAxisExtra} {...yAxisLabelProps} tickFormatter={yTickFormatter} />
                    <Tooltip content={<CustomTooltip metric={metric} />} />
                    <Legend />
                    {metric !== 'sugar' && (
                      <Line type="monotone" dataKey="calories" name="Calories" stroke={chartColors.calories} strokeWidth={2} dot={false} />
                    )}
                    {metric !== 'calories' && (
                      <Line type="monotone" dataKey="sugar" name="Sugar (g)" stroke={chartColors.sugar} strokeWidth={metric === 'sugar' ? 3 : 2} dot={metric === 'sugar'} />
                    )}
                    <ReferenceLines data={chartData} />
                    {goalCalories > 0 && (
                      <ReferenceLine y={goalCalories} stroke={chartColors.goalCalories} strokeDasharray="2 2" ifOverflow="extendDomain" label={{ value: `Goal Cal (${goalCalories})`, position: 'right', fill: chartColors.goalCalories, fontSize: 12 }} />
                    )}
                    {goalSugar > 0 && (
                      <ReferenceLine y={goalSugar} stroke={chartColors.goalSugar} strokeDasharray="2 2" ifOverflow="extendDomain" label={{ value: `Goal Sugar (${goalSugar}g)`, position: 'right', fill: chartColors.goalSugar, fontSize: 12 }} />
                    )}
                  </LineChart>
                ) : (
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <defs>
                      <linearGradient id="calGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors.calories} stopOpacity={0.35}/>
                        <stop offset="95%" stopColor={chartColors.calories} stopOpacity={0.05}/>
                      </linearGradient>
                      <linearGradient id="sugarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors.sugar} stopOpacity={0.35}/>
                        <stop offset="95%" stopColor={chartColors.sugar} stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...defaultGridProps} />
                    <XAxis dataKey="date" {...defaultXAxisProps} tickFormatter={(iso) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
                    <YAxis {...defaultYAxisProps} {...yAxisExtra} />
                    <Tooltip content={<CustomTooltip metric={metric} />} />
                    <Legend />
                    {metric !== 'sugar' && (
                      <Area type="monotone" dataKey="calories" name="Calories" stroke={chartColors.calories} fillOpacity={1} fill="url(#calGradient)" />
                    )}
                    {metric !== 'calories' && (
                      <Area type="monotone" dataKey="sugar" name="Sugar (g)" stroke={chartColors.sugar} fillOpacity={1} fill="url(#sugarGradient)" />
                    )}
                    <ReferenceLines data={chartData} />
                    {goalCalories > 0 && (
                      <ReferenceLine y={goalCalories} stroke={chartColors.goalCalories} strokeDasharray="2 2" ifOverflow="extendDomain" label={{ value: `Goal Cal (${goalCalories})`, position: 'right', fill: chartColors.goalCalories, fontSize: 12 }} />
                    )}
                    {goalSugar > 0 && (
                      <ReferenceLine y={goalSugar} stroke={chartColors.goalSugar} strokeDasharray="2 2" ifOverflow="extendDomain" label={{ value: `Goal Sugar (${goalSugar}g)`, position: 'right', fill: chartColors.goalSugar, fontSize: 12 }} />
                    )}
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Meals List */}
            <div className="rounded-lg border p-6">
              <h3 className="text-xl font-bold mb-4">Recent Meals</h3>
              <div className="space-y-4">
                {meals.map((meal) => (
                  <div
                    key={meal.id}
                    className="border rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-semibold">{meal.mealType}</span>
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(meal.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getImpactColor(meal.impact)}`}
                      >
                        {meal.impact}
                      </span>
                    </div>
                    <p className="mb-3">{meal.mealText}</p>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Calories:</span>
                        <span className="ml-1 font-semibold">{safeNumber(meal.calories, 0).toFixed(0)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Carbs:</span>
                        <span className="ml-1 font-semibold">{safeNumber(meal.carbs, 0).toFixed(1)}g</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Protein:</span>
                        <span className="ml-1 font-semibold">{safeNumber(meal.protein, 0).toFixed(1)}g</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Fat:</span>
                        <span className="ml-1 font-semibold">{safeNumber(meal.fat, 0).toFixed(1)}g</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Sugar:</span>
                        <span className="ml-1 font-semibold">{safeNumber(meal.sugar, 0).toFixed(1)}g</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Fiber:</span>
                        <span className="ml-1 font-semibold">{safeNumber(meal.fiber, 0).toFixed(1)}g</span>
                      </div>
                    </div>
                    {meal.notes && (
                      <div className="mt-2 p-2 rounded text-sm bg-gray-100 dark:bg-gray-800/60 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                        <strong>AI Recommendation:</strong> {meal.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default MealHistory;

