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

const ROOT_LABEL = 'Editais prontos';

function PickerSkeleton() {
  return (
    <div className="space-y-3.5" aria-busy="true" aria-label="Carregando catálogo de editais...">
      <div className="h-6 w-48 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
      <div className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
      <div className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
    </div>
  );
}

export interface PresetEditalPickerProps {
  onCreated: (id: string) => void;
}

/**
 * Seletor de editais pré-configurados estruturado em 3 níveis (Área -> Edital -> Cargo).
 * Elevado visualmente com os padrões de cartões do Astryx Design System.
 */
export function PresetEditalPicker({ onCreated }: PresetEditalPickerProps) {
  const queryClient = useQueryClient();
  const { data: catalogs, isLoading, isError } = useQuery({
    queryKey: ['preset-editais'],
    queryFn: presetEditalService.list,
    staleTime: Infinity,
  });
  const [areaName, setAreaName] = useState<string | null>(null);
  const [catalogId, setCatalogId] = useState<string | null>(null);

  const areas = groupByArea(catalogs ?? []);
  const area = areas.find((item) => item.name === areaName);
  const catalog = area?.catalogs.find((item) => item.id === catalogId);

  const create = useMutation({
    mutationFn: (cargoId: string) => presetEditalService.create(catalogId ?? '', cargoId),
    onSuccess: (contest) => {
      void invalidateAfterContestCreated(queryClient);
      toast.success('Edital criado com sucesso! Agora você pode estruturar seu cronograma.');
      onCreated(contest.id);
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, 'Não foi possível criar o edital. Tente novamente.')),
  });

  if (isLoading) return <PickerSkeleton />;
  if (isError || !catalogs) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-800/80 dark:bg-red-950/40 dark:text-red-300">
        Não foi possível carregar a lista de editais prontos.
      </div>
    );
  }

  const goRoot = () => {
    setAreaName(null);
    setCatalogId(null);
  };

  const crumbs: Crumb[] = [{ label: ROOT_LABEL, onClick: goRoot }];
  if (area) crumbs.push({ label: area.name, onClick: () => setCatalogId(null) });
  if (catalog) crumbs.push({ label: catalog.title });

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all duration-fast">
      <PresetBreadcrumb crumbs={crumbs} />

      {!area && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Selecione a área do concurso público:
          </p>
          <div className="space-y-2.5">
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
        </div>
      )}

      {area && !catalog && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Escolha o edital de referência:
          </p>
          <div className="space-y-2.5">
            {area.catalogs.map((item) => (
              <PresetChoiceCard
                key={item.id}
                icon={<FileText className="h-5 w-5" />}
                title={item.title}
                subtitle={item.description}
                onClick={() => setCatalogId(item.id)}
              />
            ))}
          </div>
        </div>
      )}

      {catalog && (
        <PresetCargoStep
          key={catalog.id}
          catalog={catalog}
          creating={create.isPending}
          onCreate={(cargoId) => create.mutate(cargoId)}
        />
      )}
    </div>
  );
}
