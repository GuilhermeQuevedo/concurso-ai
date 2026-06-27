import { api } from '@/services/api';
import type { ApiResponse, AuthTokens, RegisterRequest, LoginRequest } from '@concurso-ai/types';
import type { User } from '@concurso-ai/types';

export const authService = {
  async register(data: RegisterRequest): Promise<AuthTokens> {
    const response = await api.post<ApiResponse<AuthTokens>>('/auth/register', data);
    return response.data.data!;
  },

  async login(data: LoginRequest): Promise<AuthTokens> {
    const response = await api.post<ApiResponse<AuthTokens>>('/auth/login', data);
    return response.data.data!;
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const response = await api.post<ApiResponse<AuthTokens>>('/auth/refresh', { refreshToken });
    return response.data.data!;
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post('/auth/logout', { refreshToken });
  },

  async getProfile(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/profile');
    return response.data.data!;
  },
};
