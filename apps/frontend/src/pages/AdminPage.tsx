import { useQuery } from '@tanstack/react-query';
import { Users, CreditCard, DollarSign, BookOpen, PenLine, Layers, Target, Loader2 } from 'lucide-react';
import { adminService, type AdminUser } from '@/features/admin/services/admin.service';

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function AdminPage() {
  const { data: overview } = useQuery({ queryKey: ['admin-overview'], queryFn: adminService.getOverview });
  const { data: users = [] } = useQuery({ queryKey: ['admin-users'], queryFn: adminService.getUsers });

  if (!overview) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Administração</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Visão geral de usuários, engajamento e receita.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card icon={Users} color="text-blue-600" label="Usuários" value={String(overview.users.total)} hint={`+${overview.users.newLast7} em 7d · +${overview.users.newLast30} em 30d`} />
        <Card icon={CreditCard} color="text-green-600" label="Assinantes ativos" value={String(overview.subscriptions.active)} />
        <Card icon={DollarSign} color="text-emerald-600" label="Recebido" value={formatBRL(overview.revenue.receivedCents)} hint={`${overview.revenue.paymentsCount} pagamento(s)`} />
        <Card icon={Target} color="text-purple-600" label="Concursos" value={String(overview.engagement.contests)} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card icon={BookOpen} color="text-amber-600" label="Questões respondidas" value={String(overview.engagement.questionsAnswered)} />
        <Card icon={PenLine} color="text-rose-600" label="Redações" value={String(overview.engagement.essays)} />
        <Card icon={Layers} color="text-indigo-600" label="Flashcards" value={String(overview.engagement.flashcards)} />
        <Card icon={BookOpen} color="text-cyan-600" label="Sessões de estudo" value={String(overview.engagement.sessions)} />
      </div>

      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
        Os valores exatos de faturamento, saques e taxas ficam no Kiwify (Financeiro). Aqui mostramos o que chegou pelos webhooks.
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Usuários ({users.length})</h2>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map((u) => (
                <UserRow key={u.id} user={u} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Card({ icon: Icon, color, label, value, hint }: { icon: typeof Users; color: string; label: string; value: string; hint?: string }) {
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

function UserRow({ user }: { user: AdminUser }) {
  return (
    <tr className="text-gray-700 dark:text-gray-300">
      <td className="px-4 py-3">
        {user.name}
        {user.role === 'ADMIN' && (
          <span className="ml-2 rounded bg-primary-100 px-1.5 py-0.5 text-[10px] font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
            admin
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{user.email}</td>
      <td className="px-4 py-3">
        {user.activeSubscriber ? (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:bg-green-950 dark:text-green-400">ativo</span>
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
    </tr>
  );
}
