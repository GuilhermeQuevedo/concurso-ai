import { KIND_LABELS, type DocumentDTO, type DocumentKind } from '../services/document.service';

export type GroupBy = 'tipo' | 'disciplina';
export type SortBy = 'recentes' | 'nome';
export type KindFilter = DocumentKind | 'TODOS';

export interface DocumentFilters {
  query: string;
  kind: KindFilter;
  subjectId: string;
}

export interface DocumentGroup {
  key: string;
  label: string;
  documents: DocumentDTO[];
}

export const KIND_ORDER: DocumentKind[] = ['EDITAL', 'EMENTA', 'CRONOGRAMA', 'MATERIAL', 'LISTA_QUESTOES', 'OUTRO'];

const NO_SUBJECT_KEY = '__sem_disciplina__';
const NO_SUBJECT_LABEL = 'Sem disciplina';

// Compara sem acento e sem diferença de maiúsculas ("Português" casa com "portugues").
export function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function filterDocuments(documents: DocumentDTO[], filters: DocumentFilters): DocumentDTO[] {
  const query = normalizeText(filters.query);
  return documents.filter((doc) => {
    if (filters.kind !== 'TODOS' && (doc.kind ?? 'OUTRO') !== filters.kind) return false;
    if (filters.subjectId && doc.subjectId !== filters.subjectId) return false;
    return query === '' || normalizeText(doc.name).includes(query);
  });
}

export function sortDocuments(documents: DocumentDTO[], sortBy: SortBy): DocumentDTO[] {
  const copy = [...documents];
  if (sortBy === 'nome') return copy.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));
  return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function countByKind(documents: DocumentDTO[]): Record<KindFilter, number> {
  const counts = { TODOS: documents.length } as Record<KindFilter, number>;
  for (const kind of KIND_ORDER) counts[kind] = 0;
  for (const doc of documents) counts[doc.kind ?? 'OUTRO'] += 1;
  return counts;
}

function groupByKind(documents: DocumentDTO[]): DocumentGroup[] {
  return KIND_ORDER.map((kind) => ({
    key: kind,
    label: KIND_LABELS[kind],
    documents: documents.filter((doc) => (doc.kind ?? 'OUTRO') === kind),
  })).filter((group) => group.documents.length > 0);
}

function groupBySubject(documents: DocumentDTO[], subjectName: (id: string) => string): DocumentGroup[] {
  const groups = new Map<string, DocumentGroup>();
  for (const doc of documents) {
    const key = doc.subjectId ?? NO_SUBJECT_KEY;
    const label = doc.subjectId ? subjectName(doc.subjectId) : NO_SUBJECT_LABEL;
    const group = groups.get(key) ?? { key, label, documents: [] };
    group.documents.push(doc);
    groups.set(key, group);
  }
  // "Sem disciplina" por último; as demais em ordem alfabética.
  return [...groups.values()].sort((a, b) => {
    if (a.key === NO_SUBJECT_KEY) return 1;
    if (b.key === NO_SUBJECT_KEY) return -1;
    return a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' });
  });
}

export function groupDocuments(documents: DocumentDTO[], groupBy: GroupBy, subjectName: (id: string) => string): DocumentGroup[] {
  return groupBy === 'tipo' ? groupByKind(documents) : groupBySubject(documents, subjectName);
}
