import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, HelpCircle, MessageSquare, ThumbsUp, Trash2 } from 'lucide-react';

import { toast } from '@/components/ui/toast-store';
import { getErrorMessage } from '@/utils/error-message';

import { commentService, type CommentDTO } from '../services/comment.service';
import { CommentForm } from './CommentForm';

const TARGET_LABEL: Record<CommentDTO['targetType'], string> = {
  QUESTION: 'Questão',
  FLASHCARD: 'Flashcard',
  DECK: 'Deck',
  GENERAL: 'Geral',
};

function authorName(author: CommentDTO['author']): string {
  return author.nickname ? `@${author.nickname}` : author.name;
}

export interface CommentThreadProps {
  groupId: string;
  thread: CommentDTO;
  // Chaves de cache a atualizar depois de qualquer ação.
  queryKey: readonly unknown[];
  canModerate: boolean;
}

// Uma conversa: pergunta (ou comentário) com respostas, marcar resposta útil e resolver.
export function CommentThread({ groupId, thread, queryKey, canModerate }: CommentThreadProps) {
  const queryClient = useQueryClient();
  const [replying, setReplying] = useState(false);
  const refresh = () => queryClient.invalidateQueries({ queryKey });
  const onError = (error: unknown) => toast.error(getErrorMessage(error, 'Não foi possível concluir a ação.'));

  const reply = useMutation({
    mutationFn: (body: string) => commentService.create(groupId, { body, parentId: thread.id }),
    onSuccess: () => {
      setReplying(false);
      refresh();
    },
    onError,
  });
  const remove = useMutation({ mutationFn: (id: string) => commentService.remove(groupId, id), onSuccess: refresh, onError });
  const resolve = useMutation({
    mutationFn: (resolved: boolean) => commentService.resolve(groupId, thread.id, resolved),
    onSuccess: refresh,
    onError,
  });
  const helpful = useMutation({
    mutationFn: (id: string) => commentService.markHelpful(groupId, id),
    onSuccess: () => {
      toast.success('Resposta marcada como útil.');
      refresh();
    },
    onError,
  });

  const isHelp = thread.kind === 'HELP';

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <header className="mb-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span className="font-semibold text-gray-800 dark:text-gray-200">{authorName(thread.author)}</span>
        <span>· {TARGET_LABEL[thread.targetType]}</span>
        {isHelp && (
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
              thread.resolved
                ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
            }`}
          >
            {thread.resolved ? <CheckCircle2 className="h-3 w-3" /> : <HelpCircle className="h-3 w-3" />}
            {thread.resolved ? 'Resolvido' : 'Precisa de ajuda'}
          </span>
        )}
        <span className="ml-auto">{new Date(thread.createdAt).toLocaleDateString('pt-BR')}</span>
      </header>

      {thread.context && (
        <blockquote className="mb-2 whitespace-pre-line rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-800/60 dark:text-gray-300">
          {thread.context}
        </blockquote>
      )}
      <p className="whitespace-pre-line text-sm text-gray-900 dark:text-gray-100">{thread.body}</p>

      {thread.replies.length > 0 && (
        <ul className="mt-3 space-y-2 border-l-2 border-gray-200 pl-3 dark:border-gray-700">
          {thread.replies.map((r) => (
            <li key={r.id} className="text-sm">
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="font-semibold text-gray-800 dark:text-gray-200">{authorName(r.author)}</span>
                {r.helpful && (
                  <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
                    <ThumbsUp className="h-3 w-3" /> Resposta útil
                  </span>
                )}
                {thread.isMine && isHelp && !r.helpful && !r.isMine && (
                  <button
                    type="button"
                    onClick={() => helpful.mutate(r.id)}
                    disabled={helpful.isPending}
                    className="font-medium text-primary-600 hover:underline disabled:opacity-50"
                  >
                    Marcar como útil
                  </button>
                )}
                {(r.isMine || canModerate) && (
                  <button type="button" onClick={() => remove.mutate(r.id)} aria-label="Apagar resposta" className="ml-auto text-gray-400 hover:text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="whitespace-pre-line text-gray-800 dark:text-gray-200">{r.body}</p>
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-3 flex flex-wrap items-center gap-3 text-xs">
        <button type="button" onClick={() => setReplying((v) => !v)} className="flex items-center gap-1 font-medium text-primary-600 hover:underline">
          <MessageSquare className="h-3.5 w-3.5" /> Responder
        </button>
        {isHelp && thread.isMine && (
          <button type="button" onClick={() => resolve.mutate(!thread.resolved)} className="font-medium text-gray-500 hover:underline dark:text-gray-400">
            {thread.resolved ? 'Reabrir' : 'Marcar como resolvido'}
          </button>
        )}
        {(thread.isMine || canModerate) && (
          <button type="button" onClick={() => remove.mutate(thread.id)} className="ml-auto flex items-center gap-1 text-gray-400 hover:text-red-500">
            <Trash2 className="h-3.5 w-3.5" /> Apagar
          </button>
        )}
      </footer>

      {replying && (
        <div className="mt-3">
          <CommentForm placeholder="Escreva sua resposta" submitLabel="Responder" pending={reply.isPending} onSubmit={({ body }) => reply.mutate(body)} />
        </div>
      )}
    </article>
  );
}
