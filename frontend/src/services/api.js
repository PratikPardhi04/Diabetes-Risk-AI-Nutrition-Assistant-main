import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined'
  ? `${window.location.origin}/api`
  : '/api');

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Assessment API
export const assessmentAPI = {
  submit: (data) => api.post('/assessment/submit', data),
  predict: (assessmentId) => api.post('/assessment/predict', { assessmentId }),
  getLatest: () => api.get('/assessment/latest'),
};

// Meals API
export const mealsAPI = {
  add: (data) => api.post('/meals/add', data),
  getAll: (params) => api.get('/meals', { params }),
  getSummary: (date) => api.get('/meals/summary', { params: { date } }),
  getReport: (days) => api.get('/meals/report', { params: { days } }),
};

// Chat API
export const chatAPI = {
  send: (question) => api.post('/chat', { question }),
  getHistory: (params) => api.get('/chat', { params }),
};

export default api;

