import { Loader2 } from 'lucide-react';

import type { PresetCargo } from '../services/preset-edital.service';

interface PresetCargoPreviewProps {
  cargo: PresetCargo;
  creating: boolean;
  onConfirm: () => void;
}

export function PresetCargoPreview({ cargo, creating, onConfirm }: PresetCargoPreviewProps) {
  return (
    <div className="rounded-xl border border-primary-200 bg-primary-50/60 p-4 dark:border-primary-900 dark:bg-primary-950/30">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300">Seu edital</p>
      <h3 className="mt-0.5 text-base font-bold text-gray-900 dark:text-white">{cargo.label}</h3>
      <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
        {cargo.disciplines.length} matérias · {cargo.topicCount} tópicos {cargo.cargoCode && `· ${cargo.cargoCode}`}
      </p>

      <ul className="mb-4 max-h-56 space-y-1 overflow-y-auto pr-1 text-sm">
        {cargo.disciplines.map((discipline) => (
          <li key={discipline.name} className="flex items-baseline justify-between gap-3 text-gray-700 dark:text-gray-300">
            <span>{discipline.name}</span>
            <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{discipline.topicCount} tópicos</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onConfirm}
        disabled={creating}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-3 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
      >
        {creating && <Loader2 className="h-4 w-4 animate-spin" />}
        Criar meu edital
      </button>
    </div>
  );
}
