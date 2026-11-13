import { useState } from 'react';
import { Gamepad2, FileQuestion, Layers, Sparkles, X } from 'lucide-react';

import type { ContentKind } from '../types';

const OPTIONS: Array<{ kind: ContentKind; label: string; icon: typeof Gamepad2 }> = [
  { kind: 'JOGOS', label: 'Jogos', icon: Gamepad2 },
  { kind: 'QUESTOES', label: 'Questões', icon: FileQuestion },
  { kind: 'FLASHCARDS', label: 'Flashcards', icon: Layers },
];

interface Props {
  onPick: (kind: ContentKind) => void;
  disabled?: boolean;
}

export function GenerateContentMenu({ onPick, disabled }: Props) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-teal-500/40 text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 hover:border-teal-500/60 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
      >
        <Sparkles className="w-3.5 h-3.5" /> Gerar conteúdo
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {OPTIONS.map(({ kind, label, icon: Icon }) => (
        <button
          key={kind}
          type="button"
          onClick={() => onPick(kind)}
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-teal-500/40 text-teal-200 bg-teal-500/15 hover:bg-teal-500/30 transition-colors cursor-pointer"
        >
          <Icon className="w-3.5 h-3.5" /> {label}
        </button>
      ))}
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Fechar opções"
        className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
