import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Target, Flame, Trophy, Crown, Medal } from 'lucide-react';
import { rankingService } from '../services/ranking.service';
import { TierBadge } from '@/features/xp/components/TierBadge';

export interface RankingsLeaderboardProps {
  rankingId: string;
}

export function RankingsLeaderboard({ rankingId }: RankingsLeaderboardProps) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['rankings', rankingId, 'leaderboard'],
    queryFn: () => rankingService.leaderboard(rankingId),
  });

  const toggleJoin = useMutation({
    mutationFn: () => (data?.joined ? rankingService.leave(rankingId) : rankingService.join(rankingId)),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['rankings', rankingId, 'leaderboard'] }),
  });

  if (isLoading || !data) {
    return (
      <div className="mt-6 flex justify-center py-12" role="status" aria-label="Carregando tabela de classificação">
        <Loader2 className="h-8 w-8 animate-spin text-[#2E8C82]" />
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Tabela de classificação do ranking"
      className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 motion-safe:animate-in motion-safe:fade-in duration-fast"
    >
      {/* Header and Toggle Action */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <Trophy className="h-5 w-5 text-[#F2A93B]" />
            {data.board.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Classificação atualizada com base em desempenho em simulados e ofensiva diária
          </p>
        </div>
        <button
          type="button"
          onClick={() => toggleJoin.mutate()}
          disabled={toggleJoin.isPending}
          className={`min-h-[44px] inline-flex items-center justify-center rounded-xl px-5 py-2 text-sm font-bold shadow-xs transition-all duration-fast touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] active:scale-[0.98] disabled:opacity-50 ${
            data.joined
              ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              : 'bg-[#2E8C82] text-white hover:bg-[#26776f]'
          }`}
        >
          {toggleJoin.isPending ? 'Processando...' : data.joined ? 'Sair do Ranking' : 'Participar do Ranking'}
        </button>
      </div>

      {data.entries.length === 0 ? (
        <div className="py-10 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
          Nenhum concorrente pontuou nesta liga ainda. Seja o primeiro a liderar!
        </div>
      ) : (
        <div className="space-y-2">
          {data.entries.map((e) => {
            const podiumConfig =
              e.position === 1
                ? { bg: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200', icon: Crown }
                : e.position === 2
                  ? { bg: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200', icon: Medal }
                  : e.position === 3
                    ? { bg: 'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950 dark:text-orange-200', icon: Medal }
                    : null;

            return (
              <div
                key={e.userId}
                className={`flex items-center gap-3.5 rounded-xl px-4 py-3 transition-colors duration-fast ${
                  e.isCurrentUser
                    ? 'border border-[#2E8C82]/30 bg-[#2E8C82]/10 font-bold dark:border-[#2E8C82]/40 dark:bg-[#2E8C82]/20'
                    : 'border border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold border ${
                    podiumConfig ? podiumConfig.bg : 'border-transparent text-slate-400 dark:text-slate-500 font-semibold'
                  }`}
                >
                  {e.position}
                </span>

                <div className="min-w-0 flex-1 flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-bold text-slate-900 dark:text-white">
                    {e.name}
                  </span>
                  {e.isCurrentUser && (
                    <span className="rounded-md border border-[#2E8C82]/30 bg-[#2E8C82]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#2E8C82] dark:bg-[#2E8C82]/20 dark:text-[#38b2a6]">
                      Você
                    </span>
                  )}
                  <span className="shrink-0">
                    <TierBadge level={e.level} tier={e.tier} />
                  </span>
                </div>

                <div className="flex items-center gap-4 shrink-0 text-xs text-slate-600 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1.5 font-medium" title="Questões corretas / total">
                    <Target className="h-3.5 w-3.5 text-[#2E8C82]" />
                    <span className="tabular-nums font-mono">{`${e.correct}/${e.total}`}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium" title="Dias de ofensiva consecutiva">
                    <Flame className="h-3.5 w-3.5 text-[#F2A93B] fill-[#F2A93B]" />
                    <span className="tabular-nums font-mono">{e.streak}</span>
                  </span>
                  <span className="w-20 text-right text-sm font-extrabold tabular-nums font-mono text-[#2E8C82] dark:text-[#38b2a6]">
                    {`${e.score} pts`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] font-medium text-slate-400 dark:border-slate-800 dark:text-slate-500">
        Fórmula de Pontuação: Acertos em questões × 10 pontos + Dias de ofensiva ativa × 5 pontos.
      </p>
    </div>
  );
}
