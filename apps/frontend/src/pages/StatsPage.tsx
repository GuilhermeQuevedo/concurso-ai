import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import {
  BarChartIcon,
  BookOpenIcon,
  ClockIcon,
  TargetIcon,
  TrendingUpIcon,
  AwardIcon,
} from '@/components/icons/EngramaIcons';
import { studyService } from '@/features/study/services/study.service';
import { gamificationService } from '@/features/gamification/services/gamification.service';
import { flashcardService } from '@/features/flashcards/services/flashcard.service';

export function StatsPage() {
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: studyService.getStats,
  });

  const { data: history = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['session-history'],
    queryFn: studyService.getHistory,
  });

  const { data: profile } = useQuery({
    queryKey: ['gamification-profile'],
    queryFn: gamificationService.getProfile,
  });

  const { data: flashcardStats } = useQuery({
    queryKey: ['flashcard-stats'],
    queryFn: flashcardService.getStats,
  });

  const isLoading = loadingStats || loadingHistory;

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}min`;
  };

  const studySessions = history.filter((s) => s.mode === 'STUDY');
  const examSessions = history.filter((s) => s.mode === 'EXAM');

  const avgAccuracy = stats?.questionsAnswered
    ? Math.round((stats.correctAnswers / stats.questionsAnswered) * 100)
    : 0;

  const avgTimePerQuestion = stats?.questionsAnswered
    ? Math.round(stats.totalTimeSeconds / stats.questionsAnswered)
    : 0;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Estatísticas</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Visão detalhada do seu desempenho
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={BookOpenIcon}
          label="Questões resolvidas"
          value={String(stats?.questionsAnswered ?? 0)}
          color="text-teal-600 dark:text-teal-400"
          bg="bg-teal-500/10 dark:bg-teal-500/15"
        />
        <StatCard
          icon={TargetIcon}
          label="Taxa de acerto"
          value={`${avgAccuracy}%`}
          color="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-500/10 dark:bg-emerald-500/15"
        />
        <StatCard
          icon={ClockIcon}
          label="Tempo total"
          value={formatTime(stats?.totalTimeSeconds ?? 0)}
          color="text-amber-500 dark:text-amber-400"
          bg="bg-amber-500/10 dark:bg-amber-500/15"
        />
        <StatCard
          icon={TrendingUpIcon}
          label="Sessões completadas"
          value={String(stats?.totalSessions ?? 0)}
          color="text-purple-600 dark:text-purple-400"
          bg="bg-purple-500/10 dark:bg-purple-500/15"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 dark:border-white/8 dark:bg-[#121A33]">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
            <BarChartIcon size={18} className="text-teal-600 dark:text-teal-400" />
            Detalhamento
          </h3>
          <div className="space-y-3">
            <DetailRow label="Questões corretas" value={String(stats?.correctAnswers ?? 0)} />
            <DetailRow label="Questões erradas" value={String((stats?.questionsAnswered ?? 0) - (stats?.correctAnswers ?? 0))} />
            <DetailRow label="Tempo médio/questão" value={`${avgTimePerQuestion}s`} />
            <DetailRow label="Sessões de estudo" value={String(studySessions.length)} />
            <DetailRow label="Sessões de simulado" value={String(examSessions.length)} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-5 dark:border-white/8 dark:bg-[#121A33]">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
            <AwardIcon size={18} className="text-amber-500 dark:text-amber-400" />
            Gamificação & Flashcards
          </h3>
          <div className="space-y-3">
            <DetailRow label="Streak atual" value={`${profile?.streak?.current ?? 0} dias`} />
            <DetailRow label="Maior streak" value={`${profile?.streak?.longest ?? 0} dias`} />
            <DetailRow
              label="Conquistas desbloqueadas"
              value={`${profile?.achievements?.length ?? 0} / ${profile?.availableAchievements?.length ?? 0}`}
            />
            <DetailRow label="Flashcards criados" value={String(flashcardStats?.total ?? 0)} />
            <DetailRow label="Flashcards para revisar" value={String(flashcardStats?.due ?? 0)} />
          </div>
        </div>
      </div>

      {history.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">Histórico de Sessões</h3>
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Data</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Modo</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Acertos</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 dark:text-gray-400">%</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Tempo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
                {history.map((session) => {
                  const acc = session.questionsCount > 0
                    ? Math.round((session.correctCount / session.questionsCount) * 100)
                    : 0;
                  return (
                    <tr key={session.id}>
                      <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">
                        {new Date(session.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                          session.mode === 'STUDY'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        }`}>
                          {session.mode === 'STUDY' ? 'Estudo' : 'Simulado'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center text-gray-700 dark:text-gray-300">
                        {session.correctCount}/{session.questionsCount}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={acc >= 70 ? 'text-green-600' : acc >= 40 ? 'text-amber-600' : 'text-red-600'}>
                          {acc}%
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-500 dark:text-gray-400">
                        {formatTime(session.totalTime)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm dark:border-white/8 dark:bg-[#121A33]">
      <div className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl ${bg} ${color}`}>
        <Icon size={22} strokeWidth={1.75} />
      </div>
      <p className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
      <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}
