import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { LifeBuoy, Loader2, X } from 'lucide-react';

import { toast } from '@/components/ui/toast-store';
import { getErrorMessage } from '@/utils/error-message';

import { commentService, type CommentTarget } from '../services/comment.service';
import { groupService } from '../services/group.service';
import { CommentForm } from './CommentForm';

const MAX_CONTEXT = 1500;

export interface AskGroupHelpProps {
  targetType: Extract<CommentTarget, 'QUESTION' | 'FLASHCARD'>;
  targetId?: string;
  // Texto da questão ou do cartão, para os colegas entenderem a dúvida sem sair do grupo.
  context: string;
  className?: string;
}

// Botão "Pedir ajuda ao grupo" para usar direto na tela de estudo.
export function AskGroupHelp({ targetType, targetId, context, className }: AskGroupHelpProps) {
  const [open, setOpen] = useState(false);
  const [groupId, setGroupId] = useState('');
  const { data: groups = [], isLoading } = useQuery({ queryKey: ['groups'], queryFn: groupService.list, enabled: open });
  const chosen = groupId || groups[0]?.id || '';

  const send = useMutation({
    mutationFn: (body: string) =>
      commentService.create(chosen, { body, kind: 'HELP', targetType, targetId, context: context.slice(0, MAX_CONTEXT) }),
    onSuccess: () => {
      toast.success('Pedido de ajuda enviado ao grupo.');
      setOpen(false);
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Não foi possível enviar o pedido.')),
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? 'flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:underline'}
      >
        <LifeBuoy className="h-3.5 w-3.5" /> Pedir ajuda ao grupo
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Pedir ajuda ao grupo"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white">Pedir ajuda ao grupo</h2>
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
                <CommentForm placeholder="Explique sua dúvida" submitLabel="Enviar pedido" pending={send.isPending} onSubmit={({ body }) => send.mutate(body)} />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
