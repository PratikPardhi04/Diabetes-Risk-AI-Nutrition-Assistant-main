import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Debug() {
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [assessmentId, setAssessmentId] = useState(null);

  const doFetch = async (method) => {
    setResult('');
    setError('');
    try {
      const res = await fetch('/api/auth/ping', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method === 'POST' ? JSON.stringify({ from: 'debug' }) : undefined,
      });
      const text = await res.text();
      setResult(`${res.status} ${res.statusText}\n${text}`);
    } catch (e) {
      setError(e?.message || String(e));
    }
  };

  const submitAssessment = async () => {
    setResult('');
    setError('');
    setAssessmentId(null);
    try {
      const token = localStorage.getItem('token');
      const sample = {
        age: 30,
        gender: 'Male',
        height: 175,
        weight: 70,
        familyHistory: false,
        activity: 'Moderate',
        smoking: false,
        alcohol: 'None',
        diet: 'Mixed',
        sleep: 7,
        symptoms: ['thirst']
      };
      const res = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(sample)
      });
      const text = await res.text();
      setResult(`SUBMIT -> ${res.status} ${res.statusText}\n${text}`);
      if (res.ok) {
        const data = JSON.parse(text);
        setAssessmentId(data.assessment?.id || null);
      }
    } catch (e) {
      setError(e?.message || String(e));
    }
  };

  const predictAssessment = async () => {
    if (!assessmentId) {
      setError('No assessmentId. Run submit first.');
      return;
    }
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/assessment/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ assessmentId })
      });
      const text = await res.text();
      setResult(prev => `${prev}\n\nPREDICT -> ${res.status} ${res.statusText}\n${text}`.trim());
    } catch (e) {
      setError(e?.message || String(e));
    }
  };

  const testLogin = async () => {
    setResult('');
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });
      const text = await res.text();
      setResult(`LOGIN -> ${res.status} ${res.statusText}\n${text}`);
    } catch (e) {
      setError(e?.message || String(e));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Network Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <div><strong>Location:</strong> {typeof window !== 'undefined' ? window.location.origin : 'n/a'}</div>
            <div><strong>API base:</strong> /api (via Vite proxy)</div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => doFetch('GET')}>GET /api/auth/ping</Button>
            <Button onClick={() => doFetch('POST')} variant="secondary">POST /api/auth/ping</Button>
          </div>
          <div className="grid gap-2">
            <div className="text-sm font-medium mt-4">Login test</div>
            <input className="border rounded px-2 py-1" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="border rounded px-2 py-1" placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button onClick={testLogin}>POST /api/auth/login</Button>
          </div>
          <div className="grid gap-2 mt-6">
            <div className="text-sm font-medium">Assessment Debug</div>
            <Button onClick={submitAssessment}>POST /api/assessment/submit (sample)</Button>
            <Button onClick={predictAssessment} variant="secondary" disabled={!assessmentId}>
              POST /api/assessment/predict {assessmentId ? `(id ${assessmentId})` : ''}
            </Button>
          </div>
          {result && (
            <pre className="p-3 bg-muted rounded text-xs overflow-auto whitespace-pre-wrap">{result}</pre>
          )}
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
