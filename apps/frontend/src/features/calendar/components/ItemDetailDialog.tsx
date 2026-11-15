import { CheckCircle2, Circle, Clock, Trash2, X } from 'lucide-react';
import { Link } from 'react-router';

import { formatLongDate } from '../calendar-dates';
import { KIND_LABELS, type CalendarItem } from '../calendar-items';

interface ItemDetailDialogProps {
  item: CalendarItem;
  busy: boolean;
  onToggle: (item: CalendarItem) => void;
  onDelete: (item: CalendarItem) => void;
  onClose: () => void;
}

// Só o que o aluno criou à mão pode ser apagado; o que vem do plano ou do cronograma só é concluído.
function canDelete(item: CalendarItem): boolean {
  if (item.source.type === 'reminder') return true;
  return item.source.type === 'task' && item.source.task.contestId === null;
}

export function ItemDetailDialog({ item, busy, onToggle, onDelete, onClose }: ItemDetailDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-label={item.title}
        className="w-full max-w-sm rounded-2xl border-t-4 bg-white p-5 shadow-xl dark:bg-gray-900"
        style={{ borderTopColor: item.color }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">{item.title}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <span className="mb-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: item.color }}>
          {KIND_LABELS[item.kind]}
        </span>

        <dl className="mb-4 space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
          {item.subject && <div>{item.subject}</div>}
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> {formatLongDate(item.date)}
          </div>
          {item.detail && <div className="text-xs text-gray-500 dark:text-gray-400">{item.detail}</div>}
          <div className={item.done ? 'font-medium text-green-600' : 'font-medium text-amber-600'}>{item.done ? 'Concluído' : 'Pendente'}</div>
        </dl>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => onToggle(item)}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {item.done ? <Circle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            {item.done ? 'Marcar pendente' : 'Marcar como feito'}
          </button>
          {item.source.type === 'schedule' && (
            <Link to="/cronograma" className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
              Abrir cronograma
            </Link>
          )}
          {canDelete(item) && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onDelete(item)}
              aria-label="Apagar"
              className="ml-auto rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
