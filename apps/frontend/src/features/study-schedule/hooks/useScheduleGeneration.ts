import { useState, type Dispatch, type SetStateAction } from 'react';

import { toast } from '@/components/ui/toast-store';
import { getErrorMessage } from '@/utils/error-message';

import { studyScheduleService } from '../services/study-schedule.service';
import type { StudySchedule } from '../types';
import { setCreatingNew } from '../utils/schedule-draft';
import type { WizardSubmitPayload } from '../wizard/useScheduleWizard';

// Mantém o edital de referência (nome e vínculo) no cronograma, para que sejam salvos junto.
function withContest(result: StudySchedule, payload: WizardSubmitPayload): StudySchedule {
  if (!payload.contestName) return result;
  return { ...result, contestId: payload.contestId, schedule: { ...result.schedule, title: payload.contestName } };
}

export function useScheduleGeneration(setSchedule: Dispatch<SetStateAction<StudySchedule | null>>) {
  const [loading, setLoading] = useState(false);

  const generate = async (payload: WizardSubmitPayload): Promise<boolean> => {
    setLoading(true);
    try {
      const result = await studyScheduleService.generateSchedule({
        examDate: payload.examDate,
        dailyHours: payload.dailyHours,
        subjects: payload.subjects,
        availability: payload.availability,
        forceRefresh: true,
        saveToDb: false,
      });
      setSchedule(withContest(result, payload));
      setCreatingNew(false);
      toast.success('Cronograma gerado! Clique em Salvar para mantê-lo.');
      return true;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Falha na geração do cronograma.'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { loading, generate };
}
