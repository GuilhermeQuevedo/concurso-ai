import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

import type { PresetCatalog } from '../services/preset-edital.service';
import { filterPresetGroups } from '../utils/filter-presets';
import { PresetCargoList } from './PresetCargoList';
import { PresetCargoPreview } from './PresetCargoPreview';

interface PresetCargoStepProps {
  catalog: PresetCatalog;
  creating: boolean;
  onCreate: (cargoId: string) => void;
}

/**
 * Passo final de seleção de cargo de um edital com suporte a busca rápida e categorização por abas.
 */
export function PresetCargoStep({ catalog, creating, onCreate }: PresetCargoStepProps) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState(0);
  const [cargoId, setCargoId] = useState<string | null>(null);

  const searching = query.trim() !== '';
  const groups = useMemo(
    () => (searching ? filterPresetGroups(catalog.groups, query) : catalog.groups.slice(tab, tab + 1)),
    [catalog, query, searching, tab]
  );
  const cargo = catalog.groups.flatMap((group) => group.cargos).find((item) => item.id === cargoId);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar cargo ou área (ex.: Sociologia, Informática)..."
          aria-label="Buscar cargo ou área de atuação"
          className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3.5 text-base sm:text-sm text-slate-900 transition-colors focus:border-[#2E8C82] focus:outline-none focus:ring-2 focus:ring-[#2E8C82]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white touch-manipulation"
        />
      </div>

      {!searching && (
        <div role="tablist" aria-label="Categorias de cargos" className="flex flex-wrap gap-2">
          {catalog.groups.map((group, index) => (
            <button
              key={group.name}
              type="button"
              role="tab"
              aria-selected={index === tab}
              onClick={() => setTab(index)}
              className={`min-h-[44px] rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-fast touch-manipulation cursor-pointer active:scale-95 ${
                index === tab
                  ? 'bg-[#2E8C82] text-white shadow-xs'
                  : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750'
              }`}
            >
              {group.label} ({group.cargos.length})
            </button>
          ))}
        </div>
      )}

      <PresetCargoList groups={groups} selectedId={cargoId} onSelect={setCargoId} showTitles={searching} />

      {cargo && <PresetCargoPreview cargo={cargo} creating={creating} onConfirm={() => onCreate(cargo.id)} />}
    </div>
  );
}
