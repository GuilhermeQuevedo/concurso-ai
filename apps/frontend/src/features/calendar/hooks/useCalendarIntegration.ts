import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarIntegrationService } from '../services/calendar-integration.service';
import type { UpdateCalendarIntegrationPayload } from '../types/integration';

export function useCalendarIntegration() {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const isGoogleAuth = params.get('google_auth') === 'callback' || Boolean(code);

    if (code && isGoogleAuth) {
      calendarIntegrationService
        .sendGoogleAuthCode(code)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['calendar-integration'] });
          showFeedback('Conta Google conectada com sucesso!');
          window.history.replaceState({}, '', window.location.pathname);
        })
        .catch(() => {
          showFeedback('Falha ao autenticar com Google Calendar.');
          window.history.replaceState({}, '', window.location.pathname);
        });
    }
  }, [queryClient]);

  const {
    data: integration,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['calendar-integration'],
    queryFn: calendarIntegrationService.getIntegration,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (payload: UpdateCalendarIntegrationPayload) =>
      calendarIntegrationService.updateSettings(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['calendar-integration'], updated);
      showFeedback('Configurações salvas com sucesso!');
    },
    onError: () => {
      showFeedback('Erro ao salvar configurações.');
    },
  });

  const regenerateTokenMutation = useMutation({
    mutationFn: calendarIntegrationService.regenerateToken,
    onSuccess: (updated) => {
      queryClient.setQueryData(['calendar-integration'], updated);
      showFeedback('Nova chave de calendário gerada com sucesso!');
    },
    onError: () => {
      showFeedback('Erro ao regerar chave.');
    },
  });

  const syncGoogleMutation = useMutation({
    mutationFn: calendarIntegrationService.syncGoogle,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['calendar-integration'] });
      showFeedback(`${result.syncedEventsCount} evento(s) sincronizado(s) com o Google Calendar!`);
    },
    onError: () => {
      showFeedback('Falha ao sincronizar com Google Calendar.');
    },
  });

  const disconnectGoogleMutation = useMutation({
    mutationFn: calendarIntegrationService.disconnectGoogle,
    onSuccess: (updated) => {
      queryClient.setQueryData(['calendar-integration'], updated);
      showFeedback('Google Calendar desconectado.');
    },
    onError: () => {
      showFeedback('Erro ao desconectar Google Calendar.');
    },
  });

  const showFeedback = (message: string) => {
    setFeedbackMessage(message);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showFeedback('Link copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showFeedback('Não foi possível copiar automaticamente. Selecione e copie o texto.');
    }
  };

  const openGoogleCalendarWeb = () => {
    if (!integration?.googleCalendarWebUrl) return;
    window.open(integration.googleCalendarWebUrl, '_blank', 'noopener,noreferrer');
  };

  const startGoogleOAuth = async () => {
    try {
      const { authUrl, isConfigured } = await calendarIntegrationService.getGoogleAuthUrl();
      if (!isConfigured || !authUrl) {
        showFeedback('A integração OAuth direta do Google não está configurada no servidor.');
        return;
      }
      window.location.href = authUrl;
    } catch {
      showFeedback('Erro ao iniciar conexão com o Google.');
    }
  };

  return {
    integration,
    isLoading,
    error,
    copied,
    feedbackMessage,
    isUpdating: updateSettingsMutation.isPending,
    isRegenerating: regenerateTokenMutation.isPending,
    isSyncing: syncGoogleMutation.isPending,
    isDisconnecting: disconnectGoogleMutation.isPending,
    updateSettings: updateSettingsMutation.mutate,
    regenerateToken: regenerateTokenMutation.mutate,
    syncGoogle: syncGoogleMutation.mutate,
    disconnectGoogle: disconnectGoogleMutation.mutate,
    copyToClipboard,
    openGoogleCalendarWeb,
    startGoogleOAuth,
  };
}
