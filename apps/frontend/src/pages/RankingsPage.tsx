import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Medal, Trophy, Users, Loader2, Check, X, Flame, Target, Trash2 } from 'lucide-react';
import { rankingService } from '@/features/rankings/services/ranking.service';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function RankingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: boards = [], isLoading } = useQuery({
    queryKey: ['rankings'],
    queryFn: rankingService.listApproved,
  });

  const { data: pending = [] } = useQuery({
    queryKey: ['rankings', 'pending'],
    queryFn: rankingService.listPending,
    enabled: isAdmin,
  });

  const moderate = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      action === 'approve' ? rankingService.approve(id) : rankingService.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rankings'] });
    },
  });

  const removeRanking = useMutation({
    mutationFn: (id: string) => rankingService.remove(id),
    onSuccess: (_d, id) => {
      if (selectedId === id) setSelectedId(null);
      queryClient.invalidateQueries({ queryKey: ['rankings'] });
    },
  });

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Apagar o ranking "${title}"? Essa ação não pode ser desfeita.`)) {
      removeRanking.mutate(id);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
          <Trophy className="h-6 w-6 text-primary-600" /> Ranking Global
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Dispute com outros alunos por acertos em questões e assiduidade.
        </p>
      </div>

      {isAdmin && pending.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <h2 className="mb-3 text-sm font-semibold text-amber-800 dark:text-amber-300">
            Sugestões aguardando sua aprovação ({pending.length})
          </h2>
          <div className="space-y-2">
            {pending.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-white px-4 py-3 dark:border-amber-900 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{p.title}</p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {p.document ? `${p.document.name} · ` : ''}
                    {p.createdBy ? `sugerido por ${p.createdBy.name}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => moderate.mutate({ id: p.id, action: 'approve' })}
                    disabled={moderate.isPending}
                    className="flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" /> Aprovar
                  </button>
                  <button
                    onClick={() => moderate.mutate({ id: p.id, action: 'reject' })}
                    disabled={moderate.isPending}
                    className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <X className="h-3.5 w-3.5" /> Recusar
                  </button>
                  <button
                    onClick={() => handleDelete(p.id, p.title)}
                    disabled={removeRanking.isPending}
                    title="Apagar"
                    className="flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : boards.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <Medal className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nenhum ranking ativo ainda. Suba um edital em Documentos e sugira um ranking.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {boards.map((b) => (
            <div
              key={b.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedId(b.id)}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedId(b.id)}
              className={`relative cursor-pointer rounded-xl border p-4 text-left transition-colors ${
                selectedId === b.id
                  ? 'border-primary-500 bg-primary-50 dark:border-primary-600 dark:bg-primary-950/30'
                  : 'border-gray-200 bg-white hover:border-primary-300 dark:border-gray-800 dark:bg-gray-900'
              }`}
            >
              {isAdmin && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(b.id, b.title); }}
                  disabled={removeRanking.isPending}
                  title="Apagar ranking"
                  className="absolute right-2 top-2 rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <p className="pr-7 font-semibold text-gray-900 dark:text-white">{b.title}</p>
              {b.description && (
                <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                  {b.description}
                </p>
              )}
              <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <Users className="h-3.5 w-3.5" /> {b._count.participants} participando
                {b.subject && <span>· {b.subject.name}</span>}
              </p>
            </div>
          ))}
        </div>
      )}

      {selectedId && <LeaderboardPanel rankingId={selectedId} />}
    </div>
  );
}

function LeaderboardPanel({ rankingId }: { rankingId: string }) {
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
      <div className="mt-6 flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{data.board.title}</h2>
        <button
          onClick={() => toggleJoin.mutate()}
          disabled={toggleJoin.isPending}
          className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 ${
            data.joined
              ? 'border border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {data.joined ? 'Sair do ranking' : 'Participar'}
        </button>
      </div>

      {data.entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Ninguém participando ainda. Seja o primeiro!
        </p>
      ) : (
        <div className="space-y-1">
          {data.entries.map((e) => (
            <div
              key={e.userId}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${
                e.isCurrentUser ? 'bg-primary-50 dark:bg-primary-950/30' : ''
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  e.position === 1
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                    : e.position <= 3
                      ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                      : 'text-gray-400'
                }`}
              >
                {e.position}
              </span>
              <span className="flex-1 truncate text-sm font-medium text-gray-900 dark:text-white">
                {e.name}
                {e.isCurrentUser && <span className="ml-1 text-xs text-primary-600">(você)</span>}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Target className="h-3.5 w-3.5" /> {e.correct}/{e.total}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Flame className="h-3.5 w-3.5" /> {e.streak}
              </span>
              <span className="w-14 text-right text-sm font-semibold text-primary-600">{e.score}</span>
            </div>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs text-gray-400">
        Pontuação = acertos em questões × 10 + dias de ofensiva × 5.
      </p>
    </div>
  );
}
