import { api, unwrapData } from '@/services/api';
import type { ApiResponse, AuthTokens, RegisterRequest, LoginRequest } from '@concurso-ai/types';
import type { User } from '@concurso-ai/types';

export const authService = {
  async register(data: RegisterRequest): Promise<AuthTokens> {
    const response = await api.post<ApiResponse<AuthTokens>>('/auth/register', data);
    return unwrapData(response);
  },

  async login(data: LoginRequest): Promise<AuthTokens> {
    const response = await api.post<ApiResponse<AuthTokens>>('/auth/login', data);
    return unwrapData(response);
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const response = await api.post<ApiResponse<AuthTokens>>('/auth/refresh', { refreshToken });
    return unwrapData(response);
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post('/auth/logout', { refreshToken });
  },

  async getProfile(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/profile');
    return unwrapData(response);
  },

  async updateProfile(data: { name?: string; dailyGoal?: number }): Promise<User> {
    const response = await api.patch<ApiResponse<User>>('/auth/profile', data);
    return unwrapData(response);
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    await api.patch('/auth/password', data);
  },

  async changeEmail(data: { newEmail: string; password: string }): Promise<User> {
    const response = await api.patch<ApiResponse<User>>('/auth/email', data);
    return unwrapData(response);
  },

  async setPause(days: number): Promise<User> {
    const response = await api.patch<ApiResponse<User>>('/auth/pause', { days });
    return unwrapData(response);
  },

  async resetAccount(password: string): Promise<void> {
    await api.post('/auth/reset-account', { password });
  },
};
