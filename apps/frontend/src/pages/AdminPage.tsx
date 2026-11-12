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
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const rawUsers: AdminUser[] = usersData?.users ?? [];
  const users: AdminUser[] = rawUsers.map((u) => revealedUsers[u.id] ?? u);
  const totalUsers = usersData?.pagination?.total ?? overview.users.total;
  const totalPages = usersData?.pagination?.totalPages ?? 1;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Administração</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Visão geral de usuários, engajamento e receita.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          icon={Users}
          color="text-blue-600"
          label="Usuários"
          value={String(overview.users.total)}
          hint={`+${overview.users.newLast7} em 7d · +${overview.users.newLast30} em 30d`}
        />
        <Card
          icon={CreditCard}
          color="text-green-600"
          label="Assinantes ativos"
          value={String(overview.subscriptions.active)}
        />
        <Card
          icon={DollarSign}
          color="text-emerald-600"
          label="Recebido"
          value={formatBRL(overview.revenue.receivedCents)}
          hint={`${overview.revenue.paymentsCount} pagamento(s)`}
        />
        <Card
          icon={Target}
          color="text-purple-600"
          label="Objetivos"
          value={String(overview.engagement.contests)}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          icon={BookOpen}
          color="text-amber-600"
          label="Questões respondidas"
          value={String(overview.engagement.questionsAnswered)}
        />
        <Card
          icon={PenLine}
          color="text-rose-600"
          label="Redações"
          value={String(overview.engagement.essays)}
        />
        <Card
          icon={Layers}
          color="text-indigo-600"
          label="Flashcards"
          value={String(overview.engagement.flashcards)}
        />
        <Card
          icon={BookOpen}
          color="text-cyan-600"
          label="Sessões de estudo"
          value={String(overview.engagement.sessions)}
        />
      </div>

      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
        Os valores exatos de faturamento, saques e taxas ficam no Stripe (Financeiro). Aqui mostramos o que chegou pelos webhooks.
      </div>

      <GrantAccessCard />

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Usuários ({totalUsers})
          </h2>
          {totalPages > 1 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500 dark:text-gray-400">
                Página {page} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoadingUsers}
                className="rounded-lg border border-gray-300 p-1 text-gray-600 hover:bg-gray-100 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isLoadingUsers}
                className="rounded-lg border border-gray-300 p-1 text-gray-600 hover:bg-gray-100 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                aria-label="Próxima página"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {isLoadingUsers ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : users.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 py-10 text-center text-sm text-gray-400 dark:border-gray-700">
            Nenhum usuário cadastrado.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-800">
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">E-mail</th>
                  <th className="px-4 py-3 font-medium">Assinante</th>
                  <th className="px-4 py-3 font-medium">Questões</th>
                  <th className="px-4 py-3 font-medium">Redações</th>
                  <th className="px-4 py-3 font-medium">Flashcards</th>
                  <th className="px-4 py-3 font-medium">Streak</th>
                  <th className="px-4 py-3 font-medium">Cadastro</th>
                  <th className="px-4 py-3 font-medium text-right">PII</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {users.map((u) => (
                  <UserRow
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

interface CardProps {
  icon: typeof Users;
  color: string;
  label: string;
  value: string;
  hint?: string;
}

function Card({ icon: Icon, color, label, value, hint }: CardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg bg-gray-50 p-2 dark:bg-gray-800 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
      {hint && <p className="mt-2 text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

interface UserRowProps {
  user: AdminUser;
  isRevealed: boolean;
  onOpenReveal: () => void;
}

function UserRow({ user, isRevealed, onOpenReveal }: UserRowProps) {
  return (
    <tr className="text-gray-700 dark:text-gray-300">
      <td className="px-4 py-3">
        <span className="font-medium text-gray-900 dark:text-white">{user.name}</span>
        {user.role === 'ADMIN' && (
          <span className="ml-2 rounded bg-primary-100 px-1.5 py-0.5 text-[10px] font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
            admin
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{user.email}</td>
      <td className="px-4 py-3">
        {user.activeSubscriber ? (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
            ativo
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-3">{user.questionsAnswered}</td>
      <td className="px-4 py-3">{user.essays}</td>
      <td className="px-4 py-3">{user.flashcards}</td>
      <td className="px-4 py-3">{user.streak}</td>
      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
        {new Date(user.createdAt).toLocaleDateString('pt-BR')}
      </td>
      <td className="px-4 py-3 text-right">
        {isRevealed ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Revelado
          </span>
        ) : (
          <button
            type="button"
            onClick={onOpenReveal}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            title="Revelar dados pessoais com justificativa auditada"
          >
            <Eye className="h-3 w-3" />
            Revelar
          </button>
        )}
      </td>
    </tr>
  );
}
