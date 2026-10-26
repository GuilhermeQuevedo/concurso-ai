import { api, unwrapData } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';
import type {
  CalendarIntegration,
  UpdateCalendarIntegrationPayload,
  GoogleAuthUrlResponse,
  SyncGoogleResponse,
} from '../types/integration';

export const calendarIntegrationService = {
  async getIntegration(): Promise<CalendarIntegration> {
    const response = await api.get<ApiResponse<CalendarIntegration>>('/calendar/integration');
    return unwrapData(response);
  },

  async updateSettings(payload: UpdateCalendarIntegrationPayload): Promise<CalendarIntegration> {
    const response = await api.patch<ApiResponse<CalendarIntegration>>('/calendar/integration', payload);
    return unwrapData(response);
  },

  async regenerateToken(): Promise<CalendarIntegration> {
    const response = await api.post<ApiResponse<CalendarIntegration>>('/calendar/integration/regenerate-token');
    return unwrapData(response);
  },

  async getGoogleAuthUrl(): Promise<GoogleAuthUrlResponse> {
    const response = await api.get<ApiResponse<GoogleAuthUrlResponse>>('/calendar/google/auth-url');
    return unwrapData(response);
  },

  async sendGoogleAuthCode(code: string): Promise<CalendarIntegration> {
    const response = await api.post<ApiResponse<CalendarIntegration>>('/calendar/google/callback', { code });
    return unwrapData(response);
  },

  async syncGoogle(): Promise<SyncGoogleResponse> {
    const response = await api.post<ApiResponse<SyncGoogleResponse>>('/calendar/google/sync');
    return unwrapData(response);
  },

  async disconnectGoogle(): Promise<CalendarIntegration> {
    const response = await api.delete<ApiResponse<CalendarIntegration>>('/calendar/google/disconnect');
    return unwrapData(response);
  },
};
