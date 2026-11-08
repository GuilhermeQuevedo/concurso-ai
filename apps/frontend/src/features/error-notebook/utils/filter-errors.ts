import type { PendingErrorDTO } from '../services/error-notebook.service';

export type OriginFilter = 'TODOS' | 'SIMULADO' | 'FLASHCARD';
export type StatusFilter = 'TODOS' | 'ERREI' | 'DUVIDA';

export interface ErrorFilters {
  origin: OriginFilter;
  status: StatusFilter;
  subjectId: string;
}

export const NO_FILTERS: ErrorFilters = { origin: 'TODOS', status: 'TODOS', subjectId: '' };

export const isDoubt = (error: PendingErrorDTO): boolean => error.userAnswer?.toLowerCase().includes('dúvida') ?? false;

function matches(error: PendingErrorDTO, filters: ErrorFilters): boolean {
  if (filters.origin !== 'TODOS' && error.originType !== filters.origin) return false;
  if (filters.status === 'ERREI' && isDoubt(error)) return false;
  if (filters.status === 'DUVIDA' && !isDoubt(error)) return false;
  return !filters.subjectId || error.subjectId === filters.subjectId;
}

export function filterErrors(errors: PendingErrorDTO[], filters: ErrorFilters): PendingErrorDTO[] {
  return errors.filter((error) => matches(error, filters));
}

// Contagens de cada opção levam em conta os outros filtros, para o número mostrado ser o que aparece ao clicar.
export function countWith(errors: PendingErrorDTO[], filters: ErrorFilters, change: Partial<ErrorFilters>): number {
  return filterErrors(errors, { ...filters, ...change }).length;
}

export interface SubjectOption {
  id: string;
  name: string;
  count: number;
}

export function subjectOptions(errors: PendingErrorDTO[], filters: ErrorFilters): SubjectOption[] {
  const scoped = filterErrors(errors, { ...filters, subjectId: '' });
  const map = new Map<string, SubjectOption>();
  for (const error of scoped) {
    const option = map.get(error.subjectId) ?? { id: error.subjectId, name: error.subjectName, count: 0 };
    option.count += 1;
    map.set(error.subjectId, option);
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pt-BR'));
}
