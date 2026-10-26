import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpenIcon,
  BarChartIcon,
  ClockIcon,
  SparklesIcon,
  ZapIcon,
  ArrowRightIcon,
  RotateCcwIcon,
  PlayIcon,
} from '@/components/icons/EngramaIcons';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { studyService, type StudySessionDTO } from '@/features/study/services/study.service';
import { contentService } from '@/features/content/services/content.service';
import { dashboardService } from '@/features/dashboard/services/dashboard.service';
import { ConstanciaHeatmap } from '@/features/dashboard/components/ConstanciaHeatmap';
import { MetasCard } from '@/features/dashboard/components/MetasCard';
import { DueReviewsPanel } from '@/features/dashboard/components/DueReviewsPanel';
import { PomodoroTimer } from '@/features/dashboard/components/PomodoroTimer';
import { EnergyCheckIn } from '@/features/dashboard/components/EnergyCheckIn';
import { useTour, isTourDone } from '@/features/tour/useTour';
import { TodayPanel } from '@/features/calendar/components/TodayPanel';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { start: startTour } = useTour();

  useEffect(() => {
    if (isTourDone()) return;
    const timer = setTimeout(() => startTour(), 700);
    return () => clearTimeout(timer);
  }, [startTour]);

  const { data: stats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: studyService.getStats,
  });

  const { data: summary } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardService.getSummary,
  });

  const goalMutation = useMutation({
    mutationFn: dashboardService.setDailyGoal,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
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
    {
      label: 'Questões resolvidas',
      value: String(stats?.questionsAnswered ?? 0),
      icon: BookOpenIcon,
      color: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-500/10 dark:bg-teal-500/15',
    },
    {
      label: 'Taxa de acerto',
      value: `${stats?.accuracy ?? 0}%`,
      icon: BarChartIcon,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    },
    {
      label: 'Tempo estudado',
      value: formatTime(stats?.totalTimeSeconds ?? 0),
      icon: ClockIcon,
      color: 'text-amber-500 dark:text-amber-400',
      bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    },
    {
      label: 'Sessões completadas',
      value: String(stats?.totalSessions ?? 0),
      icon: SparklesIcon,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-500/10 dark:bg-purple-500/15',
    },
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
            className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm dark:border-white/8 dark:bg-[#121A33]"
          >
            <div className="flex items-center gap-3.5">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={22} strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                  {stat.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {summary && (
        <>
          <div className="mt-6">
            <EnergyCheckIn dailyGoal={summary.goal.dailyQuestions} />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div data-tour="metas">
              <MetasCard
                goal={summary.goal}
                averages={summary.averages}
                onSetGoal={(value) => goalMutation.mutate(value)}
                saving={goalMutation.isPending}
              />
            </div>
            <div data-tour="revisoes">
              <DueReviewsPanel />
            </div>
            <div data-tour="pomodoro">
              <PomodoroTimer />
            </div>
          </div>
          <div className="mt-4" data-tour="constancia">
            <ConstanciaHeatmap heatmap={summary.heatmap} streak={summary.streak} />
          </div>
        </>
      )}

      <TodayPanel />

      {showOnboarding && (
        <div className="mt-6 rounded-xl border border-primary-200 bg-primary-50 p-5 dark:border-primary-900 dark:bg-primary-950/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary-100 p-2 dark:bg-primary-900">
                <ZapIcon size={20} className="text-primary-600" />
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
              <ArrowRightIcon size={16} />
            </button>
          </div>
        </div>
      )}

      {history.length > 0 ? (
        <div className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <RotateCcwIcon size={18} className="text-gray-500" />
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
          <PlayIcon size={36} className="mx-auto mb-3 text-primary-400" />
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
            <SparklesIcon size={16} />
            Gerar Questões
          </button>
        </div>
      )}
    </div>
  );
}
