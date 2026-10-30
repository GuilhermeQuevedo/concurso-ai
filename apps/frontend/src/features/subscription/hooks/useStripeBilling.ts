import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { stripeService } from '../services/stripe.service';
import type { StripePlanType } from '../types/stripe';
import { useAuth } from '@/features/auth/hooks/useAuth';

export interface StartCheckoutParams {
  planType?: StripePlanType;
  priceId?: string;
}

export function useStripeBilling() {
  const { user } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    data: config,
    isLoading: isLoadingConfig,
  } = useQuery({
    queryKey: ['stripe-config'],
    queryFn: stripeService.getConfig,
  });

  const {
    data: invoices = [],
    isLoading: isLoadingInvoices,
    refetch: refetchInvoices,
  } = useQuery({
    queryKey: ['stripe-invoices'],
    queryFn: stripeService.listInvoices,
    enabled: Boolean(user && config?.isConfigured),
  });

  const checkoutMutation = useMutation({
    mutationFn: (params?: StartCheckoutParams) =>
      stripeService.createCheckout(params?.planType ?? 'default', params?.priceId),
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        setErrorMessage('Sessão de checkout criada sem URL de redirecionamento.');
      }
    },
    onError: (err: unknown) => {
      const apiMessage =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
        (err as Error)?.message ??
        'Erro ao iniciar o checkout seguro da Stripe. Verifique as configurações.';
      setErrorMessage(apiMessage);
    },
  });

  const portalMutation = useMutation({
    mutationFn: stripeService.createPortalSession,
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        setErrorMessage('Portal do cliente indisponível no momento.');
      }
    },
    onError: (err: unknown) => {
      const apiMessage =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
        (err as Error)?.message ??
        'Erro ao abrir portal de faturamento da Stripe.';
      setErrorMessage(apiMessage);
    },
  });

  const clearError = () => setErrorMessage(null);

  const startCheckout = (params?: StartCheckoutParams) => {
    setErrorMessage(null);
    checkoutMutation.mutate(params);
  };

  const openCustomerPortal = () => {
    setErrorMessage(null);
    portalMutation.mutate();
  };

  return {
    config,
    invoices,
    isLoadingConfig,
    isLoadingInvoices,
    isStartingCheckout: checkoutMutation.isPending,
    isOpeningPortal: portalMutation.isPending,
    errorMessage,
    clearError,
    startCheckout,
    openCustomerPortal,
    refetchInvoices,
  };
}
