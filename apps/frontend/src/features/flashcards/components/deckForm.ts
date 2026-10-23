import { DECK_COLORS } from '../services/flashcard.service';

export interface DeckForm {
  name: string;
  subjectName: string;
  topic: string;
  color: string;
}

export const EMPTY_DECK_FORM: DeckForm = { name: '', subjectName: '', topic: '', color: DECK_COLORS[0] };

export const fieldClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white';
export const labelClass = 'mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300';
