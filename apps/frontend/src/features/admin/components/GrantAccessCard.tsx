import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, UserCheck } from 'lucide-react';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from '@/components/ui/toast-store';
import { getErrorMessage } from '@/utils/error-message';

import { adminService, type ManualAccessEntry } from '../services/admin.service';

const DURATIONS = [
  { value: '30', label: '30 dias' },
  { value: '90', label: '90 dias' },
  { value: '180', label: '6 meses' },
  { value: '365', label: '1 ano' },
  { value: '', label: 'Sem prazo' },
];

const FIELD_CLASS =
  'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white';

// Libera a plataforma para uma pessoa sem passar pelo pagamento. Vale mesmo antes de ela criar conta.
export function GrantAccessCard() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [days, setDays] = useState('30');

  const [revokeTarget, setRevokeTarget] = useState<ManualAccessEntry | null>(null);
  const { data: granted = [] } = useQuery({
    queryKey: ['admin-access'],
    queryFn: adminService.listAccess,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-access'] });
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
  };

  const revoke = useMutation({
    mutationFn: (target: string) => adminService.revokeAccess(target),
    onSuccess: () => {
      toast.success('Acesso removido.');
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Não foi possível remover o acesso.')),
    onSettled: () => setRevokeTarget(null),
  });

  const grant = useMutation({
    mutationFn: () => adminService.grantAccess(email.trim(), days ? Number(days) : undefined),
    onSuccess: (result) => {
      toast.success(`Acesso liberado para ${result.email}.`);
      setEmail('');
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Não foi possível liberar o acesso.')),
  });

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (email.trim()) grant.mutate();
        }}
      >
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          <UserCheck className="h-4 w-4 text-primary-600" /> Liberar acesso
        </h2>
        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
          Informe o e-mail da pessoa. Se ela ainda não tem conta, o acesso já fica esperando no
          primeiro login.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemplo.com"
            aria-label="E-mail da pessoa"
            className={`${FIELD_CLASS} min-w-0 flex-1`}
          />
          <select
            value={days}
            onChange={(e) => setDays(e.target.value)}
            aria-label="Duração do acesso"
            className={FIELD_CLASS}
          >
            {DURATIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={grant.isPending}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {grant.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Liberar
          </button>
        </div>
      </form>

      {granted.length > 0 && (
        <ul className="mt-4 divide-y divide-gray-100 border-t border-gray-100 dark:divide-gray-800 dark:border-gray-800">
          {granted.map((entry) => (
            <li
              key={entry.email}
              className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
            >
              <span className="min-w-0 truncate text-gray-800 dark:text-gray-200">
                {entry.email}
                {!entry.hasAccount && (
                  <span className="ml-2 text-xs text-amber-600">ainda não criou conta</span>
                )}
              </span>
              <span className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                {entry.expiresAt
                  ? `até ${new Date(entry.expiresAt).toLocaleDateString('pt-BR')}`
                  : 'sem prazo'}
                <button
                  type="button"
                  onClick={() => setRevokeTarget(entry)}
                  className="font-medium text-red-600 hover:text-red-500"
                >
                  Remover acesso
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {revokeTarget && (
        <ConfirmDialog
          title="Remover acesso?"
          message={
            <>
              <strong className="text-gray-900 dark:text-white">{revokeTarget.email}</strong> perde
              o acesso à plataforma agora.
            </>
          }
          confirmLabel="Remover acesso"
          isPending={revoke.isPending}
          onCancel={() => setRevokeTarget(null)}
          onConfirm={() => revoke.mutate(revokeTarget.email)}
        />
      )}
    </div>
  );
}
