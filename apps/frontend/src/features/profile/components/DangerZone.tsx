import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PauseCircle, PlayCircle, RotateCcw, Loader2, AlertTriangle } from 'lucide-react';
import { authService } from '@/features/auth/services/auth.service';
import { useAuth } from '@/features/auth/hooks/useAuth';

const PAUSE_OPTIONS = [3, 7, 14];

interface ApiErr {
  response?: { data?: { error?: { message?: string } } };
}
function errMessage(e: unknown, fallback: string): string {
  return (e as ApiErr)?.response?.data?.error?.message ?? fallback;
}

export function DangerZone() {
  const { user, refreshProfile } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [password, setPassword] = useState('');

  const paused = !!user?.pausedUntil && new Date(user.pausedUntil) > new Date();
  const pausedUntilLabel = user?.pausedUntil ? new Date(user.pausedUntil).toLocaleDateString('pt-BR') : '';

  const pauseMut = useMutation({
    mutationFn: (days: number) => authService.setPause(days),
    onSuccess: () => refreshProfile(),
  });

  const resetMut = useMutation({
    mutationFn: () => authService.resetAccount(password),
    onSuccess: () => {
      window.location.href = '/dashboard';
    },
  });

  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-3 flex items-center gap-2">
          <PauseCircle className="h-4 w-4 text-primary-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Pausar metas e lembretes</h3>
        </div>
        {paused ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Pausado até <strong>{pausedUntilLabel}</strong> — sem notificações nem cobrança de metas.
            </p>
            <button
              onClick={() => pauseMut.mutate(0)}
              disabled={pauseMut.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {pauseMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
              Retomar agora
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">Tire um respiro sem perder a conta. Pausar por:</p>
            {PAUSE_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => pauseMut.mutate(d)}
                disabled={pauseMut.isPending}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {d} dias
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-red-200 bg-white p-5 dark:border-red-900/50 dark:bg-gray-900">
        <div className="mb-2 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Resetar conta</h3>
        </div>
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
          Apaga <strong>todos os seus dados de estudo</strong> (questões, flashcards, redações, objetivos, plano e progresso). Seu login e e-mail são mantidos. Esta ação não pode ser desfeita.
        </p>
        <button
          onClick={() => { setConfirmOpen(true); setPassword(''); }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
        >
          <RotateCcw className="h-4 w-4" />
          Resetar conta
        </button>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Confirmar reset</h3>
            </div>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Isso apaga seus dados de estudo permanentemente. Digite sua senha para confirmar.
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              className="mb-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {resetMut.isError && <p className="mb-2 text-xs text-red-500">{errMessage(resetMut.error, 'Falha ao resetar.')}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => resetMut.mutate()}
                disabled={!password || resetMut.isPending}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {resetMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Resetar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
