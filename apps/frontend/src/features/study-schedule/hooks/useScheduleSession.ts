import { useEffect, useRef, useState } from 'react';

import { useActiveStudy } from '@/features/active-study/active-study-context';

import { studyScheduleService } from '../services/study-schedule.service';
import type { StudySchedule } from '../types';
import { pickScheduleForStudy } from '../utils/pick-schedule';
import { clearDraft, isCreatingNew, readDraft, setCreatingNew, writeDraft } from '../utils/schedule-draft';

// Estado da tela de cronograma: o que está aberto, a lista de salvos e o rascunho.
// Com `startFromContest` (atalho "Faça o seu cronograma para esta prova") não restaura nada:
// o assistente abre na hora, e o rascunho/cronograma anterior continua guardado.
export function useScheduleSession(startFromContest: boolean) {
  const [schedule, setSchedule] = useState<StudySchedule | null>(null);
  const [savedSchedules, setSavedSchedules] = useState<StudySchedule[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { activeContestId } = useActiveStudy();

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await studyScheduleService.listSchedules().catch(() => [] as StudySchedule[]);
        setSavedSchedules(saved);
        if (startFromContest || isCreatingNew()) return;
        setSchedule(pickScheduleForStudy(saved, readDraft(), activeContestId));
      } finally {
        setIsInitialized(true);
      }
    };
    void load();
    // Só na montagem: mudanças posteriores de ?prova= são tratadas no efeito abaixo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trocar o estudo ativo troca o cronograma aberto (e, sem cronograma para ele, abre o assistente).
  const lastStudy = useRef(activeContestId);
  useEffect(() => {
    if (!isInitialized || lastStudy.current === activeContestId) return;
    lastStudy.current = activeContestId;
    if (startFromContest) return;
    setCreatingNew(false);
    setSchedule(pickScheduleForStudy(savedSchedules, readDraft(), activeContestId));
    // savedSchedules é lido no momento da troca; a troca em si é que dispara o efeito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeContestId, isInitialized, startFromContest]);

  useEffect(() => {
    if (startFromContest) setSchedule(null);
  }, [startFromContest]);

  useEffect(() => {
    if (isInitialized && schedule) writeDraft(schedule);
  }, [isInitialized, schedule]);

  return { schedule, setSchedule, savedSchedules, setSavedSchedules, isInitialized, clearDraft };
}

export type ScheduleSession = ReturnType<typeof useScheduleSession>;
