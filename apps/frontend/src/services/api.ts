import axios from 'axios';
import type { ApiResponse } from '@concurso-ai/types';

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export function unwrapData<T>(response: { data: ApiResponse<T> }): T {
  const { data } = response.data;
  if (data === undefined || data === null) {
    throw new Error(response.data.error?.message ?? 'Resposta inválida da API');
  }
  return data;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const PUBLIC_ROUTES = [
  '/',
  '/landing',
  '/planos',
  '/login',
  '/register',
  '/help',
  '/metodologia',
  '/forgot-password',
  '/reset-password',
];

function isPublicRoute(pathname: string): boolean {
  if (pathname === '/') return true;
  return PUBLIC_ROUTES.some((route) => route !== '/' && pathname.startsWith(route));
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
          '/api/auth/refresh',
          { refreshToken },
        );

        if (data.success && data.data) {
          localStorage.setItem('accessToken', data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(originalRequest);
        }
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        if (!isPublicRoute(window.location.pathname)) {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  },
);
