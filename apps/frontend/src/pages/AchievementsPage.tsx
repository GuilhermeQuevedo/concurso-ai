import { useQuery } from '@tanstack/react-query';
import { Trophy, Flame, Lock, Loader2 } from 'lucide-react';
import { gamificationService } from '@/features/gamification/services/gamification.service';

export function AchievementsPage() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['gamification-profile'],
    queryFn: gamificationService.getProfile,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const streak = profile?.streak ?? { current: 0, longest: 0 };
  const achievements = profile?.availableAchievements ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Conquistas</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Acompanhe suas conquistas e mantenha sua sequência
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-100 p-3 dark:bg-orange-900">
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{streak.current}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Dias seguidos</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900">
              <Trophy className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{streak.longest}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Maior sequência</p>
            </div>
          </div>
        </div>
      </div>

      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        Conquistas ({achievements.filter((a) => a.unlocked).length}/{achievements.length})
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((achievement) => (
          <div
            key={achievement.type}
            className={`rounded-xl border p-4 ${
              achievement.unlocked
                ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'
                : 'border-gray-200 bg-white opacity-60 dark:border-gray-800 dark:bg-gray-900'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`rounded-lg p-2 ${
                achievement.unlocked
                  ? 'bg-yellow-100 dark:bg-yellow-900'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                {achievement.unlocked ? (
                  <Trophy className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Lock className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{achievement.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{achievement.description}</p>
                {achievement.unlocked && achievement.unlockedAt && (
                  <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                    Desbloqueada em {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
