import type {
  PresetCargo,
  PresetCargoSummary,
  PresetCatalog,
  PresetCatalogSummary,
  PresetDiscipline,
} from '../interfaces/preset-edital.interfaces.js';

const countTopics = (disciplines: readonly PresetDiscipline[]): number =>
  disciplines.reduce((total, discipline) => total + discipline.topics.length, 0);

// Ordem de estudo: o que é só do cargo primeiro, depois o que é comum a todos.
export function disciplinesOf(catalog: PresetCatalog, cargo: PresetCargo): PresetDiscipline[] {
  const carreira = cargo.track === 'magisterio' ? catalog.shared.magisterio : catalog.shared.assistencia;
  return [...cargo.specific, ...carreira, ...catalog.shared.basicos];
}

export function summarizeCargo(catalog: PresetCatalog, cargo: PresetCargo): PresetCargoSummary {
  const disciplines = disciplinesOf(catalog, cargo);
  return {
    id: cargo.id,
    label: cargo.label,
    name: cargo.name,
    cargoCode: cargo.cargoCode,
    topicCount: countTopics(disciplines),
    disciplines: disciplines.map((d) => ({ name: d.name, topicCount: d.topics.length })),
  };
}

export function summarizeCatalog(catalog: PresetCatalog): PresetCatalogSummary {
  const groups = new Map<string, PresetCargoSummary[]>();
  for (const cargo of catalog.cargos) {
    groups.set(cargo.group, [...(groups.get(cargo.group) ?? []), summarizeCargo(catalog, cargo)]);
  }
  return {
    id: catalog.id,
    title: catalog.title,
    organization: catalog.organization,
    description: catalog.description,
    groups: [...groups].map(([name, cargos]) => ({ name, cargos })),
  };
}

export interface PresetSyllabusRow {
  discipline: string;
  topic: string;
  order: number;
  focus: boolean;
}

export function syllabusRowsOf(catalog: PresetCatalog, cargo: PresetCargo): PresetSyllabusRow[] {
  return disciplinesOf(catalog, cargo).flatMap((discipline, disciplineIndex) =>
    discipline.topics.map((topic, topicIndex) => ({
      discipline: discipline.name,
      topic,
      order: disciplineIndex * 1000 + topicIndex,
      focus: true,
    })),
  );
}
