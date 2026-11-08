import { CalendarDays, Layers, Target } from 'lucide-react';

import type { ShareType } from '../services/share.service';

export const SHARE_META: Record<ShareType, { label: string; icon: typeof Layers; color: string }> = {
  DECK: { label: 'Deck de flashcards', icon: Layers, color: 'text-indigo-500' },
  CONTEST: { label: 'Edital', icon: Target, color: 'text-primary-600' },
  SCHEDULE: { label: 'Cronograma', icon: CalendarDays, color: 'text-amber-500' },
};
