import { createContext, useContext } from 'react';

import type { ContestSummary } from '@/features/contests/services/contest.service';

export interface ActiveStudyValue {
  contests: ContestSummary[];
  // null = "todos os estudos" (sem recorte).
  activeContestId: string | null;
  activeContest: ContestSummary | null;
  setActiveContestId: (id: string | null) => void;
}

const FALLBACK: ActiveStudyValue = {
  contests: [],
  activeContestId: null,
  activeContest: null,
  setActiveContestId: () => undefined,
};

export const ActiveStudyContext = createContext<ActiveStudyValue>(FALLBACK);

export function useActiveStudy(): ActiveStudyValue {
  return useContext(ActiveStudyContext);
}
