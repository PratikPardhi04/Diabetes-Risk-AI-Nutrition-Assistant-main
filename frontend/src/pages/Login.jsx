import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { setAuthToken, setUser } from '../utils/auth';
import LoadingSpinner from '../components/LoadingSpinner';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        email: (formData.email || '').trim(),
        password: (formData.password || '').trim(),
      };
      try {
        const response = await authAPI.login(payload);
        setAuthToken(response.data.token);
        setUser(response.data.user);
        navigate('/dashboard');
        return;
      } catch (err) {
        // Fallback: some mobile setups reject axios but allow fetch
        if (!err.response) {
          try {
            const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            if (!res.ok) {
              const text = await res.text();
              throw new Error(`Fetch fallback failed (${res.status}). ${text || ''}`);
            }
            const data = await res.json();
            setAuthToken(data.token);
            setUser(data.user);
            navigate('/dashboard');
            return;
          } catch (fallbackErr) {
            const networkMsg = fallbackErr?.message || 'Network error';
            setError(`Login failed. ${networkMsg}`);
            return;
          }
        }
        const status = err.response?.status;
        const msg = err.response?.data?.message;
        const firstValidation = err.response?.data?.errors?.[0]?.msg;
        setError(firstValidation || msg || (status ? `Login failed (status ${status}). Please try again.` : 'Login failed. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Login</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full h-10">
                {loading ? <LoadingSpinner size="sm" /> : 'Login'}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
;

export default Login;

