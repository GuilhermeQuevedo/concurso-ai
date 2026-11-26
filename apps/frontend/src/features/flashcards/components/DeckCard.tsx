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

  const accentColor = deck.color || '#2E8C82';

  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white transition-all duration-fast ease-standard hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700 shadow-xs"
      style={{ borderTop: `4px solid ${accentColor}` }}
    >
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-bold text-gray-900 dark:text-white text-base">{deck.name}</p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {deck.subject?.name ?? 'Sem matéria'}
              {deck.topic ? ` · ${deck.topic}` : ''}
            </p>
          </div>
          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Opções do deck"
              className="min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px] flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors duration-fast touch-manipulation cursor-pointer dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-10 mt-1 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg animate-in fade-in duration-fast dark:border-gray-700 dark:bg-gray-800">
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onEdit(deck); }}
                  className="min-h-[44px] sm:min-h-[36px] flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors touch-manipulation cursor-pointer dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <Pencil className="h-3.5 w-3.5" /> Editar deck
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="my-3 flex flex-wrap gap-2 text-xs">
          <span className="flex items-center gap-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-gray-700 dark:text-gray-300 font-medium border border-gray-200/60 dark:border-gray-700/60">
            <Layers className="h-3.5 w-3.5" /> <strong>{deck.total}</strong> {deck.total === 1 ? 'card' : 'cards'}
          </span>
          <span
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium border ${
              deck.due > 0
                ? 'bg-primary-600/10 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 font-bold border-primary-600/20'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200/60 dark:border-gray-700/60'
            }`}
          >
            <Clock className="h-3.5 w-3.5" /> <strong>{dueLabel(deck)}</strong>
          </span>
        </div>

        <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          <span>Confiança</span>
          <span style={{ color: accentColor }} className="font-bold">{deck.confidence}%</span>
        </div>
        <div className="mb-5 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            className="h-full rounded-full transition-all duration-normal ease-standard"
            style={{ width: `${deck.confidence}%`, backgroundColor: accentColor }}
          />
        </div>

        <button
          type="button"
          onClick={() => onStudy(deck)}
          disabled={deck.total === 0}
          className="mt-auto min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white shadow-xs transition-all duration-fast ease-standard hover:bg-primary-700 active:scale-[0.98] disabled:opacity-40 disabled:hover:bg-primary-600 disabled:cursor-not-allowed touch-manipulation cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
        >
          <Play className="h-4 w-4 fill-current" /> Estudar
        </button>
      </div>
    </div>
  );
}
