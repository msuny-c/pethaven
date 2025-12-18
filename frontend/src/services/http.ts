import axios from 'axios';
import { AuthUser } from '../types';
import { refreshSession } from './api';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

let isRefreshing = false;
let refreshQueue: Array<() => void> = [];

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
      if (isRefreshing) {
        await new Promise<void>(resolve => refreshQueue.push(resolve));
        return api(originalRequest);
      }
      isRefreshing = true;
      originalRequest._retry = true;
      try {
        const stored = localStorage.getItem('petHavenUser');
        if (!stored) throw error;
        const user = JSON.parse(stored) as AuthUser;
        const refreshed = await refreshSession(user.refreshToken);
        localStorage.setItem('petHavenUser', JSON.stringify(refreshed));
        window.dispatchEvent(new CustomEvent('auth:refreshed', { detail: refreshed }));
        isRefreshing = false;
        refreshQueue.forEach(resolve => resolve());
        refreshQueue = [];
        return api({
          ...originalRequest,
          headers: {
            ...(originalRequest.headers || {}),
            Authorization: `Bearer ${refreshed.accessToken}`
          }
        });
      } catch (e) {
        isRefreshing = false;
        refreshQueue = [];
        localStorage.removeItem('petHavenUser');
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export { api };
