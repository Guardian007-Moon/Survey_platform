import axios from 'axios';

// Use VITE_API_URL if defined, fallback to local dev, or relative /api in production
const API_URL = import.meta.env.VITE_API_URL || 
                (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api');

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default api;
