import { useState } from 'react';
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

// Botão "Tirar dúvida com o grupo": na questão, ela é compartilhada no grupo e a dúvida fica presa a ela.
export function GroupDoubtButton({ targetType, targetId, context, className }: GroupDoubtButtonProps) {
  const [open, setOpen] = useState(false);
  const [groupId, setGroupId] = useState('');
  const { data: groups = [], isLoading } = useQuery({ queryKey: ['groups'], queryFn: groupService.list, enabled: open });
  const chosen = groupId || groups[0]?.id || '';

  const send = useMutation({
    mutationFn: async (body: string) => {
      // Dúvida sobre questão: primeiro compartilha a questão no grupo, para os colegas verem o enunciado completo.
      if (targetType === 'QUESTION' && targetId) await shareService.create(chosen, 'QUESTION', targetId);
      await commentService.create(chosen, { body, kind: 'DOUBT', targetType, targetId, context: context.slice(0, MAX_CONTEXT) });
    },
    onSuccess: () => {
      toast.success('Dúvida enviada ao grupo.');
      setOpen(false);
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Não foi possível enviar a dúvida.')),
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? 'flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:underline'}
      >
        <MessageCircleQuestion className="h-3.5 w-3.5" /> Tirar dúvida com o grupo
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Tirar dúvida com o grupo"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white">Tirar dúvida com o grupo</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : groups.length === 0 ? (
              <p className="text-sm text-gray-500">Você ainda não participa de nenhum grupo. Entre ou crie um em Competição.</p>
            ) : (
              <div className="space-y-3">
                {groups.length > 1 && (
                  <select
                    value={chosen}
                    onChange={(e) => setGroupId(e.target.value)}
                    aria-label="Grupo"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                )}
                <p className="line-clamp-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-800/60 dark:text-gray-300">{context}</p>
                <CommentForm placeholder="Qual é a sua dúvida?" submitLabel="Enviar dúvida" pending={send.isPending} onSubmit={({ body }) => send.mutate(body)} />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
