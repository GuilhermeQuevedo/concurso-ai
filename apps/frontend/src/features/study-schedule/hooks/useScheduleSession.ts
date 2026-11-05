import { useEffect, useState } from 'react';

import { studyScheduleService } from '../services/study-schedule.service';
import type { StudySchedule } from '../types';
import { clearDraft, isCreatingNew, readDraft, writeDraft } from '../utils/schedule-draft';

// Estado da tela de cronograma: o que está aberto, a lista de salvos e o rascunho.
// Com `startFromContest` (atalho "Faça o seu cronograma para esta prova") não restaura nada:
// o assistente abre na hora, e o rascunho/cronograma anterior continua guardado.
export function useScheduleSession(startFromContest: boolean) {
  const [schedule, setSchedule] = useState<StudySchedule | null>(null);
  const [savedSchedules, setSavedSchedules] = useState<StudySchedule[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await studyScheduleService.listSchedules().catch(() => [] as StudySchedule[]);
        setSavedSchedules(saved);
        if (startFromContest || isCreatingNew()) return;
        setSchedule(readDraft() ?? saved[0] ?? null);
      } finally {
        setIsInitialized(true);
      }
    };
    void load();
    // Só na montagem: mudanças posteriores de ?prova= são tratadas no efeito abaixo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (startFromContest) setSchedule(null);
  }, [startFromContest]);

  useEffect(() => {
    if (isInitialized && schedule) writeDraft(schedule);
  }, [isInitialized, schedule]);

  return { schedule, setSchedule, savedSchedules, setSavedSchedules, isInitialized, clearDraft };
}

export type ScheduleSession = ReturnType<typeof useScheduleSession>;
