import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assessmentAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Footer from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Questionnaire = () => {
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    height: '',
    weight: '',
    familyHistory: false,
    activity: '',
    smoking: false,
    alcohol: '',
    diet: '',
    sleep: '',
    symptoms: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [predicting, setPredicting] = useState(false);
  const navigate = useNavigate();

  const symptomOptions = [
    'thirst',
    'frequent urination',
    'fatigue',
    'sudden weight change',
    'blurry vision',
    'slow healing wounds',
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    setError('');
  };

  const handleSymptomChange = (symptom) => {
    setFormData({
      ...formData,
      symptoms: formData.symptoms.includes(symptom)
        ? formData.symptoms.filter((s) => s !== symptom)
        : [...formData.symptoms, symptom],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Submit assessment
      const payload = {
        ...formData,
        age: parseInt(formData.age),
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        sleep: parseInt(formData.sleep),
      };

      let assessmentId;
      try {
        const submitResponse = await assessmentAPI.submit(payload);
        assessmentId = submitResponse.data.assessment.id;
      } catch (err) {
        // Fallback with fetch including Authorization header
        if (!err.response) {
          try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/assessment/submit', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
              },
              body: JSON.stringify(payload)
            });
            const text = await res.text();
            if (!res.ok) throw new Error(`Submit failed (${res.status}). ${text}`);
            const data = JSON.parse(text);
            assessmentId = data.assessment.id;
          } catch (fallbackErr) {
            setError(fallbackErr?.message || 'Failed to submit assessment. Please try again.');
            return;
          }
        } else {
          const status = err.response?.status;
          const msg = err.response?.data?.message;
          const firstValidation = err.response?.data?.errors?.[0]?.msg;
          setError(firstValidation || msg || (status ? `Failed to submit assessment (status ${status}).` : 'Failed to submit assessment.'));
          return;
        }
      }

      // Get AI prediction
      setPredicting(true);
      try {
        await assessmentAPI.predict(assessmentId);
      } catch (err) {
        // Fallback to fetch with Authorization
        if (!err.response) {
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
            if (!res.ok) throw new Error(`Prediction failed (${res.status}). ${text}`);
          } catch (fallbackErr) {
            setError(fallbackErr?.message || 'Failed to get prediction. Please try again.');
            return;
          }
        } else {
          const status = err.response?.status;
          const msg = err.response?.data?.message;
          const firstValidation = err.response?.data?.errors?.[0]?.msg;
          setError(firstValidation || msg || (status ? `Prediction failed (status ${status}).` : 'Failed to get prediction.'));
          return;
        }
      }

      navigate('/dashboard');
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      const firstValidation = err.response?.data?.errors?.[0]?.msg;
      setError(firstValidation || msg || (status ? `Failed (status ${status}). Please try again.` : 'Failed. Please try again.'));
    } finally {
      setLoading(false);
      setPredicting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Health Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {predicting && (
              <div className="mb-4 rounded-md border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
                <LoadingSpinner size="sm" />
                <span>Getting AI prediction...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="age">Age *</Label>
                  <Input id="age" type="number" name="age" value={formData.age} onChange={handleChange} required min="1" max="150" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="gender">Gender *</Label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="w-full h-10 rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="height">Height (cm) *</Label>
                  <Input id="height" type="number" name="height" value={formData.height} onChange={handleChange} required min="1" step="0.1" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="weight">Weight (kg) *</Label>
                  <Input id="weight" type="number" name="weight" value={formData.weight} onChange={handleChange} required min="1" step="0.1" />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="familyHistory" checked={formData.familyHistory} onChange={handleChange} />
                  <span className="text-sm">Family history of diabetes</span>
                </label>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="activity">Activity Level *</Label>
                <select
                  id="activity"
                  name="activity"
                  value={formData.activity}
                  onChange={handleChange}
                  required
                  className="w-full h-10 rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select</option>
                  <option value="Sedentary">Sedentary</option>
                  <option value="Light">Light</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Active">Active</option>
                  <option value="Very Active">Very Active</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="smoking" checked={formData.smoking} onChange={handleChange} />
                  <span className="text-sm">Smoking</span>
                </label>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="alcohol">Alcohol Consumption *</Label>
                <select
                  id="alcohol"
                  name="alcohol"
                  value={formData.alcohol}
                  onChange={handleChange}
                  required
                  className="w-full h-10 rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select</option>
                  <option value="None">None</option>
                  <option value="Rare">Rare</option>
                  <option value="Frequent">Frequent</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="diet">Diet Type *</Label>
                <select
                  id="diet"
                  name="diet"
                  value={formData.diet}
                  onChange={handleChange}
                  required
                  className="w-full h-10 rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sleep">Sleep Hours *</Label>
                <Input id="sleep" type="number" name="sleep" value={formData.sleep} onChange={handleChange} required min="1" max="24" />
              </div>

              <div>
                <Label>Symptoms (Select all that apply)</Label>
                <div className="mt-2 space-y-2">
                  {symptomOptions.map((symptom) => (
                    <label key={symptom} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.symptoms.includes(symptom)}
                        onChange={() => handleSymptomChange(symptom)}
                      />
                      <span className="text-sm capitalize">{symptom}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button type="submit" disabled={loading || predicting} className="w-full h-10">
                {loading || predicting ? <LoadingSpinner size="sm" /> : 'Submit Assessment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default Questionnaire;

