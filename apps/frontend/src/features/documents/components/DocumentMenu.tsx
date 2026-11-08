import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal, Trash2, Trophy } from 'lucide-react';

import { KIND_LABELS, KIND_OPTIONS, type DocumentKind } from '../services/document.service';

export interface DocumentMenuProps {
  documentName: string;
  kind: DocumentKind;
  suggested: boolean;
  suggestDisabled: boolean;
  onChangeKind: (kind: DocumentKind) => void;
  onSuggest: () => void;
  onDelete: () => void;
}

// Menu "⋯" com as ações secundárias de um documento, para a lista ficar limpa.
export function DocumentMenu({ documentName, kind, suggested, suggestDisabled, onChangeKind, onSuggest, onDelete }: DocumentMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const run = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Mais ações para ${documentName}`}
        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-60 rounded-xl border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-900"
        >
          <label className="block px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Tipo do documento
            <select
              value={kind}
              onChange={(e) => onChangeKind(e.target.value as DocumentKind)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm font-normal normal-case tracking-normal text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {KIND_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {KIND_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            role="menuitem"
            onClick={run(onSuggest)}
            disabled={suggested || suggestDisabled}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <Trophy className="h-4 w-4" />
            {suggested ? 'Ranking sugerido ✓' : 'Sugerir ranking global'}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={run(onDelete)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            <Trash2 className="h-4 w-4" />
            Apagar documento
          </button>
        </div>
      )}
    </div>
  );
}
