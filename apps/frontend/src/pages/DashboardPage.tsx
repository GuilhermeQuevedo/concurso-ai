import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Sparkles, BarChart3, Clock, Play, History, Rocket, ArrowRight } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { studyService, type StudySessionDTO } from '@/features/study/services/study.service';
import { contentService } from '@/features/content/services/content.service';
import { TodayPanel } from '@/features/calendar/components/TodayPanel';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: studyService.getStats,
  });

  const { data: history = [] } = useQuery({
    queryKey: ['session-history'],
    queryFn: studyService.getHistory,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: contentService.getSubjects,
  });

  const showOnboarding = subjects.length === 0 || (stats?.totalSessions ?? 0) === 0;

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}min`;
  };

  const statCards = [
    { label: 'Questões resolvidas', value: String(stats?.questionsAnswered ?? 0), icon: BookOpen, color: 'text-blue-600' },
    { label: 'Taxa de acerto', value: `${stats?.accuracy ?? 0}%`, icon: BarChart3, color: 'text-green-600' },
    { label: 'Tempo estudado', value: formatTime(stats?.totalTimeSeconds ?? 0), icon: Clock, color: 'text-amber-600' },
    { label: 'Sessões completadas', value: String(stats?.totalSessions ?? 0), icon: Sparkles, color: 'text-purple-600' },
  ];

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
        {statCards.map((stat) => (
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

      <TodayPanel />

      {showOnboarding && (
        <div className="mt-6 rounded-xl border border-primary-200 bg-primary-50 p-5 dark:border-primary-900 dark:bg-primary-950/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary-100 p-2 dark:bg-primary-900">
                <Rocket className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Primeiro acesso? Veja como configurar tudo
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Tutorial passo a passo para alimentar a plataforma e começar a estudar
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/getting-started')}
              className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Ver tutorial
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {history.length > 0 ? (
        <div className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <History className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sessões Recentes</h2>
          </div>
          <div className="space-y-2">
            {history.slice(0, 5).map((session: StudySessionDTO) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-center gap-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                    session.mode === 'STUDY'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  }`}>
                    {session.mode === 'STUDY' ? 'Estudo' : 'Simulado'}
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {session.correctCount}/{session.questionsCount} acertos
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span>{formatTime(session.totalTime)}</span>
                  <span>{new Date(session.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
          <Play className="mx-auto mb-3 h-10 w-10 text-primary-400" />
          <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
            Comece gerando questões
          </h3>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Gere questões com IA e inicie uma sessão de estudo ou simulado.
          </p>
          <button
            onClick={() => navigate('/generate')}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Sparkles className="h-4 w-4" />
            Gerar Questões
          </button>
        </div>
      )}
    </div>
  );
}
