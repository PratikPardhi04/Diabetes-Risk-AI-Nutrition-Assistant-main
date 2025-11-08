import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mealsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Footer from '../components/Footer';
import useSpeechRecognition from '../hooks/useSpeechRecognition';

const MealEntry = () => {
  const [formData, setFormData] = useState({
    mealType: 'Breakfast',
    mealText: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const speech = useSpeechRecognition();
  const [speechLang, setSpeechLang] = useState(() => localStorage.getItem('speech_lang_meal') || 'en-IN');
  const [imageBase64, setImageBase64] = useState('');

  // When speech returns final transcript, append to mealText
  useEffect(() => {
    if (!speech.supported) return;
    const detach = speech.attachResultHandler((text) => {
      setFormData((prev) => ({
        ...prev,
        mealText: prev.mealText ? prev.mealText + ' ' + text : text,
      }));
    });
    return detach;
  }, [speech.supported]);

  // Apply language selection for speech and persist
  useEffect(() => {
    if (speech.setLang) speech.setLang(speechLang);
    localStorage.setItem('speech_lang_meal', speechLang);
  }, [speechLang]);

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
      try {
        const res = await mealsAPI.add({ ...formData, imageBase64: imageBase64 || undefined });
        const newId = res?.data?.meal?.id;
        navigate('/meals', { state: newId ? { highlightMealId: newId } : undefined });
        return;
      } catch (err) {
        if (!err.response) {
          try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/meals/add', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
              },
              body: JSON.stringify({ ...formData, imageBase64: imageBase64 || undefined })
            });
            const text = await res.text();
            if (!res.ok) throw new Error(text || `Request failed (${res.status})`);
            const data = JSON.parse(text || '{}');
            const newId = data?.meal?.id;
            navigate('/meals', { state: newId ? { highlightMealId: newId } : undefined });
            return;
          } catch (fallbackErr) {
            setError(fallbackErr?.message || 'Failed to add meal. Please try again.');
            return;
          }
        }
        setError(err.response?.data?.message || 'Failed to add meal. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImageBase64('');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxSize = 800;
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height > width && height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        } else if (width === height && width > maxSize) {
          width = maxSize;
          height = maxSize;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setImageBase64(dataUrl);
      };
      if (typeof reader.result === 'string') {
        img.src = reader.result;
      }
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow container mx-auto px-4 py-8 max-w-2xl">
        <h2 className="text-3xl font-bold mb-6">Add Meal</h2>

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-lg border p-6 space-y-6 dark:bg-black dark:border-white dark:text-white">
          <div>
            <label className="block text-sm font-medium mb-1">
              Meal Type *
            </label>
            <select
              name="mealType"
              value={formData.mealType}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-white dark:border-white dark:text-black"
            >
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
              <option value="Snack">Snack</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              What did you eat? *
            </label>
            <textarea
              name="mealText"
              value={formData.mealText}
              onChange={handleChange}
              required
              rows="6"
              placeholder="Describe your meal in detail. For example: 'Grilled chicken breast (200g), brown rice (1 cup), steamed broccoli (150g), and a side salad with olive oil dressing'"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-black dark:border-white dark:text-white placeholder:text-gray-600 dark:placeholder-white"
            />
            <div className="flex items-center gap-2 mt-2">
              <select
                value={speechLang}
                onChange={(e) => setSpeechLang(e.target.value)}
                className="px-2 py-2 border rounded-md text-sm dark:bg-white dark:border-white dark:text-black"
                title="Speech language"
              >
                <option value="en-IN">English (India)</option>
                <option value="hi-IN">Hindi (हिन्दी)</option>
                <option value="mr-IN">Marathi (मराठी)</option>
              </select>
              <button
                type="button"
                onClick={() => (speech.listening ? speech.stop() : speech.start())}
                title={speech.supported ? (speech.listening ? 'Stop voice input' : 'Start voice input') : 'Voice input not supported'}
                disabled={!speech.supported}
                className={`px-3 py-2 rounded-md border ${speech.listening ? 'bg-red-50 border-red-300 text-red-600' : 'bg-white dark:bg-black border-gray-300 dark:border-white text-gray-700 dark:text-white'} disabled:opacity-50`}
              >
                {speech.listening ? 'Stop Mic' : '🎤 Speak meal'}
              </button>
              {!speech.supported && (
                <span className="text-xs text-gray-500 dark:text-white">Voice input not supported in this browser</span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-white mt-1">
              Be as specific as possible for better nutrition analysis
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Upload meal photo (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-black dark:border-white dark:text-white file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-gray-100 dark:file:bg-white dark:file:text-black"
            />
            {imageBase64 && (
              <img src={imageBase64} alt="Meal preview" className="mt-2 h-32 w-auto rounded-md border dark:border-white" />
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-3 rounded-md font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" />
                Analyzing with AI...
              </span>
            ) : (
              'Analyze & Save Meal'
            )}
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default MealEntry;

