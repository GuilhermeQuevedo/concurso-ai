import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Users,
  CreditCard,
  DollarSign,
  BookOpen,
  PenLine,
  Layers,
  Target,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { GrantAccessCard } from '@/features/admin/components/GrantAccessCard';
import { RevealPiiModal } from '@/features/admin/components/RevealPiiModal';
import { adminService, type AdminUser } from '@/features/admin/services/admin.service';
import { toast } from '@/components/ui/toast-store';
import { getErrorMessage } from '@/utils/error-message';

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const PAGE_SIZE = 50;

export function AdminPage() {
  const [page, setPage] = useState<number>(1);
  const [selectedUserToReveal, setSelectedUserToReveal] = useState<AdminUser | null>(null);
  const [revealedUsers, setRevealedUsers] = useState<Record<string, AdminUser>>({});

  const { data: overview } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: adminService.getOverview,
  });

  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin-users', page],
    queryFn: () => adminService.getUsers(page, PAGE_SIZE),
  });

  const revealMutation = useMutation({
    mutationFn: async ({ userId, justification }: { userId: string; justification: string }) => {
      return adminService.revealUser(userId, justification);
    },
    onSuccess: (unmaskedUser) => {
      setRevealedUsers((prev) => ({ ...prev, [unmaskedUser.id]: unmaskedUser }));
      setSelectedUserToReveal(null);
      toast.success('Dados pessoais revelados e acesso auditado com sucesso.');
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Falha ao revelar dados pessoais do usuário.'));
    },
  });

  if (!overview) {
    return (
      <div className="flex justify-center py-16" role="status" aria-label="Carregando dados da administração">
        <Loader2 className="h-8 w-8 animate-spin text-[#2E8C82]" />
      </div>
    );
  }

  const rawUsers: AdminUser[] = usersData?.users ?? [];
  const users: AdminUser[] = rawUsers.map((u) => revealedUsers[u.id] ?? u);
  const totalUsers = usersData?.pagination?.total ?? overview.users.total;
  const totalPages = usersData?.pagination?.totalPages ?? 1;

  return (
    <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in duration-fast">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Administração & Governança
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Visão geral consolidada de usuários cadastrados, engajamento na plataforma e receita operacional.
        </p>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          icon={Users}
          colorClass="text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400"
          label="Usuários Cadastrados"
          value={String(overview.users.total)}
          hint={`+${overview.users.newLast7} em 7d · +${overview.users.newLast30} em 30d`}
        />
        <AdminStatCard
          icon={CreditCard}
          colorClass="text-[#2E8C82] bg-[#2E8C82]/10 dark:bg-[#2E8C82]/20 dark:text-[#38b2a6]"
          label="Assinantes Ativos"
          value={String(overview.subscriptions.active)}
        />
        <AdminStatCard
          icon={DollarSign}
          colorClass="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400"
          label="Receita Recebida"
          value={formatBRL(overview.revenue.receivedCents)}
          hint={`${overview.revenue.paymentsCount} pagamento(s)`}
        />
        <AdminStatCard
          icon={Target}
          colorClass="text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400"
          label="Objetivos / Concursos"
          value={String(overview.engagement.contests)}
        />
      </div>

      {/* Engagement Activity Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          icon={BookOpen}
          colorClass="text-[#F2A93B] bg-[#F2A93B]/10 dark:bg-[#F2A93B]/20 dark:text-[#f7bf67]"
          label="Questões Resolvidas"
          value={String(overview.engagement.questionsAnswered)}
        />
        <AdminStatCard
          icon={PenLine}
          colorClass="text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400"
          label="Redações Submetidas"
          value={String(overview.engagement.essays)}
        />
        <AdminStatCard
          icon={Layers}
          colorClass="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400"
          label="Flashcards Praticados"
          value={String(overview.engagement.flashcards)}
        />
        <AdminStatCard
          icon={BookOpen}
          colorClass="text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 dark:text-cyan-400"
          label="Sessões de Estudo"
          value={String(overview.engagement.sessions)}
        />
      </div>

      {/* Webhook and Financial Sync Disclaimer */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
        Os valores consolidados de faturamento, saques e taxas de intermediação são auditados no Stripe. Os dados acima refletem as notificações transacionais recebidas via webhooks.
      </div>

      {/* Manual Access Grant Card */}
      <GrantAccessCard />

      {/* Users Table Section */}
      <div className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Usuários ({totalUsers})
          </h2>
          {totalPages > 1 && (
            <div className="flex items-center gap-3 text-xs">
              <span className="font-medium text-slate-500 dark:text-slate-400">
                Página <strong className="text-slate-800 dark:text-slate-200">{page}</strong> de {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoadingUsers}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-300 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] active:scale-95 transition-all duration-fast touch-manipulation dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isLoadingUsers}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-300 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] active:scale-95 transition-all duration-fast touch-manipulation dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  aria-label="Próxima página"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {isLoadingUsers ? (
          <div className="flex justify-center py-16" role="status" aria-label="Carregando tabela de usuários">
            <Loader2 className="h-8 w-8 animate-spin text-[#2E8C82]" />
          </div>
        ) : users.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 py-12 text-center text-sm font-medium text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Nenhum usuário cadastrado encontrado.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                  <th className="px-5 py-3.5">Nome</th>
                  <th className="px-5 py-3.5">E-mail</th>
                  <th className="px-5 py-3.5">Assinante</th>
                  <th className="px-5 py-3.5">Questões</th>
                  <th className="px-5 py-3.5">Redações</th>
                  <th className="px-5 py-3.5">Flashcards</th>
                  <th className="px-5 py-3.5">Streak</th>
                  <th className="px-5 py-3.5">Cadastro</th>
                  <th className="px-5 py-3.5 text-right">Ação LGPD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <UserTableRow
                    key={u.id}
                    user={u}
                    isRevealed={!!revealedUsers[u.id]}
                    onOpenReveal={() => setSelectedUserToReveal(u)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* LGPD Justified Access Modal */}
      <RevealPiiModal
        isOpen={!!selectedUserToReveal}
        title="Visualizar Dados Pessoais do Usuário"
        targetName={selectedUserToReveal?.name ?? selectedUserToReveal?.email ?? 'Usuário'}
        isPending={revealMutation.isPending}
        onClose={() => setSelectedUserToReveal(null)}
        onConfirm={(justification) => {
          if (selectedUserToReveal) {
            revealMutation.mutate({ userId: selectedUserToReveal.id, justification });
          }
        }}
      />
    </div>
  );
}

