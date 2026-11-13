import { Loader2, X } from 'lucide-react';
import { useState } from 'react';

export type NewItemKind = 'tarefa' | 'lembrete';

export interface NewItemInput {
  kind: NewItemKind;
  title: string;
  date: string;
  discipline?: string;
  duration: number;
}

interface NewItemDialogProps {
  initialDate: string;
  initialKind: NewItemKind;
  subjects: string[];
  saving: boolean;
  onSubmit: (input: NewItemInput) => void;
  onClose: () => void;
}

const field =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white';
const label = 'mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300';

export function NewItemDialog({ initialDate, initialKind, subjects, saving, onSubmit, onClose }: NewItemDialogProps) {
  const [kind, setKind] = useState<NewItemKind>(initialKind);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(initialDate);
  const [discipline, setDiscipline] = useState('');
  const [duration, setDuration] = useState(60);
  const valid = title.trim().length > 0 && date !== '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onSubmit({ kind, title: title.trim(), date, discipline: discipline.trim() || undefined, duration });
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">{kind === 'tarefa' ? 'Nova tarefa' : 'Novo lembrete'}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div role="group" aria-label="Tipo" className="mb-4 flex overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
          {(['tarefa', 'lembrete'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setKind(option)}
              className={`flex-1 py-2 text-sm font-medium ${kind === option ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'}`}
            >
              {option === 'tarefa' ? 'Tarefa' : 'Lembrete'}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <label className={label} htmlFor="new-item-title">Título</label>
            <input id="new-item-title" autoFocus value={title} maxLength={kind === 'tarefa' ? 120 : 200} onChange={(e) => setTitle(e.target.value)} placeholder={kind === 'tarefa' ? 'Ex.: Estudar Cardiologia' : 'Ex.: Pagar a inscrição'} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="new-item-date">Data</label>
            <input id="new-item-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
          </div>
          {kind === 'tarefa' && (
            <>
              <div>
                <label className={label} htmlFor="new-item-subject">Matéria (opcional)</label>
                <input id="new-item-subject" list="calendar-subjects" value={discipline} maxLength={80} onChange={(e) => setDiscipline(e.target.value)} className={field} />
                <datalist id="calendar-subjects">
                  {subjects.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className={label} htmlFor="new-item-duration">Duração (minutos)</label>
                <input id="new-item-duration" type="number" min={5} max={720} step={5} value={duration} onChange={(e) => setDuration(Number(e.target.value) || 60)} className={field} />
              </div>
            </>
          )}
        </div>

        <button type="submit" disabled={!valid || saving} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {kind === 'tarefa' ? 'Criar tarefa' : 'Criar lembrete'}
        </button>
      </form>
    </div>
  );
}
