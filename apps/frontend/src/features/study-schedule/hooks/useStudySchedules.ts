import { useScheduleActions } from './useScheduleActions';
import { useScheduleGeneration } from './useScheduleGeneration';
import { useScheduleSession } from './useScheduleSession';

// Fachada da tela de cronograma: junta sessão (o que está aberto), geração e ações sobre o cronograma.
export function useStudySchedules(startFromContest: boolean) {
  const session = useScheduleSession(startFromContest);
  const generation = useScheduleGeneration(session.setSchedule);
  const actions = useScheduleActions(session);

  return {
    schedule: session.schedule,
    savedSchedules: session.savedSchedules,
    isInitialized: session.isInitialized,
    loading: generation.loading,
    generate: generation.generate,
    ...actions,
  };
}
