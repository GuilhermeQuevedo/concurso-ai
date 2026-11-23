import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, GraduationCap } from 'lucide-react';

import { toast } from '@/components/ui/toast-store';
import { invalidateAfterContestCreated } from '@/lib/query-invalidation';
import { getErrorMessage } from '@/utils/error-message';

import { presetEditalService } from '../services/preset-edital.service';
import { groupByArea } from '../utils/preset-areas';
import { PresetBreadcrumb, type Crumb } from './PresetBreadcrumb';
import { PresetCargoStep } from './PresetCargoStep';
import { PresetChoiceCard } from './PresetChoiceCard';

const ROOT = 'Editais prontos';

function PickerSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <div className="h-5 w-48 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
      <div className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
    </div>
  );
}

// Três níveis: área (Educação) → edital (SEEDF – último edital) → cargo.
export function PresetEditalPicker({ onCreated }: { onCreated: (id: string) => void }) {
  const queryClient = useQueryClient();
  const { data: catalogs, isLoading, isError } = useQuery({ queryKey: ['preset-editais'], queryFn: presetEditalService.list, staleTime: Infinity });
  const [areaName, setAreaName] = useState<string | null>(null);
  const [catalogId, setCatalogId] = useState<string | null>(null);

  const areas = groupByArea(catalogs ?? []);
  const area = areas.find((item) => item.name === areaName);
  const catalog = area?.catalogs.find((item) => item.id === catalogId);

  const create = useMutation({
    mutationFn: (cargoId: string) => presetEditalService.create(catalogId ?? '', cargoId),
    onSuccess: (contest) => {
      void invalidateAfterContestCreated(queryClient);
      toast.success('Edital criado! Agora é só montar o cronograma.');
      onCreated(contest.id);
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Não foi possível criar o edital. Tente de novo.')),
  });

  if (isLoading) return <PickerSkeleton />;
  if (isError || !catalogs) {
    return <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">Não foi possível carregar os editais prontos.</p>;
  }

  const goRoot = () => { setAreaName(null); setCatalogId(null); };
  const crumbs: Crumb[] = [{ label: ROOT, onClick: goRoot }];
  if (area) crumbs.push({ label: area.name, onClick: () => setCatalogId(null) });
  if (catalog) crumbs.push({ label: catalog.title });

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <PresetBreadcrumb crumbs={crumbs} />

      {!area && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">Escolha a área do concurso.</p>
          {areas.map((item) => (
            <PresetChoiceCard
              key={item.name}
              icon={<GraduationCap className="h-5 w-5" />}
              title={item.name}
              subtitle={`${item.catalogs.length} ${item.catalogs.length === 1 ? 'edital pronto' : 'editais prontos'}`}
              onClick={() => setAreaName(item.name)}
            />
          ))}
        </div>
      )}

      {area && !catalog && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">Escolha o edital.</p>
          {area.catalogs.map((item) => (
            <PresetChoiceCard key={item.id} icon={<FileText className="h-5 w-5" />} title={item.title} subtitle={item.description} onClick={() => setCatalogId(item.id)} />
          ))}
        </div>
      )}

      {catalog && <PresetCargoStep key={catalog.id} catalog={catalog} creating={create.isPending} onCreate={(cargoId) => create.mutate(cargoId)} />}
    </div>
  );
}
