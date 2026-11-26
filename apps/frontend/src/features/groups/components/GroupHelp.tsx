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
  // Quando informado, mostra apenas as conversas daquele item específico (ex.: um deck compartilhado).
  target?: { type: CommentTarget; id: string };
  canModerate: boolean;
  emptyText?: string;
}

// Lista de conversas do grupo com formulário para interagir ou tirar dúvidas coletivas.
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
    onError: (error) => toast.error(getErrorMessage(error, 'Não foi possível enviar a mensagem.')),
  });

  return (
    <div className="space-y-5 motion-safe:animate-in motion-safe:fade-in duration-fast">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        {!target && (
          <textarea
            value={context}
            maxLength={1500}
            onChange={(e) => setContext(e.target.value)}
            placeholder="(Opcional) Cole aqui o texto da questão ou do flashcard para contextualizar sua dúvida..."
            aria-label="Contexto da dúvida"
            rows={2}
            className="mb-3 min-h-[80px] w-full resize-none rounded-xl border border-slate-300 bg-white p-3 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2E8C82] focus:outline-none focus:ring-2 focus:ring-[#2E8C82]/20 transition-colors duration-fast dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        )}
        <CommentForm
          placeholder={target ? 'Comente ou tire uma dúvida sobre este item...' : 'Qual é a sua dúvida para o grupo?'}
          submitLabel="Publicar Dúvida"
          allowDoubt
          defaultDoubt={!target}
          pending={create.isPending}
          onSubmit={(value) => create.mutate(value)}
        />
      </div>

      <div className="flex items-center justify-between px-1">
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={onlyOpen}
            onChange={(e) => setOnlyOpen(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-[#2E8C82] focus:ring-[#2E8C82] dark:border-slate-700 dark:bg-slate-800"
          />
          Mostrar apenas dúvidas em aberto
        </label>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12" role="status" aria-label="Carregando discussões do grupo">
          <Loader2 className="h-8 w-8 animate-spin text-[#2E8C82]" />
        </div>
      ) : threads.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm font-medium text-slate-500 dark:border-slate-700 dark:text-slate-400">
          {emptyText ?? (onlyOpen ? 'Nenhuma dúvida em aberto no momento. 🎉' : 'Nenhuma conversa iniciada ainda. Seja o primeiro a postar!')}
        </p>
      ) : (
        <div className="space-y-4">
          {threads.map((thread) => (
            <CommentThread
              key={thread.id}
              groupId={groupId}
              thread={thread}
              queryKey={['group-comments', groupId]}
              canModerate={canModerate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
