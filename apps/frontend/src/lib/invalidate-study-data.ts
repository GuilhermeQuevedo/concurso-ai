import type { QueryClient } from '@tanstack/react-query';

// Tudo o que um documento novo (ou processado) pode mudar em outras telas.
const STUDY_DATA_KEYS = [
  'documents',
  'contests',
  'contest',
  'subjects',
  'study-schedules',
  'study-plans',
  'study-tasks',
  'study-tasks-today',
  'dashboard',
  'user-stats',
  'question-sets',
  'flashcard-decks',
  'flashcard-stats',
  'due-reviews',
  'reminders',
];

export async function invalidateStudyData(queryClient: QueryClient): Promise<void> {
  await Promise.all(STUDY_DATA_KEYS.map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
}
