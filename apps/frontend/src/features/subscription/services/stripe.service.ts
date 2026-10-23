import { api, unwrapData } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';
import type {
  StripeConfig,
  StripePlanType,
  CheckoutSessionResponse,
  PortalSessionResponse,
  StripeInvoice,
} from '../types/stripe';

export const stripeService = {
  async getConfig(): Promise<StripeConfig> {
    const response = await api.get<ApiResponse<StripeConfig>>('/payments/stripe/config');
    return unwrapData(response);
  },

  async createCheckout(planType: StripePlanType = 'default', priceId?: string): Promise<CheckoutSessionResponse> {
    const response = await api.post<ApiResponse<CheckoutSessionResponse>>('/payments/stripe/checkout', {
      planType,
      priceId,
    });
    return unwrapData(response);
  },

  async createPortalSession(): Promise<PortalSessionResponse> {
    const response = await api.post<ApiResponse<PortalSessionResponse>>('/payments/stripe/portal');
    return unwrapData(response);
  },

  async listInvoices(): Promise<StripeInvoice[]> {
    const response = await api.get<ApiResponse<StripeInvoice[]>>('/payments/stripe/invoices');
    return unwrapData(response);
  },
};
