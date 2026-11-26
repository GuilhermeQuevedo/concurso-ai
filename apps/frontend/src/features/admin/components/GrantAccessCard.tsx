import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, UserCheck, Trash2, Calendar } from 'lucide-react';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from '@/components/ui/toast-store';
import { getErrorMessage } from '@/utils/error-message';

import { adminService, type ManualAccessEntry } from '../services/admin.service';

const DURATIONS = [
  { value: '30', label: '30 dias' },
  { value: '90', label: '90 dias' },
  { value: '180', label: '6 meses' },
  { value: '365', label: '1 ano' },
  { value: '', label: 'Sem prazo (Vitalício)' },
];

const FIELD_BASE =
  'min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-base sm:text-sm text-slate-900 focus:border-[#2E8C82] focus:outline-none focus:ring-2 focus:ring-[#2E8C82]/20 transition-colors duration-fast dark:border-slate-700 dark:bg-slate-800 dark:text-white';

// Libera a plataforma para uma pessoa sem passar pelo gateway de pagamento.
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
      toast.success('Acesso removido com sucesso.');
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Não foi possível remover o acesso.')),
    onSettled: () => setRevokeTarget(null),
  });

  const grant = useMutation({
    mutationFn: () => adminService.grantAccess(email.trim(), days ? Number(days) : undefined),
    onSuccess: (result) => {
      toast.success(`Acesso liberado com sucesso para ${result.email}.`);
      setEmail('');
      refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Não foi possível liberar o acesso.')),
  });

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 motion-safe:animate-in motion-safe:fade-in duration-fast">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (email.trim()) grant.mutate();
        }}
      >
        <div className="mb-2 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2E8C82]/10 text-[#2E8C82] dark:bg-[#2E8C82]/20 dark:text-[#38b2a6]">
            <UserCheck className="h-4 w-4" />
          </span>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Liberar acesso manual (VIP / Cortesia)
          </h2>
        </div>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          Informe o e-mail do aluno. Se ele ainda não criou conta, a bolsa/isenção fica vinculada e é ativada no primeiro login.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="aluno@exemplo.com"
            aria-label="E-mail do beneficiário"
            className={`${FIELD_BASE} min-w-0 flex-1`}
          />
          <select
            value={days}
            onChange={(e) => setDays(e.target.value)}
            aria-label="Duração do acesso"
            className={FIELD_BASE}
          >
            {DURATIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={grant.isPending || !email.trim()}
            className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#2E8C82] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#26776f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] focus-visible:ring-offset-2 active:scale-95 transition-all duration-fast disabled:opacity-50 shadow-xs touch-manipulation"
          >
            {grant.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Liberar Acesso
          </button>
        </div>
      </form>

      {granted.length > 0 && (
        <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Acessos manuais ativos ({granted.length})
          </h3>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {granted.map((entry) => (
              <li
                key={entry.email}
                className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm"
              >
                <div className="min-w-0 flex items-center gap-2">
                  <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                    {entry.email}
                  </span>
                  {!entry.hasAccount && (
                    <span className="rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                      pendente de cadastro
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1 font-mono">
                    <Calendar className="h-3.5 w-3.5" />
                    {entry.expiresAt
                      ? `até ${new Date(entry.expiresAt).toLocaleDateString('pt-BR')}`
                      : 'vitalício'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRevokeTarget(entry)}
                    className="min-h-[38px] inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 active:scale-95 transition-all duration-fast dark:text-rose-400 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {revokeTarget && (
        <ConfirmDialog
          title="Remover acesso manual?"
          message={
            <>
              O usuário <strong className="text-slate-900 dark:text-white">{revokeTarget.email}</strong> terá sua liberação manual revogada imediatamente.
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
