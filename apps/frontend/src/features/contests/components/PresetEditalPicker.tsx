import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';

import { toast } from '@/components/ui/toast-store';
import { invalidateAfterContestCreated } from '@/lib/query-invalidation';
import { getErrorMessage } from '@/utils/error-message';

import { presetEditalService, type PresetCatalog } from '../services/preset-edital.service';
import { filterPresetGroups } from '../utils/filter-presets';
import { PresetCargoList } from './PresetCargoList';
import { PresetCargoPreview } from './PresetCargoPreview';

function CatalogCard({ catalog, active, onClick }: { catalog: PresetCatalog; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`w-full rounded-xl border p-4 text-left transition-colors ${
        active ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30' : 'border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700'
      }`}
    >
      <p className="font-semibold text-gray-900 dark:text-white">{catalog.title}</p>
      <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{catalog.description}</p>
    </button>
  );
}

function PickerSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <div className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
      <div className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
      <div className="grid gap-2 sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-14 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    </div>
  );
}

export function PresetEditalPicker({ onCreated }: { onCreated: (id: string) => void }) {
  const queryClient = useQueryClient();
  const { data: catalogs, isLoading, isError } = useQuery({ queryKey: ['preset-editais'], queryFn: presetEditalService.list, staleTime: Infinity });
  const [chosenCatalogId, setChosenCatalogId] = useState<string | null>(null);
  const [cargoId, setCargoId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const catalog = catalogs?.find((item) => item.id === (chosenCatalogId ?? catalogs[0]?.id));
  const groups = useMemo(() => filterPresetGroups(catalog?.groups ?? [], query), [catalog, query]);
  const cargo = catalog?.groups.flatMap((group) => group.cargos).find((item) => item.id === cargoId);

  const create = useMutation({
    mutationFn: () => presetEditalService.create(catalog?.id ?? '', cargoId ?? ''),
    onSuccess: (contest) => {
      void invalidateAfterContestCreated(queryClient);
      toast.success('Edital criado! Agora é só montar o cronograma.');
      onCreated(contest.id);
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Não foi possível criar o edital. Tente de novo.')),
  });

  if (isLoading) return <PickerSkeleton />;
  if (isError || !catalog) {
    return <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">Não foi possível carregar os editais prontos.</p>;
  }

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="space-y-2">
        {catalogs?.map((item) => (
          <CatalogCard key={item.id} catalog={item} active={item.id === catalog.id} onClick={() => { setChosenCatalogId(item.id); setCargoId(null); }} />
        ))}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar cargo ou área (ex.: Matemática, Gestor)"
          aria-label="Buscar cargo"
          className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </div>

      <PresetCargoList groups={groups} selectedId={cargoId} onSelect={setCargoId} />

      {cargo && <PresetCargoPreview cargo={cargo} creating={create.isPending} onConfirm={() => create.mutate()} />}
    </div>
  );
}
