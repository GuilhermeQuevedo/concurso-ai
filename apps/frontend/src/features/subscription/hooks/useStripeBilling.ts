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
    onError: () => {
      setErrorMessage('Erro ao iniciar o checkout seguro da Stripe.');
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
    onError: () => {
      setErrorMessage('Erro ao abrir portal de faturamento da Stripe.');
    },
  });

  const clearError = () => setErrorMessage(null);

  const startCheckout = (params?: StartCheckoutParams) => {
    checkoutMutation.mutate(params);
  };

  const openCustomerPortal = () => {
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
