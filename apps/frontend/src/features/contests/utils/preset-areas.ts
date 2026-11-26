import type { PresetCatalog } from '../services/preset-edital.service';

export interface PresetArea {
  name: string;
  catalogs: PresetCatalog[];
}

// Agrupa os editais prontos por área (Educação, ...), mantendo a ordem em que o servidor devolveu.
export function groupByArea(catalogs: readonly PresetCatalog[]): PresetArea[] {
  const areas = new Map<string, PresetCatalog[]>();
  for (const catalog of catalogs) areas.set(catalog.area, [...(areas.get(catalog.area) ?? []), catalog]);
  return [...areas].map(([name, items]) => ({ name, catalogs: items }));
}
