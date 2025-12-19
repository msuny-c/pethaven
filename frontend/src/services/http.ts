import axios from 'axios';
import { AuthUser } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

let isRefreshing = false;

api.interceptors.request.use(config => {
  const stored = localStorage.getItem('petHavenUser');
  if (stored) {
    const user = JSON.parse(stored) as AuthUser;
    if (user.accessToken) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${user.accessToken}`
      };
    }
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      isRefreshing = false;
      localStorage.removeItem('petHavenUser');
    }
    return Promise.reject(error);
  }
);

export { api };
