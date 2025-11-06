import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000/api';

const axiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add access token if available
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers['Authorization'] = 'Bearer ' + token;
  }
  return config;
});

// Response interceptor: Handle token refresh on 401 errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          // Refresh the access token
          const res = await axios.post(`${API_BASE}/token/refresh/`, { refresh: refreshToken });
          localStorage.setItem('access_token', res.data.access);
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${res.data.access}`;
          error.config.headers['Authorization'] = `Bearer ${res.data.access}`;
          return axiosInstance(error.config);  // Retry the original request
        } catch (refreshError) {
          // Refresh failed: Clear tokens and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';  // Adjust if using React Router
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;