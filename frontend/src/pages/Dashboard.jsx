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
      let assessmentRes;
      try {
        assessmentRes = await assessmentAPI.getLatest();
      } catch (err) {
        if (err?.response?.status === 401) {
          removeAuthToken();
          navigate('/login');
          return;
        }
        if (!err.response) {
          try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/assessment/latest', {
              headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
              }
            });
            if (res.ok) {
              const data = await res.json();
              assessmentRes = { data };
            } else {
              assessmentRes = { data: { assessment: null } };
            }
          } catch (_) {
            assessmentRes = { data: { assessment: null } };
          }
        } else {
          assessmentRes = { data: { assessment: null } };
        }
      }

      let summaryRes;
      try {
        summaryRes = await mealsAPI.getSummary();
      } catch (err) {
        if (err?.response?.status === 401) {
          removeAuthToken();
          navigate('/login');
          return;
        }
        if (!err.response) {
          try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/meals/summary', {
              headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
              }
            });
            if (res.ok) {
              const data = await res.json();
              summaryRes = { data };
            } else {
              summaryRes = { data: { summary: { calories: 0, sugar: 0, mealCount: 0 } } };
            }
          } catch (_) {
            summaryRes = { data: { summary: { calories: 0, sugar: 0, mealCount: 0 } } };
          }
        } else {
          summaryRes = { data: { summary: { calories: 0, sugar: 0, mealCount: 0 } } };
        }
      }

      setAssessment(assessmentRes?.data?.assessment ?? null);
      setSummary(summaryRes?.data?.summary ?? { calories: 0, sugar: 0, mealCount: 0 });
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

  const downloadReport = async (days) => {
    try {
      let res;
      try {
        res = await mealsAPI.getReport(days);
      } catch (err) {
        if (err?.response?.status === 401) {
          removeAuthToken();
          navigate('/login');
          return;
        }
        // Fallback to fetch with Authorization
        const token = localStorage.getItem('token');
        const url = `/api/meals/report?days=${encodeURIComponent(days)}`;
        const r = await fetch(url, {
          headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
        });
        if (!r.ok) {
          const text = await r.text();
          throw new Error(text || `Report request failed (${r.status})`);
        }
        const data = await r.json();
        res = { data };
      }

      const { totals, perDay, advice, range, risks = [], advantages = [] } = res.data || {};
      const metrics = [
        { key: 'carbs', label: 'Carbs (g)', value: Number(totals?.carbs) || 0, color: '#3b82f6' },
        { key: 'protein', label: 'Protein (g)', value: Number(totals?.protein) || 0, color: '#10b981' },
        { key: 'fat', label: 'Fat (g)', value: Number(totals?.fat) || 0, color: '#f59e0b' },
        { key: 'sugar', label: 'Sugar (g)', value: Number(totals?.sugar) || 0, color: '#ef4444' },
        { key: 'fiber', label: 'Fiber (g)', value: Number(totals?.fiber) || 0, color: '#8b5cf6' },
      ];
      const sum = metrics.reduce((a, m) => a + m.value, 0) || 1;
      // Build SVG pie paths
      let acc = 0;
      const radius = 80;
      const cx = 100, cy = 100;
      const toXY = (angle) => {
        const rad = (angle - 90) * Math.PI / 180;
        return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
      };
      const segments = metrics.map((m) => {
        const angle = (m.value / sum) * 360;
        const start = acc;
        const end = acc + angle;
        acc = end;
        const largeArc = angle > 180 ? 1 : 0;
        const s = toXY(start);
        const e = toXY(end);
        const d = `M ${cx} ${cy} L ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y} Z`;
        return { d, color: m.color, label: m.label, value: m.value };
      });

      const fmt = (n, f=1) => (Number(n) || 0).toFixed(f);
      const from = new Date(range?.from || Date.now()).toLocaleDateString();
      const to = new Date(range?.to || Date.now()).toLocaleDateString();
      const title = days === 7 ? 'Weekly Nutrition Report' : 'Monthly Nutrition Report';

      const html = `<!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>${title}</title>
        <style>
          :root{
            --bg:#f8fafc; --card:#ffffff; --muted:#64748b; --text:#0f172a; --border:#e2e8f0;
            --p1:#3b82f6; --p2:#10b981; --p3:#f59e0b; --p4:#ef4444; --p5:#8b5cf6;
          }
          @page { size: A4; margin: 14mm; }
          *{box-sizing:border-box}
          body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; background:var(--bg); color:var(--text); padding:0; margin:0}
          .container{max-width:900px; margin:0 auto; padding:24px}
          .header{background:linear-gradient(135deg, #eef2ff, #ecfeff); border-bottom:1px solid var(--border); padding:24px}
          .title{font-size:28px; font-weight:800; margin:0 0 6px}
          .subtitle{color:var(--muted); font-size:14px}
          .section{background:var(--card); border:1px solid var(--border); border-radius:14px; padding:16px; margin:16px 0; box-shadow:0 1px 2px rgba(15,23,42,.04)}
          .section h2{margin:0 0 10px; font-size:18px}
          .grid{display:grid; grid-template-columns: repeat(auto-fit,minmax(160px,1fr)); gap:12px}
          .stat{padding:12px; border:1px solid var(--border); border-radius:10px}
          .stat .label{color:var(--muted); font-size:12px}
          .stat .value{font-size:18px; font-weight:700}
          .muted{color:var(--muted)}
          .legend{display:flex; flex-wrap:wrap; gap:8px; margin-top:8px}
          .pill{display:inline-flex; align-items:center; gap:6px; border:1px solid var(--border); border-radius:9999px; padding:4px 8px; font-size:12px}
          .btn{display:inline-block; padding:10px 14px; border:1px solid var(--border); border-radius:10px; text-decoration:none; color:var(--text); background:var(--card)}
          .flex{display:flex; gap:16px; align-items:center; flex-wrap:wrap}
          .pie{position:relative; width:240px; height:240px}
          .pie svg{display:block}
          .pie .center{position:absolute; inset:40px; background:var(--card); border-radius:50%; display:flex; align-items:center; justify-content:center; text-align:center; border:1px solid var(--border)}
          .kvs{display:grid; grid-template-columns:1fr 1fr; gap:8px}
          ul{margin:6px 0; padding-left:16px}
          footer{padding:16px; text-align:center; color:var(--muted); font-size:12px}
          @media print {.noprint{display:none} .container{padding:0} .section{page-break-inside:avoid}}
        </style>
      </head>
      <body>
        <div class="header">
          <div class="container">
            <div class="title">${title}</div>
            <div class="subtitle">Range: ${from} – ${to}</div>
          </div>
        </div>
        <div class="container">
          <div class="section">
            <h2>Overview</h2>
            <div class="grid">
              <div class="stat"><div class="label">Total Calories</div><div class="value">${fmt(totals?.calories,0)} kcal</div><div class="muted">Per day: ${fmt(perDay?.calories,0)} kcal</div></div>
              <div class="stat"><div class="label">Carbs</div><div class="value">${fmt(totals?.carbs,1)} g</div><div class="muted">Per day: ${fmt(perDay?.carbs,1)} g</div></div>
              <div class="stat"><div class="label">Protein</div><div class="value">${fmt(totals?.protein,1)} g</div><div class="muted">Per day: ${fmt(perDay?.protein,1)} g</div></div>
              <div class="stat"><div class="label">Fat</div><div class="value">${fmt(totals?.fat,1)} g</div><div class="muted">Per day: ${fmt(perDay?.fat,1)} g</div></div>
              <div class="stat"><div class="label">Sugar</div><div class="value">${fmt(totals?.sugar,1)} g</div><div class="muted">Per day: ${fmt(perDay?.sugar,1)} g</div></div>
              <div class="stat"><div class="label">Fiber</div><div class="value">${fmt(totals?.fiber,1)} g</div><div class="muted">Per day: ${fmt(perDay?.fiber,1)} g</div></div>
            </div>
          </div>

          <div class="section">
            <h2>Intake Composition</h2>
            <div class="flex">
              <div class="pie">
                <svg width="240" height="240" viewBox="0 0 200 200">
                  ${segments.map(s => `<path d="${s.d}" fill="${s.color}" />`).join('')}
                </svg>
                <div class="center">
                  <div>
                    <div class="muted" style="font-size:12px">Total (g)</div>
                    <div style="font-size:20px;font-weight:800">${fmt(sum,0)}</div>
                  </div>
                </div>
              </div>
              <div class="kvs">
                ${metrics.map(m => {
                  const pct = ((m.value / sum) * 100) || 0;
                  return `<div class="stat" style="border-color:${m.color}33">
                    <div class="label" style="color:${m.color}">${m.label}</div>
                    <div class="value">${fmt(m.value,1)} g</div>
                    <div class="muted">${fmt(pct,1)}%</div>
                  </div>`;
                }).join('')}
              </div>
            </div>
            <div class="legend">
              ${metrics.map(m => `<span class="pill"><span style="display:inline-block;width:10px;height:10px;background:${m.color};border-radius:2px"></span>${m.label}</span>`).join('')}
            </div>
          </div>

          <div class="section">
            <h2>AI Advice</h2>
            <p>${advice || '—'}</p>
          </div>
          ${(risks.length || advantages.length) ? `
          <div class="section">
            <h2>Risks & Advantages</h2>
            ${risks.length ? `<div><strong>Possible Risks if continued:</strong><ul>${risks.map(r => `<li>${r}</li>`).join('')}</ul></div>` : ''}
            ${advantages.length ? `<div style="margin-top:8px"><strong>Advantages:</strong><ul>${advantages.map(a => `<li>${a}</li>`).join('')}</ul></div>` : ''}
          </div>` : ''}

          <div class="section noprint" style="display:flex;justify-content:space-between;align-items:center">
            <a class="btn" href="#" onclick="window.print()">Print / Save as PDF</a>
            <span class="muted">Generated on ${new Date().toLocaleString()}</span>
          </div>
          <footer>Diabetes Risk & AI Nutrition Assistant – personal wellness summary</footer>
        </div>
      </body>
      </html>`;

      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = days === 7 ? 'weekly-nutrition-report.html' : 'monthly-nutrition-report.html';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
      }, 0);
    } catch (e) {
      setError(e?.message || 'Failed to generate report');
    }
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
            {[
              { icon: '🍎', title: 'Add Meal', desc: 'Log and analyze a meal', to: '/meals/add' },
              {
                icon: '📈', title: 'Weekly Intake', desc: 'View weekly calories & sugar', to: '/meals'
              }, {
                icon: '💬', title: 'AI Chat', desc: 'Get lifestyle guidance', to: '/chat'
              }, {
                icon: '🩺', title: 'Retake Test', desc: 'Update your assessment', to: '/questionnaire'
              }
            ].map((a) => (
              <Card key={a.title} className="hover:shadow-md transition cursor-pointer" onClick={() => navigate(a.to)}>
                <CardContent className="p-6">
                  <div className="text-3xl mb-2">{a.icon}</div>
                  <h3 className="font-semibold">{a.title}</h3>
                  <p className="text-sm text-muted-foreground">{a.desc}</p>
                </CardContent>
              </Card>
            ))}
            </div>

            {/* Report Download */}
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-2">Download Nutrition Report</h3>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => downloadReport(7)} className="px-3 py-2 rounded-md border hover:bg-gray-100">Weekly (7 days)</button>
                <button onClick={() => downloadReport(30)} className="px-3 py-2 rounded-md border hover:bg-gray-100">Monthly (30 days)</button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Generates a report with totals, per‑day averages, a pie chart, and AI advice. Use the browser's Print dialog to save as PDF.</p>
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