interface AdminStatCardProps {
  icon: typeof Users;
  colorClass: string;
  label: string;
  value: string;
  hint?: string;
}

function AdminStatCard({ icon: Icon, colorClass, label, value, hint }: AdminStatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all duration-fast">
      <div className="flex items-center gap-3.5">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </p>
          <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
            {label}
          </p>
        </div>
      </div>
      {hint && (
        <p className="mt-2.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
}

interface UserTableRowProps {
  user: AdminUser;
  isRevealed: boolean;
  onOpenReveal: () => void;
}

function UserTableRow({ user, isRevealed, onOpenReveal }: UserTableRowProps) {
  return (
    <tr className="text-slate-700 hover:bg-slate-50/70 dark:text-slate-300 dark:hover:bg-slate-800/40 transition-colors duration-fast">
      <td className="px-5 py-3.5">
        <span className="font-bold text-slate-900 dark:text-white">{user.name}</span>
        {user.role === 'ADMIN' && (
          <span className="ml-2 inline-flex items-center rounded-md border border-[#2E8C82]/30 bg-[#2E8C82]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#2E8C82] dark:bg-[#2E8C82]/20 dark:text-[#38b2a6]">
            admin
          </span>
        )}
      </td>
      <td className="px-5 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-400">
        {user.email}
      </td>
      <td className="px-5 py-3.5">
        {user.activeSubscriber ? (
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            ativo
          </span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </td>
      <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
        {user.questionsAnswered}
      </td>
      <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
        {user.essays}
      </td>
      <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
        {user.flashcards}
      </td>
      <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
        {user.streak}
      </td>
      <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">
        {new Date(user.createdAt).toLocaleDateString('pt-BR')}
      </td>
      <td className="px-5 py-3.5 text-right">
        {isRevealed ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
            Revelado
          </span>
        ) : (
          <button
            type="button"
            onClick={onOpenReveal}
            className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] active:scale-95 transition-all duration-fast touch-manipulation dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Revelar dados pessoais com justificativa auditada"
          >
            <Eye className="h-3.5 w-3.5" />
            Revelar
          </button>
        )}
      </td>
    </tr>
  );
}
