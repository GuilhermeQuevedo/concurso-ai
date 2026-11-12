import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, X } from 'lucide-react';

import { toast } from '@/components/ui/toast-store';
import { contestService } from '@/features/contests/services/contest.service';
import { deckService } from '@/features/flashcards/services/flashcard.service';
import { studyScheduleService } from '@/features/study-schedule/services/study-schedule.service';
import { getErrorMessage } from '@/utils/error-message';

import { shareService, type ShareType } from '../services/share.service';
import { SHARE_META } from './shareMeta';

interface Option {
  type: ShareType;
  refId: string;
  title: string;
  hint: string;
}

// Escolha do que compartilhar: só aparecem itens da própria conta.
export function SharePickerDialog({ groupId, onClose }: { groupId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const decks = useQuery({ queryKey: ['decks'], queryFn: () => deckService.list() });
  const contests = useQuery({ queryKey: ['contests'], queryFn: contestService.list });
  const schedules = useQuery({ queryKey: ['study-schedules'], queryFn: studyScheduleService.listSchedules });

  const share = useMutation({
    mutationFn: (option: Option) => shareService.create(groupId, option.type, option.refId),
    onSuccess: (_data, option) => {
      toast.success(`"${option.title}" compartilhado com o grupo.`);
      queryClient.invalidateQueries({ queryKey: ['group-shares', groupId] });
      onClose();
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Não foi possível compartilhar.')),
  });

  const options: Option[] = [
    ...(decks.data ?? []).map((d) => ({ type: 'DECK' as const, refId: d.id, title: d.name, hint: `${d.total} cartões` })),
    ...(contests.data ?? []).map((c) => ({ type: 'CONTEST' as const, refId: c.id, title: c.name, hint: `${c.totalTopics} tópicos` })),
    ...(schedules.data ?? [])
      .filter((s) => s.id)
      .map((s) => ({
        type: 'SCHEDULE' as const,
        refId: s.id as string,
        title: s.schedule?.title ?? `Cronograma até ${s.examDate}`,
        hint: `Prova em ${s.examDate}`,
      })),
  ];
  const loading = decks.isLoading || contests.isLoading || schedules.isLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Compartilhar com o grupo"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-md flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Compartilhar com o grupo</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : options.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-500">Você ainda não tem decks, editais ou cronogramas para compartilhar.</p>
          ) : (
            <ul className="space-y-1">
              {options.map((option) => {
                const { icon: Icon, label, color } = SHARE_META[option.type];
                return (
                  <li key={`${option.type}-${option.refId}`}>
                    <button
                      type="button"
                      disabled={share.isPending}
                      onClick={() => share.mutate(option)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-gray-50 disabled:opacity-50 dark:hover:bg-gray-800"
                    >
                      <Icon className={`h-5 w-5 shrink-0 ${color}`} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">{option.title}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                          {label} · {option.hint}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
