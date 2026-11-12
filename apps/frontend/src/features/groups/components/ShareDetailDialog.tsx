import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Copy, Loader2, MessageCircleQuestion, X } from 'lucide-react';

import { toast } from '@/components/ui/toast-store';
import { getErrorMessage } from '@/utils/error-message';

import { GroupHelp } from './GroupHelp';
import { htmlToPlainText } from '@/lib/html';

import { commentService } from '../services/comment.service';
import { CommentForm } from './CommentForm';
import { shareService, type ShareDTO, type ShareDetailDTO } from '../services/share.service';

const COPIED_QUERY: Record<ShareDTO['type'], string> = { DECK: 'decks', CONTEST: 'contests', SCHEDULE: 'study-schedules', QUESTION: 'questions' };

// Visualização somente leitura do item compartilhado, com opção de copiar para o próprio perfil.
export function ShareDetailDialog({ groupId, share, canModerate, onClose }: { groupId: string; share: ShareDTO; canModerate: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['group-share', groupId, share.id],
    queryFn: () => shareService.detail(groupId, share.id),
  });

  const copy = useMutation({
    mutationFn: () => shareService.copy(groupId, share.id),
    onSuccess: () => {
      toast.success('Copiado para o seu perfil.');
      queryClient.invalidateQueries({ queryKey: [COPIED_QUERY[share.type]] });
      onClose();
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Não foi possível copiar.')),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={share.title}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h2 className="truncate font-semibold text-gray-900 dark:text-white">{share.title}</h2>
          <div className="flex items-center gap-2">
            {share.type !== 'QUESTION' && (
            <button
              type="button"
              onClick={() => copy.mutate()}
              disabled={copy.isPending || !data}
              className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {copy.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
              Copiar para o meu perfil
            </button>
            )}
            <button type="button" onClick={onClose} aria-label="Fechar" className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto p-5">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}
          {error && <p className="text-sm text-red-500">{getErrorMessage(error, 'Não foi possível abrir este item.')}</p>}
          {data && <DetailBody detail={data} groupId={groupId} />}
          {(share.type === 'DECK' || share.type === 'QUESTION') && (
            <section className="mt-6 border-t border-gray-100 pt-4 dark:border-gray-800">
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">{share.type === 'DECK' ? 'Dúvidas e comentários sobre este deck' : 'Dúvidas e comentários sobre esta questão'}</h3>
              <GroupHelp
                groupId={groupId}
                target={{ type: share.type === 'DECK' ? 'DECK' : 'QUESTION', id: share.refId }}
                canModerate={canModerate}
                emptyText="Nenhuma dúvida ou comentário ainda."
              />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailBody({ detail, groupId }: { detail: ShareDetailDTO; groupId: string }) {
  if (detail.type === 'QUESTION') {
    return (
      <div className="space-y-3 text-sm">
        <p className="text-xs text-gray-500 dark:text-gray-400">{detail.subject}</p>
        <p className="whitespace-pre-line text-gray-900 dark:text-white">{htmlToPlainText(detail.statement)}</p>
        <ul className="space-y-1">
          {detail.alternatives.map((alt) => (
            <li key={alt.letter} className="rounded-lg border border-gray-200 px-3 py-2 text-gray-700 dark:border-gray-700 dark:text-gray-300">
              <strong>{alt.letter})</strong> {alt.text}
            </li>
          ))}
        </ul>
        <details className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-800/60 dark:text-gray-300">
          <summary className="cursor-pointer font-medium">Ver gabarito e comentário</summary>
          <p className="mt-2">
            Gabarito: <strong>{detail.correctAnswer}</strong>
          </p>
          <p className="mt-1 whitespace-pre-line">{htmlToPlainText(detail.explanation)}</p>
        </details>
      </div>
    );
  }
  if (detail.type === 'DECK') {
    return (
      <ul className="space-y-2">
        {detail.cards.map((card) => (
          <li key={card.id} className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
            <p className="font-medium text-gray-900 dark:text-white">{card.front}</p>
            <p className="mt-1 text-gray-600 dark:text-gray-300">{card.back}</p>
            <CardDoubt groupId={groupId} card={card} />
          </li>
        ))}
      </ul>
    );
  }
  if (detail.type === 'CONTEST') {
    const byDiscipline = detail.topics.reduce<Record<string, string[]>>((acc, t) => {
      (acc[t.discipline] ??= []).push(t.topic);
      return acc;
    }, {});
    return (
      <div className="space-y-4 text-sm">
        <p className="text-gray-500 dark:text-gray-400">
          {[detail.organization, detail.role, detail.examBoard].filter(Boolean).join(' · ') || 'Edital'}
          {detail.examDate ? ` · prova em ${new Date(detail.examDate).toLocaleDateString('pt-BR')}` : ''}
        </p>
        {Object.entries(byDiscipline).map(([discipline, topics]) => (
          <section key={discipline}>
            <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">{discipline}</h3>
            <ul className="list-inside list-disc space-y-0.5 text-gray-600 dark:text-gray-300">
              {topics.map((topic, i) => (
                <li key={i}>{topic}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
      <p>Prova em {detail.examDate} · {detail.dailyHours}h por dia</p>
      {Array.isArray(detail.subjects) && detail.subjects.length > 0 && (
        <p>
          <strong>Matérias:</strong> {detail.subjects.join(', ')}
        </p>
      )}
      <p className="text-xs text-gray-500">Ao copiar, o cronograma vem sem nenhum dia marcado como concluído.</p>
    </div>
  );
}

const CARD_CONTEXT_SEPARATOR = '\n';

// Dúvida sobre um flashcard específico do deck compartilhado.
function CardDoubt({ groupId, card }: { groupId: string; card: { id: string; front: string; back: string } }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const send = useMutation({
    mutationFn: (body: string) =>
      commentService.create(groupId, {
        body,
        kind: 'DOUBT',
        targetType: 'FLASHCARD',
        targetId: card.id,
        context: `Frente: ${card.front}${CARD_CONTEXT_SEPARATOR}Verso: ${card.back}`,
      }),
    onSuccess: () => {
      toast.success('Dúvida enviada. Ela aparece na aba Dúvidas do grupo.');
      queryClient.invalidateQueries({ queryKey: ['group-comments', groupId] });
      setOpen(false);
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Não foi possível enviar a dúvida.')),
  });

  return (
    <div className="mt-2">
      {open ? (
        <CommentForm placeholder="Qual é a sua dúvida sobre este cartão?" submitLabel="Enviar dúvida" pending={send.isPending} onSubmit={({ body }) => send.mutate(body)} />
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline">
          <MessageCircleQuestion className="h-3.5 w-3.5" /> Tirar dúvida sobre este cartão
        </button>
      )}
    </div>
  );
}
