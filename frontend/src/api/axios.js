import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000/api';

const axiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir token si existe
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers['Authorization'] = 'Bearer ' + token;
  }
  return config;
});

export default axiosInstance;
