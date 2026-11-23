import type { PresetCatalog } from '../services/preset-edital.service';

const plain = (value: string): string => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Filtra os cargos pelo texto digitado (ignora acento e maiúsculas) e some com as categorias que ficaram vazias.
export function filterPresetGroups(groups: PresetCatalog['groups'], query: string): PresetCatalog['groups'] {
  const needle = plain(query.trim());
  if (!needle) return groups;
  return groups
    .map((group) => ({ ...group, cargos: group.cargos.filter((cargo) => plain(`${cargo.label} ${cargo.cargoCode}`).includes(needle)) }))
    .filter((group) => group.cargos.length > 0);
}
