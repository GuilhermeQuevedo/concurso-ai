import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Plus, X } from 'lucide-react';

import { toast } from '@/components/ui/toast-store';
import { getErrorMessage } from '@/utils/error-message';

import { reminderService, type ReminderDTO } from '../services/reminder.service';

const QUERY_KEY = ['reminders'];

export interface DayRemindersProps {
  // Dia escolhido no calendário (AAAA-MM-DD); novos lembretes nascem nele.
  day: string;
  reminders: ReminderDTO[];
}

// Lembretes do dia escolhido no calendário: ver, concluir, apagar e criar já com a data.
export function DayReminders({ day, reminders }: DayRemindersProps) {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const refresh = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  const onError = (error: unknown) => toast.error(getErrorMessage(error, 'Não foi possível salvar o lembrete.'));

  const create = useMutation({
    mutationFn: () => reminderService.create({ text: text.trim(), dueDate: day }),
    onSuccess: () => {
      setText('');
      refresh();
    },
    onError,
  });
  const toggle = useMutation({ mutationFn: (r: ReminderDTO) => reminderService.update(r.id, { done: !r.done }), onSuccess: refresh, onError });
  const remove = useMutation({ mutationFn: (id: string) => reminderService.remove(id), onSuccess: refresh, onError });

  return (
    <section aria-label="Lembretes do dia" className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        <Bell className="h-3.5 w-3.5" /> Lembretes
      </h4>

      {reminders.length === 0 ? (
        <p className="mb-2 text-xs text-gray-400">Nenhum lembrete neste dia.</p>
      ) : (
        <ul className="mb-2 space-y-1">
          {reminders.map((r) => (
            <li key={r.id} className="group flex items-start gap-2 rounded-md px-1 py-1 hover:bg-gray-50 dark:hover:bg-gray-800/60">
              <button
                type="button"
                onClick={() => toggle.mutate(r)}
                aria-label={r.done ? 'Marcar como pendente' : 'Marcar como feito'}
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                  r.done ? 'border-primary-500 bg-primary-500 text-white' : 'border-gray-300 text-transparent hover:border-primary-400 dark:border-gray-600'
                }`}
              >
                <Check size={11} />
              </button>
              <span className={`min-w-0 flex-1 break-words text-sm ${r.done ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-gray-200'}`}>{r.text}</span>
              <button
                type="button"
                onClick={() => remove.mutate(r.id)}
                aria-label="Apagar lembrete"
                className="shrink-0 rounded p-0.5 text-gray-400 opacity-0 hover:text-red-500 focus:opacity-100 group-hover:opacity-100"
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) create.mutate();
        }}
        className="flex gap-2"
      >
        <input
          value={text}
          maxLength={200}
          onChange={(e) => setText(e.target.value)}
          placeholder="Novo lembrete para este dia"
          aria-label="Novo lembrete para este dia"
          className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        <button
          type="submit"
          disabled={!text.trim() || create.isPending}
          aria-label="Adicionar lembrete"
          className="flex items-center rounded-lg bg-primary-600 px-2.5 text-white hover:bg-primary-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
        </button>
      </form>
    </section>
  );
}
