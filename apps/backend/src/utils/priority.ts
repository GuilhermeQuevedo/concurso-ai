export interface DisciplinePriorityInput {
  importance: number;
  totalTopics: number;
  studiedTopics: number;
  dueReviews: number;
}

const WEIGHT_IMPORTANCE = 0.45;
const WEIGHT_OVERDUE = 0.35;
const WEIGHT_COVERAGE = 0.2;
const OVERDUE_SATURATION = 3;

export function computeDisciplinePriority(input: DisciplinePriorityInput): number {
  const importanceNorm = clamp01(input.importance / 10);
  const overdueNorm = clamp01(input.dueReviews / OVERDUE_SATURATION);
  const coverageGap =
    input.totalTopics > 0 ? clamp01((input.totalTopics - input.studiedTopics) / input.totalTopics) : 0;

  const score =
    WEIGHT_IMPORTANCE * importanceNorm + WEIGHT_OVERDUE * overdueNorm + WEIGHT_COVERAGE * coverageGap;

  return Math.round(score * 1000) / 100;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
