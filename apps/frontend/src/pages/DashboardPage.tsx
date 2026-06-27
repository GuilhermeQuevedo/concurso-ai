import { BookOpen, Sparkles, BarChart3, Clock } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';

const stats = [
  { label: 'Questões resolvidas', value: '0', icon: BookOpen, color: 'text-blue-600' },
  { label: 'Taxa de acerto', value: '0%', icon: BarChart3, color: 'text-green-600' },
  { label: 'Tempo estudado', value: '0h', icon: Clock, color: 'text-amber-600' },
  { label: 'Questões geradas', value: '0', icon: Sparkles, color: 'text-purple-600' },
];

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Olá, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Acompanhe seu progresso e continue evoluindo.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-lg bg-gray-50 p-2 dark:bg-gray-800 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        <Sparkles className="mx-auto mb-3 h-10 w-10 text-primary-400" />
        <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
          Comece gerando questões
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Após as próximas fases de desenvolvimento, você poderá gerar questões por IA aqui.
        </p>
      </div>
    </div>
  );
}
