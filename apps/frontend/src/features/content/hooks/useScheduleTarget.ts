import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router';

import { contentService } from '@/features/content/services/content.service';
import { findSubjectByName, type FlatSubject } from '@/features/content/utils/subject-match';

interface ScheduleTarget {
  name?: string;
  subject?: FlatSubject;
  ready: boolean;
}

export function useScheduleTarget(): ScheduleTarget {
  const location = useLocation();
  const raw = (location.state as { initialSubject?: unknown } | null)?.initialSubject;
  const name = typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
  const { data: subjects, isSuccess } = useQuery({
    queryKey: ['subjects'],
    queryFn: contentService.getSubjects,
    enabled: Boolean(name),
  });

  if (!name) return { ready: true };
  return { name, subject: subjects ? findSubjectByName(subjects, name) : undefined, ready: isSuccess };
}
