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

// Último nível: escolher o cargo (abas por categoria, ou todos os resultados quando há busca) e conferir antes de criar.
export function PresetCargoStep({ catalog, creating, onCreate }: PresetCargoStepProps) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState(0);
  const [cargoId, setCargoId] = useState<string | null>(null);

  const searching = query.trim() !== '';
  const groups = useMemo(() => (searching ? filterPresetGroups(catalog.groups, query) : catalog.groups.slice(tab, tab + 1)), [catalog, query, searching, tab]);
  const cargo = catalog.groups.flatMap((group) => group.cargos).find((item) => item.id === cargoId);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar cargo ou área (ex.: Matemática)"
          aria-label="Buscar cargo"
          className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {!searching && (
        <div role="tablist" className="flex flex-wrap gap-2">
          {catalog.groups.map((group, index) => (
            <button
              key={group.name}
              type="button"
              role="tab"
              aria-selected={index === tab}
              onClick={() => setTab(index)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                index === tab ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
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
