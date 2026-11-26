import { useQuery } from '@tanstack/react-query';
import { Trophy, Flame, Lock, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { gamificationService } from '@/features/gamification/services/gamification.service';

export function AchievementsPage() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['gamification-profile'],
    queryFn: gamificationService.getProfile,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16" role="status" aria-label="Carregando conquistas">
        <Loader2 className="h-8 w-8 animate-spin text-[#2E8C82]" />
      </div>
    );
  }

  const streak = profile?.streak ?? { current: 0, longest: 0 };
  const achievements = profile?.availableAchievements ?? [];
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const progressPercent = achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0;

  return (
    <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in duration-fast">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-[#F2A93B] dark:bg-amber-500/20 dark:text-[#f7bf67]">
            <Trophy className="h-5 w-5" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Conquistas & Distintivos
          </h1>
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Acompanhe seus marcos de estudo, desbloqueie medalhas exclusivas e fortaleça sua rotina diária.
        </p>
      </div>

      {/* Streak Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Current streak - Âmbar */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all duration-fast">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-[#F2A93B] dark:bg-amber-500/20 dark:text-[#f7bf67]">
            <Flame className="h-7 w-7 fill-[#F2A93B]/20" />
          </div>
          <div>
            <p className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
              {streak.current}
            </p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Dias seguidos (Ofensiva atual)
            </p>
          </div>
        </div>

        {/* Longest streak record - Verde-Revisão */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all duration-fast">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#2E8C82]/10 text-[#2E8C82] dark:bg-[#2E8C82]/20 dark:text-[#38b2a6]">
            <Sparkles className="h-7 w-7" />
          </div>
          <div>
            <p className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
              {streak.longest}
            </p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Maior sequência alcançada (Recorde)
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar & Achievements Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Progresso Geral ({unlockedCount} de {achievements.length} desbloqueadas)
          </h2>
          <span className="text-xs font-bold text-[#2E8C82] dark:text-[#38b2a6] font-mono">
            {progressPercent}% concluído
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-[#2E8C82] transition-all duration-normal"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((achievement) => (
          <div
            key={achievement.type}
            className={`flex flex-col justify-between rounded-2xl border p-5 transition-all duration-fast ${
              achievement.unlocked
                ? 'border-emerald-200 bg-white shadow-xs dark:border-emerald-900/60 dark:bg-slate-900'
                : 'border-slate-200 bg-slate-50/60 opacity-60 dark:border-slate-800 dark:bg-slate-900/40'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  achievement.unlocked
                    ? 'bg-amber-500/15 text-[#F2A93B] dark:bg-amber-500/25 dark:text-[#f7bf67]'
                    : 'bg-slate-200/80 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                }`}
              >
                {achievement.unlocked ? (
                  <Trophy className="h-5 w-5" />
                ) : (
                  <Lock className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                    {achievement.name}
                  </p>
                  {achievement.unlocked && (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {achievement.description}
                </p>
              </div>
            </div>

            {achievement.unlocked && achievement.unlockedAt && (
              <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] font-semibold text-emerald-700 dark:border-slate-800 dark:text-emerald-400">
                Desbloqueada em {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
