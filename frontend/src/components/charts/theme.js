export const chartColors = {
  calories: '#0ea5e9', // primary-500
  sugar: '#f97316', // orange-500
  grid: '#e5e7eb', // gray-200
  axis: '#9ca3af', // gray-400
  goalCalories: '#0369a1', // primary-700
  goalSugar: '#ea580c', // orange-600
};

export const defaultGridProps = {
  strokeDasharray: '3 3',
  stroke: chartColors.grid,
};

export const defaultXAxisProps = {
  tickLine: false,
  axisLine: false,
  stroke: chartColors.axis,
};

export const defaultYAxisProps = {
  tickLine: false,
  axisLine: false,
  stroke: chartColors.axis,
};

export const formatNumber = (v, digits = 0) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '0';
  return n.toFixed(digits);
};

// Build an ISO date key (YYYY-MM-DD) in local timezone (no time component)
export const dateKey = (date) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = d.getMonth();
  const day = d.getDate();
  const localMidnight = new Date(y, m, day);
  const iso = new Date(localMidnight.getTime() - localMidnight.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
  return iso;
};
