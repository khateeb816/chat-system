import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Request interceptor to add the JWT token to headers
api.interceptors.request.use(
  (config) => {
    let token;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token');
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
