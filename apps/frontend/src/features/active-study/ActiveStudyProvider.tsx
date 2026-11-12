import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

import { contestService } from '@/features/contests/services/contest.service';

import { ActiveStudyContext } from './active-study-context';

const STORAGE_KEY = 'engrama:active-contest';

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

// "Estudo ativo": o edital em foco. Dashboard, calendário, revisões e cronograma passam a mostrar só ele.
export function ActiveStudyProvider({ children }: { children: ReactNode }) {
  const [storedId, setStoredId] = useState<string | null>(readStored);
  const { data: contests = [] } = useQuery({ queryKey: ['contests'], queryFn: contestService.list });

  const setActiveContestId = useCallback((id: string | null) => {
    setStoredId(id);
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // sem armazenamento a escolha vale só nesta sessão
    }
  }, []);

  const value = useMemo(() => {
    // Edital apagado ou ainda não carregado: sem recorte, sem erro.
    const activeContest = storedId ? (contests.find((c) => c.id === storedId) ?? null) : null;
    return { contests, activeContestId: activeContest?.id ?? null, activeContest, setActiveContestId };
  }, [contests, storedId, setActiveContestId]);

  return <ActiveStudyContext.Provider value={value}>{children}</ActiveStudyContext.Provider>;
}
