export type StripePlanType = 'monthly' | 'semestral' | 'yearly' | 'default';

export interface StripePlanConfig {
  priceId: string | null;
  interval: string;
}

export interface StripeConfig {
  publishableKey: string;
  isConfigured: boolean;
  plans: {
    monthly: StripePlanConfig;
    semestral?: StripePlanConfig;
    yearly: StripePlanConfig;
  };
}

export interface CheckoutSessionResponse {
  id: string;
  url: string | null;
}

export interface PortalSessionResponse {
  url: string;
}

export interface StripeInvoice {
  id: string;
  number: string | null;
  amountDue: number;
  amountPaid: number;
  currency: string;
  status: string | null;
  created: number;
  pdfUrl: string | null;
  hostedInvoiceUrl: string | null;
}
