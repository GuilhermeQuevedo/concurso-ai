import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { ScheduleWizard } from '../wizard/ScheduleWizard';
import { studyScheduleService } from '../services/study-schedule.service';
import type { WizardSubmitPayload } from '../wizard/useScheduleWizard';
import type { StudySchedule } from '../types';

export interface NewScheduleViewProps {
  onBack: () => void;
  onCreated: (schedule: StudySchedule) => void;
}

export function NewScheduleView({ onBack, onCreated }: NewScheduleViewProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = async (payload: WizardSubmitPayload) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await studyScheduleService.generateSchedule({
        examDate: payload.examDate,
        dailyHours: payload.dailyHours,
        subjects: payload.subjects,
        availability: payload.availability,
        forceRefresh: true,
        saveToDb: false,
      });

      if (payload.contestName && result.schedule) {
        result.schedule.title = payload.contestName;
      }

      onCreated(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha na geração do cronograma.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ChevronLeft className="mr-1 inline h-4 w-4" />
        Voltar
      </button>

      <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
        Novo Cronograma de Estudos
      </h2>

      {errorMessage && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {errorMessage}
        </div>
      )}

      <ScheduleWizard loading={loading} onGenerate={handleGenerate} />
    </div>
  );
}
