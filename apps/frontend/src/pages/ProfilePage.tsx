import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Target,
  Moon,
  Sun,
  HelpCircle,
  FlaskConical,
  CreditCard,
  LogOut,
  Pencil,
  Loader2,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/auth.service';
import { subscriptionService } from '@/features/subscription/services/subscription.service';
import { NotificationsCard } from '@/features/notifications/NotificationsCard';
import { AccountSecurity } from '@/features/profile/components/AccountSecurity';

const PLAN_LABEL: Record<string, string> = {
  NONE: 'Sem assinatura',
  ACTIVE: 'Ativo',
  CANCELED: 'Cancelado',
  EXPIRED: 'Expirado',
  REFUNDED: 'Reembolsado',
  ADMIN: 'Acesso total (admin)',
};

export function ProfilePage() {
  const { user, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.name ?? '');
  const [goalValue, setGoalValue] = useState(user?.dailyGoal ?? 30);
  const [goalSaved, setGoalSaved] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  const { data: access } = useQuery({ queryKey: ['access'], queryFn: subscriptionService.getAccess });

  const nameMut = useMutation({
    mutationFn: () => authService.updateProfile({ name: nameValue.trim() }),
    onSuccess: async () => { setEditingName(false); await refreshProfile(); },
  });

  const goalMut = useMutation({
    mutationFn: () => authService.updateProfile({ dailyGoal: goalValue }),
    onSuccess: async () => { setGoalSaved(true); await refreshProfile(); },
  });

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch { /* ignore */ }
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const memberDays = user?.createdAt
    ? Math.max(0, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000))
    : 0;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Perfil</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-3xl font-bold text-white">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          {editingName ? (
            <div className="mx-auto flex max-w-xs items-center gap-2">
              <input
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-center text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <button onClick={() => nameMut.mutate()} disabled={!nameValue.trim() || nameMut.isPending} className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">
                {nameMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Salvar'}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name}</h2>
              <button onClick={() => { setNameValue(user?.name ?? ''); setEditingName(true); }} className="text-gray-400 hover:text-primary-600">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
          {user?.role === 'ADMIN' && (
            <span className="mt-2 inline-block rounded bg-primary-100 px-2 py-0.5 text-[11px] font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-300">admin</span>
          )}
          <p className="mt-4 text-xs text-gray-400">No Engrama há {memberDays} dia{memberDays === 1 ? '' : 's'}</p>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Minhas metas</h3>
            </div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Meta diária (questões/revisões)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={5}
                max={500}
                value={goalValue}
                onChange={(e) => { setGoalValue(Number(e.target.value)); setGoalSaved(false); }}
                className="w-28 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <button onClick={() => goalMut.mutate()} disabled={goalMut.isPending} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                {goalMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
              </button>
              {goalSaved && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Meu plano</h3>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{PLAN_LABEL[access?.status ?? 'NONE']}</p>
                {access?.expiresAt && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">Válido até {new Date(access.expiresAt).toLocaleDateString('pt-BR')}</p>
                )}
              </div>
              {access?.checkoutUrl && access.status !== 'ADMIN' && (
                <a href={access.checkoutUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
                  {access.active ? 'Gerenciar' : 'Assinar'} <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <NotificationsCard />

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">Preferências</h3>
          <button onClick={toggleDark} className="flex w-full items-center justify-between py-2 text-sm">
            <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              {darkMode ? <Moon className="h-4 w-4 text-primary-600" /> : <Sun className="h-4 w-4 text-amber-500" />}
              Modo escuro
            </span>
            <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${darkMode ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
              <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </span>
          </button>
          <Link to="/metodologia" className="flex items-center justify-between border-t border-gray-100 py-2.5 text-sm text-gray-700 hover:text-primary-600 dark:border-gray-800 dark:text-gray-300">
            <span className="flex items-center gap-2"><FlaskConical className="h-4 w-4" /> Metodologia</span>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </Link>
          <Link to="/help" className="flex items-center justify-between border-t border-gray-100 py-2.5 text-sm text-gray-700 hover:text-primary-600 dark:border-gray-800 dark:text-gray-300">
            <span className="flex items-center gap-2"><HelpCircle className="h-4 w-4" /> Ajuda</span>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </Link>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Conta e segurança</h3>
        <AccountSecurity currentEmail={user?.email ?? ''} />
      </div>

      <button
        onClick={handleLogout}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:bg-gray-900 dark:hover:bg-red-950/30"
      >
        <LogOut className="h-4 w-4" />
        Sair da conta
      </button>
    </div>
  );
}
