import { Loader2 } from 'lucide-react';

import type { PresetCargo } from '../services/preset-edital.service';

interface PresetCargoPreviewProps {
  cargo: PresetCargo;
  creating: boolean;
  onConfirm: () => void;
}

/**
 * Painel de pré-visualização do edital selecionado antes de sua criação oficial.
 * Usa Verde-Revisão (#2E8C82) para destaque e alvos de toque acessíveis.
 */
export function PresetCargoPreview({ cargo, creating, onConfirm }: PresetCargoPreviewProps) {
  return (
    <div className="rounded-2xl border border-[#2E8C82]/30 bg-[#2E8C82]/5 p-5 dark:border-[#2E8C82]/30 dark:bg-[#2E8C82]/10 transition-all duration-fast">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#2E8C82] dark:text-[#52b3a8]">
        Estrutura do Edital Selecionado
      </p>
      <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
        {cargo.label}
      </h3>
      <p className="mb-4 text-xs font-medium text-slate-600 dark:text-slate-400">
        {cargo.disciplines.length} matérias · {cargo.topicCount} tópicos {cargo.cargoCode && `· Código: ${cargo.cargoCode}`}
      </p>

      <ul className="mb-5 max-h-56 space-y-2 overflow-y-auto pr-1 text-sm">
        {cargo.disciplines.map((discipline) => (
          <li
            key={discipline.name}
            className="flex items-baseline justify-between gap-3 border-b border-[#2E8C82]/10 pb-1.5 text-slate-700 dark:text-slate-300"
          >
            <span className="font-medium">{discipline.name}</span>
            <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
              {discipline.topicCount} tópicos
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onConfirm}
        disabled={creating}
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#2E8C82] px-5 py-3 text-sm sm:text-base font-bold text-white shadow-md transition-all duration-fast hover:bg-[#26776f] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.99] touch-manipulation cursor-pointer"
      >
        {creating && <Loader2 className="h-5 w-5 animate-spin" />}
        <span>Criar meu objetivo de estudo</span>
      </button>
    </div>
  );
}
