import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/portal')) {
      // Don't clear or redirect if it's already on login page or portal page
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('pm_token');
        localStorage.removeItem('pm_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
