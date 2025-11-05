import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assessmentAPI, mealsAPI } from '../services/api';
import { removeAuthToken } from '../utils/auth';
import LoadingSpinner from '../components/LoadingSpinner';
import Footer from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';


const Dashboard = () => {
  const [assessment, setAssessment] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assessmentRes, summaryRes] = await Promise.all([
        assessmentAPI.getLatest().catch(() => ({ data: { assessment: null } })),
        mealsAPI.getSummary().catch(() => ({ data: { summary: { calories: 0, sugar: 0, mealCount: 0 } } })),
      ]);

      setAssessment(assessmentRes.data.assessment);
      setSummary(summaryRes.data.summary);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    navigate('/');
  };

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-400';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-400';
      case 'high':
        return 'bg-red-100 text-red-800 border-red-400';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-400';
    }
  };

  // Coerce numeric values safely for rendering
  const safeNumber = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow container mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!assessment ? (
          <Card className="p-8 text-center">
            <CardHeader>
              <CardTitle className="text-2xl">Welcome!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-6">
                Complete the health assessment to get your diabetes risk analysis.
              </p>
              <Button onClick={() => navigate('/questionnaire')} className="h-10 px-6">Take Assessment</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Risk Summary Card */}
            <Card>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-0">
                <CardTitle className="text-2xl">Risk Assessment</CardTitle>
                <span
                  className={`px-3 py-1 rounded-full border text-sm font-medium ${getRiskColor(assessment.riskLevel)}`}
                >
                  {assessment.riskLevel || 'Pending'}
                </span>
              </CardHeader>
              <CardContent className="pt-4">
                {assessment.aiReason && (
                  <div className="space-y-2 text-sm whitespace-pre-line">
                    {assessment.aiReason}
                  </div>
                )}
                <div className="mt-4">
                  <Button onClick={() => navigate('/questionnaire')}>Retake Assessment</Button>
                </div>
              </CardContent>
            </Card>

            {/* Today's Nutrition Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Nutrition</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground mb-1">Total Calories</p>
                    <p className="text-3xl font-bold text-primary">
                      {safeNumber(summary?.calories, 0).toFixed(0)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground mb-1">Total Sugar (g)</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {safeNumber(summary?.sugar, 0).toFixed(1)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground mb-1">Meals Logged</p>
                    <p className="text-3xl font-bold text-emerald-600">
                      {safeNumber(summary?.mealCount, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Removed weekly intake chart by request */}

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[{
                icon: '🍎', title: 'Add Meal', desc: 'Log and analyze a meal', to: '/meals/add'
              }, {
                icon: '📈', title: 'Weekly Intake', desc: 'View weekly calories & sugar', to: '/meals'
              }, {
                icon: '💬', title: 'AI Chat', desc: 'Get lifestyle guidance', to: '/chat'
              }, {
                icon: '🩺', title: 'Retake Test', desc: 'Update your assessment', to: '/questionnaire'
              }].map((a) => (
                <Card key={a.title} className="hover:shadow-md transition cursor-pointer" onClick={() => navigate(a.to)}>
                  <CardContent className="p-6">
                    <div className="text-3xl mb-2">{a.icon}</div>
                    <h3 className="font-semibold">{a.title}</h3>
                    <p className="text-sm text-muted-foreground">{a.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
;

export default Dashboard;

