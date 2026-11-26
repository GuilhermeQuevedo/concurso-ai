import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2, MessageCircleQuestion, X } from 'lucide-react';

import { toast } from '@/components/ui/toast-store';
import { getErrorMessage } from '@/utils/error-message';

import { commentService, type CommentTarget } from '../services/comment.service';
import { groupService } from '../services/group.service';
import { shareService } from '../services/share.service';
import { CommentForm } from './CommentForm';

const MAX_CONTEXT = 1500;

export interface GroupDoubtButtonProps {
  targetType: Extract<CommentTarget, 'QUESTION' | 'FLASHCARD'>;
  targetId?: string;
  // Texto da questão ou do cartão, para os colegas entenderem a dúvida sem sair do grupo.
  context: string;
  className?: string;
}

// Botão "Tirar dúvida com o grupo": na questão, ela é compartilhada no grupo e a dúvida fica vinculada a ela.
export function GroupDoubtButton({
  targetType,
  targetId,
  context,
  className,
}: GroupDoubtButtonProps) {
  const [open, setOpen] = useState(false);
  const [groupId, setGroupId] = useState('');
  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: groupService.list,
    enabled: open,
  });
  const chosen = groupId || groups[0]?.id || '';

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const send = useMutation({
    mutationFn: async (body: string) => {
      // Dúvida sobre questão: primeiro compartilha a questão no grupo, para os colegas verem o enunciado completo.
      if (targetType === 'QUESTION' && targetId) await shareService.create(chosen, 'QUESTION', targetId);
      await commentService.create(chosen, {
        body,
        kind: 'DOUBT',
        targetType,
        targetId,
        context: context.slice(0, MAX_CONTEXT),
      });
    },
    onSuccess: () => {
      toast.success('Dúvida enviada ao grupo com sucesso.');
      setOpen(false);
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Não foi possível enviar a dúvida.')),
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          'min-h-[44px] inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold text-[#2E8C82] hover:bg-[#2E8C82]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] active:scale-95 transition-all duration-fast touch-manipulation dark:text-[#38b2a6]'
        }
      >
        <MessageCircleQuestion className="h-4 w-4 shrink-0 text-[#2E8C82] dark:text-[#38b2a6]" />
        <span>Tirar dúvida com o grupo</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs motion-safe:animate-in motion-safe:fade-in duration-fast"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Tirar dúvida com o grupo"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 motion-safe:animate-in motion-safe:zoom-in-95 duration-fast"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2E8C82]/10 text-[#2E8C82] dark:bg-[#2E8C82]/20 dark:text-[#38b2a6]">
                  <MessageCircleQuestion className="h-4 w-4" />
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Tirar dúvida com o grupo
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] active:scale-95 transition-all duration-fast dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8" role="status" aria-label="Carregando grupos">
                <Loader2 className="h-6 w-6 animate-spin text-[#2E8C82]" />
              </div>
            ) : groups.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm font-medium text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Você ainda não participa de nenhum grupo de estudos. Entre ou crie um na aba de Competição.
              </p>
            ) : (
              <div className="space-y-4">
                {groups.length > 1 && (
                  <div>
                    <label
                      htmlFor="group-select"
                      className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300"
                    >
                      Escolha o grupo de destino:
                    </label>
                    <select
                      id="group-select"
                      value={chosen}
                      onChange={(e) => setGroupId(e.target.value)}
                      aria-label="Grupo"
                      className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-base sm:text-sm text-slate-900 focus:border-[#2E8C82] focus:outline-none focus:ring-2 focus:ring-[#2E8C82]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                  <p className="line-clamp-3 leading-relaxed font-serif">{context}</p>
                </div>
                <CommentForm
                  placeholder="Qual é a sua dúvida para o grupo?"
                  submitLabel="Enviar dúvida"
                  pending={send.isPending}
                  onSubmit={({ body }) => send.mutate(body)}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
