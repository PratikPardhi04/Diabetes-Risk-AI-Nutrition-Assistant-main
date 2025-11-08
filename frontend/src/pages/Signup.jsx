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

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: (formData.name || '').trim(),
        email: (formData.email || '').trim(),
        password: (formData.password || '').trim(),
      };
      try {
        const response = await authAPI.signup(payload);
        setAuthToken(response.data.token);
        setUser(response.data.user);
        navigate('/dashboard');
      } catch (err) {
        if (!err.response) {
          try {
            const res = await fetch('/api/auth/signup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            const text = await res.text();
            if (!res.ok) throw new Error(text || `Signup failed (${res.status})`);
            const data = JSON.parse(text);
            setAuthToken(data.token);
            setUser(data.user);
            navigate('/dashboard');
          } catch (fallbackErr) {
            setError(fallbackErr?.message || 'Signup failed. Please try again.');
          }
        } else {
          const status = err.response?.status;
          const msg = err.response?.data?.message;
          const firstValidation = err.response?.data?.errors?.[0]?.msg;
          setError(firstValidation || msg || (status ? `Signup failed (status ${status}). Please try again.` : 'Signup failed. Please try again.'));
        }
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
            <CardTitle className="text-2xl text-center">Sign Up</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  autoCapitalize="words"
                  autoCorrect="off"
                  placeholder="Your full name"
                />
              </div>

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
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full h-10">
                {loading ? <LoadingSpinner size="sm" /> : 'Sign Up'}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Login
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

export default Signup;

