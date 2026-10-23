import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, Sparkles, RefreshCw, LogOut, CreditCard, Loader2 } from 'lucide-react';
import { subscriptionService } from '../services/subscription.service';
import { useStripeBilling } from '../hooks/useStripeBilling';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const { config, startCheckout, isStartingCheckout } = useStripeBilling();

  const { data, isLoading } = useQuery({
    queryKey: ['subscription-access'],
    queryFn: subscriptionService.getAccess,
    staleTime: 60 * 1000,
  });

  // Enquanto carrega, ou quando o bloqueio não está ativo / já tem acesso: libera
  if (isLoading || !data || !data.enforced || data.active) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-950">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 dark:bg-primary-950">
          <Lock className="h-7 w-7 text-primary-600" />
        </div>
        <h1 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">Acesso exclusivo para assinantes</h1>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          Assine o Engrama para liberar questões com IA, flashcards, redações e seu plano de estudos completo.
        </p>

        <div className="space-y-2.5">
          {config?.isConfigured && (
            <button
              onClick={() => startCheckout()}
              disabled={isStartingCheckout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-indigo-700 disabled:opacity-50"
            >
              {isStartingCheckout ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Abrindo Stripe Checkout...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Assinar com Stripe (Cartão)
                </>
              )}
            </button>
          )}

          {data.checkoutUrl ? (
            <a
              href={data.checkoutUrl}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              <Sparkles className="h-4 w-4" />
              Assinar via Kiwify
            </a>
          ) : !config?.isConfigured ? (
            <p className="rounded-lg border border-dashed border-gray-300 p-3 text-xs text-gray-500 dark:border-gray-700">
              O link de assinatura ainda não foi configurado.
            </p>
          ) : null}
        </div>

        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Já assinou? Use o <span className="font-medium">mesmo e-mail</span> da compra
          {user?.email ? <> (<span className="font-medium">{user.email}</span>)</> : null} e clique em atualizar.
        </p>

        <div className="mt-4 flex items-center justify-center gap-4 text-xs">
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['subscription-access'] })}
            className="flex items-center gap-1.5 font-medium text-primary-600 hover:text-primary-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Já paguei, atualizar
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
