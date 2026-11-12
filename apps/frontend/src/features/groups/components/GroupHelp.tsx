import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import { toast } from '@/components/ui/toast-store';
import { getErrorMessage } from '@/utils/error-message';

import { commentService, type CommentTarget } from '../services/comment.service';
import { CommentForm } from './CommentForm';
import { CommentThread } from './CommentThread';

export interface GroupHelpProps {
  groupId: string;
  // Quando informado, mostra só as conversas daquele item (ex.: um deck compartilhado).
  target?: { type: CommentTarget; id: string };
  canModerate: boolean;
  emptyText?: string;
}

// Lista de conversas do grupo com formulário para comentar ou pedir ajuda.
export function GroupHelp({ groupId, target, canModerate, emptyText }: GroupHelpProps) {
  const queryClient = useQueryClient();
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [context, setContext] = useState('');
  const queryKey = ['group-comments', groupId, target?.type ?? 'all', target?.id ?? '', onlyOpen] as const;

  const { data: threads = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => commentService.list(groupId, { targetType: target?.type, targetId: target?.id, open: onlyOpen }),
  });

  const create = useMutation({
    mutationFn: (value: { body: string; doubt: boolean }) =>
      commentService.create(groupId, {
        body: value.body,
        kind: value.doubt ? 'DOUBT' : 'COMMENT',
        targetType: target?.type ?? 'GENERAL',
        targetId: target?.id,
        context: !target && context.trim() ? context.trim() : undefined,
      }),
    onSuccess: () => {
      setContext('');
      queryClient.invalidateQueries({ queryKey: ['group-comments', groupId] });
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Não foi possível enviar.')),
  });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        {!target && (
          <textarea
            value={context}
            maxLength={1500}
            onChange={(e) => setContext(e.target.value)}
            placeholder="(opcional) Cole aqui a questão ou o flashcard sobre o qual você tem dúvida"
            aria-label="Contexto da dúvida"
            rows={2}
            className="mb-2 w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        )}
        <CommentForm
          placeholder={target ? 'Comente ou tire uma dúvida' : 'Qual é a sua dúvida?'}
          submitLabel="Publicar"
          allowDoubt
          defaultDoubt={!target}
          pending={create.isPending}
          onSubmit={(value) => create.mutate(value)}
        />
      </div>

      <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
        <input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} className="rounded" />
        Mostrar só as dúvidas em aberto
      </label>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : threads.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          {emptyText ?? (onlyOpen ? 'Nenhuma dúvida em aberto. 🎉' : 'Nenhuma conversa ainda. Tire a primeira dúvida!')}
        </p>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <CommentThread key={thread.id} groupId={groupId} thread={thread} queryKey={['group-comments', groupId]} canModerate={canModerate} />
          ))}
        </div>
      )}
    </div>
  );
}
