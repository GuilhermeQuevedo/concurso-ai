import { useNavigate } from 'react-router';

import type { ContentKind, ScheduleBlock, ScheduleDay } from '../types';

const CONTENT_ROUTES: Record<ContentKind, string> = {
  JOGOS: '/games',
  QUESTOES: '/generate',
  FLASHCARDS: '/flashcards',
};

export function useOpenScheduleContent() {
  const navigate = useNavigate();

  return (day: ScheduleDay, kind: ContentKind, block?: ScheduleBlock) => {
    const subject = block ? block.subject : day.subject;
    void navigate(CONTENT_ROUTES[kind], { state: { initialSubject: subject } });
  };
}
