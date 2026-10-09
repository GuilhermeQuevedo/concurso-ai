import { api, unwrapData } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';

export interface AccessStatus {
  active: boolean;
  enforced: boolean;
  status: 'NONE' | 'ACTIVE' | 'CANCELED' | 'EXPIRED' | 'REFUNDED' | 'ADMIN';
  expiresAt: string | null;
  checkoutUrl: string;
}

export const subscriptionService = {
  async getAccess(): Promise<AccessStatus> {
    const response = await api.get<ApiResponse<AccessStatus>>('/payments/me');
    return unwrapData(response);
  },
};
