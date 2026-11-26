import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Medal, Trophy, Users, Loader2, Check, X, Trash2 } from 'lucide-react';
import { rankingService } from '@/features/rankings/services/ranking.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { RankingsLeaderboard } from '@/features/rankings/components/RankingsLeaderboard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from '@/components/ui/toast-store';
import { getErrorMessage } from '@/utils/error-message';

export function RankingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

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
    onSuccess: (_, variables) => {
      toast.success(variables.action === 'approve' ? 'Ranking aprovado com sucesso!' : 'Sugestão de ranking recusada.');
      queryClient.invalidateQueries({ queryKey: ['rankings'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Erro ao moderar ranking.'));
    },
  });

  const removeRanking = useMutation({
    mutationFn: (id: string) => rankingService.remove(id),
    onSuccess: (_d, id) => {
      if (selectedId === id) setSelectedId(null);
      toast.success('Ranking excluído com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['rankings'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Erro ao excluir ranking.'));
    },
    onSettled: () => setDeleteTarget(null),
  });

  return (
    <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in duration-fast">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-[#F2A93B] dark:bg-amber-500/20 dark:text-[#f7bf67]">
            <Trophy className="h-5 w-5" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Ranking Global & Ligas de Estudo
          </h1>
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Dispute com outros concorrentes por acertos em questões, constância e disciplina de estudo.
        </p>
      </div>

      {/* Admin Moderation Panel */}
      {isAdmin && pending.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-xs dark:border-amber-900/50 dark:bg-amber-950/30">
          <h2 className="mb-3 text-sm font-bold text-amber-950 dark:text-amber-200">
            Sugestões aguardando moderação administrativa ({pending.length})
          </h2>
          <div className="space-y-2.5">
            {pending.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-3 rounded-xl border border-amber-200/80 bg-white p-4 shadow-2xs dark:border-amber-900/60 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{p.title}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {p.document ? `${p.document.name} · ` : ''}
                    {p.createdBy ? `sugerido por ${p.createdBy.name}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moderate.mutate({ id: p.id, action: 'approve' })}
                    disabled={moderate.isPending}
                    className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl bg-[#2E8C82] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#26776f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] active:scale-95 transition-all duration-fast disabled:opacity-50 touch-manipulation"
                  >
                    <Check className="h-3.5 w-3.5" /> Aprovar
                  </button>
                  <button
                    type="button"
                    onClick={() => moderate.mutate({ id: p.id, action: 'reject' })}
                    disabled={moderate.isPending}
                    className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 active:scale-95 transition-all duration-fast touch-manipulation dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <X className="h-3.5 w-3.5" /> Recusar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ id: p.id, title: p.title })}
                    disabled={removeRanking.isPending}
                    title="Excluir ranking"
                    className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-xl border border-rose-200 p-2 text-xs font-bold text-rose-600 hover:bg-rose-50 active:scale-95 transition-all duration-fast dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Boards List */}
      {isLoading ? (
        <div className="flex justify-center py-16" role="status" aria-label="Carregando rankings">
          <Loader2 className="h-8 w-8 animate-spin text-[#2E8C82]" />
        </div>
      ) : boards.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <Medal className="mx-auto mb-3.5 h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Nenhum ranking ativo no momento
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Faça upload de um edital em Documentos para sugerir uma nova liga de estudo.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {boards.map((b) => {
            const isSelected = selectedId === b.id;
            return (
              <div
                key={b.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedId(b.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedId(b.id);
                  }
                }}
                className={`relative cursor-pointer rounded-2xl border p-5 text-left transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] ${
                  isSelected
                    ? 'border-[#2E8C82] bg-[#2E8C82]/5 shadow-xs ring-1 ring-[#2E8C82] dark:border-[#2E8C82] dark:bg-[#2E8C82]/10'
                    : 'border-slate-200 bg-white hover:border-[#2E8C82]/40 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                {isAdmin && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget({ id: b.id, title: b.title });
                    }}
                    disabled={removeRanking.isPending}
                    title="Apagar ranking"
                    className="min-h-[38px] min-w-[38px] absolute right-2.5 top-2.5 inline-flex items-center justify-center rounded-xl p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 active:scale-95 transition-all duration-fast dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <p className="pr-8 text-base font-bold text-slate-900 dark:text-white">
                  {b.title}
                </p>
                {b.description && (
                  <p className="mt-1.5 line-clamp-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {b.description}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <Users className="h-4 w-4 text-[#2E8C82]" />
                  <span>{b._count.participants} participante{b._count.participants === 1 ? '' : 's'}</span>
                  {b.subject && <span>· {b.subject.name}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Leaderboard Details */}
      {selectedId && <RankingsLeaderboard rankingId={selectedId} />}

      {/* Confirmation Dialog for Deletion */}
      {deleteTarget && (
        <ConfirmDialog
          title="Excluir Ranking?"
          message={
            <>
              Tem certeza que deseja apagar o ranking <strong className="text-slate-900 dark:text-white">{deleteTarget.title}</strong>? Esta ação é definitiva e removerá as pontuações associadas.
            </>
          }
          confirmLabel="Excluir Definitivamente"
          isPending={removeRanking.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => removeRanking.mutate(deleteTarget.id)}
        />
      )}
    </div>
  );
}

export default RankingsPage;
