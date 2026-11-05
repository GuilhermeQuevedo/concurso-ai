import type { StudySchedule } from '../types';

const DRAFT_KEY = '@schedule_draft';
const CREATING_KEY = '@zion_creating_schedule';

interface ScheduleDraft {
  schedule?: StudySchedule;
}

// Rascunho do cronograma em tela: sobrevive a recarregar a página até ser salvo ou descartado.
export function readDraft(): StudySchedule | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return (JSON.parse(raw) as ScheduleDraft).schedule ?? null;
  } catch (error: unknown) {
    console.warn('Erro ao restaurar rascunho de cronograma:', error);
    return null;
  }
}

export function writeDraft(schedule: StudySchedule): void {
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ schedule } satisfies ScheduleDraft));
}

export function clearDraft(): void {
  localStorage.removeItem(DRAFT_KEY);
}

// Marca que o usuário pediu "criar outro cronograma": ao recarregar, mostra o assistente em vez do último salvo.
export function isCreatingNew(): boolean {
  return localStorage.getItem(CREATING_KEY) !== null;
}

export function setCreatingNew(value: boolean): void {
  if (value) localStorage.setItem(CREATING_KEY, 'true');
  else localStorage.removeItem(CREATING_KEY);
}
