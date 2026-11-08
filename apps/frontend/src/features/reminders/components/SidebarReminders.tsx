import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Plus, X } from 'lucide-react';

import { toast } from '@/components/ui/toast-store';
import { getErrorMessage } from '@/utils/error-message';

import { reminderService, type ReminderDTO } from '../services/reminder.service';

const QUERY_KEY = ['reminders'];
const MAX_VISIBLE = 5;

function formatDue(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
}

function isOverdue(reminder: ReminderDTO): boolean {
  if (reminder.done || !reminder.dueDate) return false;
  return reminder.dueDate.slice(0, 10) < new Date().toISOString().slice(0, 10);
}

// Lembretes rápidos no rodapé do menu: texto curto, data opcional, marcar como feito.
export function SidebarReminders() {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState('');

  const { data: reminders = [] } = useQuery({ queryKey: QUERY_KEY, queryFn: reminderService.list });
  const refresh = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  const onError = (error: unknown) => toast.error(getErrorMessage(error, 'Não foi possível salvar o lembrete.'));

  const create = useMutation({
    mutationFn: () => reminderService.create({ text: text.trim(), dueDate: dueDate || undefined }),
    onSuccess: () => {
      setText('');
      setDueDate('');
      setAdding(false);
      refresh();
    },
    onError,
  });
  const toggle = useMutation({
    mutationFn: (r: ReminderDTO) => reminderService.update(r.id, { done: !r.done }),
    onSuccess: refresh,
    onError,
  });
  const remove = useMutation({ mutationFn: (id: string) => reminderService.remove(id), onSuccess: refresh, onError });

  const pending = reminders.filter((r) => !r.done);
  const visible = [...pending, ...reminders.filter((r) => r.done)].slice(0, MAX_VISIBLE);

  return (
    <section aria-label="Lembretes" className="shrink-0 border-t border-white/8 px-3 py-3">
      <div className="mb-1.5 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/50">
          <Bell size={12} /> Lembretes
          {pending.length > 0 && <span className="rounded-full bg-teal-500/25 px-1.5 text-[10px] text-teal-300">{pending.length}</span>}
        </h2>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          aria-label={adding ? 'Cancelar novo lembrete' : 'Novo lembrete'}
          className="rounded p-0.5 text-white/60 hover:bg-white/10 hover:text-white"
        >
          {adding ? <X size={15} /> : <Plus size={15} />}
        </button>
      </div>

      {adding && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) create.mutate();
          }}
          className="mb-2 space-y-1.5"
        >
          <input
            autoFocus
            value={text}
            maxLength={200}
            onChange={(e) => setText(e.target.value)}
            placeholder="O que lembrar?"
            aria-label="Texto do lembrete"
            className="w-full rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-teal-400 focus:outline-none"
          />
          <div className="flex gap-1.5">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              aria-label="Data do lembrete"
              className="min-w-0 flex-1 rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs text-white [color-scheme:dark]"
            />
            <button
              type="submit"
              disabled={!text.trim() || create.isPending}
              className="rounded-md bg-teal-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
            >
              Salvar
            </button>
          </div>
        </form>
      )}

      {visible.length === 0 && !adding ? (
        <p className="text-xs text-white/40">Nenhum lembrete</p>
      ) : (
        <ul className="space-y-0.5">
          {visible.map((r) => (
            <li key={r.id} className="group flex items-start gap-1.5 rounded-md px-1 py-1 hover:bg-white/5">
              <button
                type="button"
                onClick={() => toggle.mutate(r)}
                aria-label={r.done ? 'Marcar como pendente' : 'Marcar como feito'}
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                  r.done ? 'border-teal-500 bg-teal-500 text-white' : 'border-white/30 text-transparent hover:border-teal-400'
                }`}
              >
                <Check size={11} />
              </button>
              <span className={`min-w-0 flex-1 break-words text-xs ${r.done ? 'text-white/35 line-through' : 'text-white/80'}`}>
                {r.text}
                {r.dueDate && (
                  <span className={`ml-1.5 text-[10px] ${isOverdue(r) ? 'text-red-300' : 'text-white/40'}`}>{formatDue(r.dueDate)}</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => remove.mutate(r.id)}
                aria-label="Apagar lembrete"
                className="shrink-0 rounded p-0.5 text-white/30 opacity-0 hover:text-red-300 focus:opacity-100 group-hover:opacity-100"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
