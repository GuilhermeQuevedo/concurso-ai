import { useEffect, useRef, useState } from 'react';
import { Layers, Clock, MoreVertical, Pencil, Play } from 'lucide-react';
import type { DeckDTO } from '../services/flashcard.service';

function dueLabel(deck: DeckDTO): string {
  if (!deck.nextReview) return '—';
  if (deck.due > 0) return 'Hoje';
  const days = Math.ceil((new Date(deck.nextReview).getTime() - Date.now()) / 86400000);
  if (days <= 1) return 'Amanhã';
  return `Em ${days} dias`;
}

export function DeckCard({
  deck,
  onStudy,
  onEdit,
}: {
  deck: DeckDTO;
  onStudy: (deck: DeckDTO) => void;
  onEdit: (deck: DeckDTO) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
      style={{ borderTop: `3px solid ${deck.color}` }}
    >
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-900 dark:text-white">{deck.name}</p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              {deck.subject?.name ?? 'Sem matéria'}
              {deck.topic ? ` · ${deck.topic}` : ''}
            </p>
          </div>
          <div ref={menuRef} className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-10 mt-1 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <button
                  onClick={() => { setMenuOpen(false); onEdit(deck); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <Pencil className="h-3.5 w-3.5" /> Editar deck
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="my-3 flex gap-2 text-xs">
          <span className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            <Layers className="h-3.5 w-3.5" /> <strong>{deck.total}</strong> {deck.total === 1 ? 'card' : 'cards'}
          </span>
          <span
            className={`flex items-center gap-1 rounded-md px-2 py-1 ${
              deck.due > 0 ? 'bg-primary-600/10 text-primary-600 dark:text-primary-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            <Clock className="h-3.5 w-3.5" /> <strong>{dueLabel(deck)}</strong>
          </span>
        </div>

        <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          <span>Confiança</span>
          <span style={{ color: deck.color }}>{deck.confidence}%</span>
        </div>
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
          <div className="h-full rounded-full" style={{ width: `${deck.confidence}%`, backgroundColor: deck.color }} />
        </div>

        <button
          onClick={() => onStudy(deck)}
          disabled={deck.total === 0}
          className="mt-auto flex items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-40"
        >
          <Play className="h-4 w-4" /> Estudar
        </button>
      </div>
    </div>
  );
}
