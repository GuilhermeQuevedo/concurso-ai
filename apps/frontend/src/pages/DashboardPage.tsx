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
import { ActiveStudyBanner } from '@/features/active-study/ActiveStudyBanner';
import { XpCard } from '@/features/xp/components/XpCard';
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
      color: 'text-primary-600 dark:text-primary-400',
      bg: 'bg-primary-600/10 dark:bg-primary-950/60',
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
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10 dark:bg-blue-500/15',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-fast">
      <div className="border-b border-gray-200 dark:border-gray-800 pb-5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Olá, {user?.name?.split(' ')[0] ?? 'Estudante'}!
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Acompanhe seu progresso de retenção e continue evoluindo na sua jornada de aprovação.
        </p>
      </div>

      <ActiveStudyBanner />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs transition-all duration-fast hover:shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center gap-3.5">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={22} strokeWidth={1.8} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="truncate text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
                  {stat.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {summary && (
        <>
          <div className="mt-2">
            <EnergyCheckIn dailyGoal={summary.goal.dailyQuestions} />
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="flex flex-col gap-5 lg:col-span-2">
              <div data-tour="metas">
                <MetasCard
                  goal={summary.goal}
                  averages={summary.averages}
                  onSetGoal={(value) => goalMutation.mutate(value)}
                  saving={goalMutation.isPending}
                />
              </div>
              <div className="flex-1 [&>*]:h-full" data-tour="revisoes">
                <DueReviewsPanel />
              </div>
            </div>
            <div className="flex flex-col gap-5">
              <XpCard />
              <div data-tour="constancia">
                <ConstanciaHeatmap heatmap={summary.heatmap} streak={summary.streak} />
              </div>
              <div data-tour="pomodoro">
                <PomodoroTimer />
              </div>
            </div>
          </div>
        </>
      )}

      <TodayPanel />

      {showOnboarding && (
        <div className="rounded-2xl border border-primary-200 bg-primary-50/70 p-5 dark:border-primary-900 dark:bg-primary-950/30 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="rounded-xl bg-primary-600/10 p-2.5 dark:bg-primary-900/60 text-primary-600 dark:text-primary-400 shrink-0">
                <ZapIcon size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Primeiro acesso? Veja como configurar seu plano de estudos
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">
                  Tutorial passo a passo para alimentar a plataforma e começar a resolver questões guiadas por IA.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/getting-started')}
              className="min-h-[44px] shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 hover:bg-primary-700 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all duration-fast touch-manipulation cursor-pointer active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <span>Ver tutorial</span>
              <ArrowRightIcon size={16} />
            </button>
          </div>
        </div>
      )}

      {history.length > 0 ? (
        <div className="rounded-2xl border border-gray-200/90 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 shadow-xs">
          <div className="mb-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <RotateCcwIcon size={18} className="text-primary-600 dark:text-primary-400" />
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Sessões Recentes</h2>
            </div>
          </div>
          <div className="space-y-2.5">
            {history.slice(0, 5).map((session: StudySessionDTO) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-xl border border-gray-200/70 bg-gray-50/50 px-4 py-3 dark:border-gray-800 dark:bg-gray-850/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                    session.mode === 'STUDY'
                      ? 'bg-primary-600/10 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  }`}>
                    {session.mode === 'STUDY' ? 'Estudo' : 'Simulado'}
                  </span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {session.correctCount}/{session.questionsCount} acertos
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
                  <span>{formatTime(session.totalTime)}</span>
                  <span>{new Date(session.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200/90 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900 shadow-xs">
          <PlayIcon size={36} className="mx-auto mb-3 text-primary-500" />
          <h3 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">
            Comece gerando questões
          </h3>
          <p className="mb-5 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
            Gere questões com IA e inicie uma sessão de estudo personalizada para construir seu mapa de retenção.
          </p>
          <button
            type="button"
            onClick={() => navigate('/generate')}
            className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-primary-600 hover:bg-primary-700 px-5 py-2.5 text-sm font-bold text-white shadow-xs transition-all duration-fast touch-manipulation cursor-pointer active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <SparklesIcon size={16} />
            Gerar Questões
          </button>
        </div>
      )}
    </div>
  );
}
