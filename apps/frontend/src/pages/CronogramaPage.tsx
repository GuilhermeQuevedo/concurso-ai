import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';

import { SavedSchedulesModal } from '@/features/study-schedule/components/SavedSchedulesModal';
import { ScheduleSummary } from '@/features/study-schedule/components/ScheduleSummary';
import { WeekCollapsible } from '@/features/study-schedule/components/WeekCollapsible';
import { useStudySchedules } from '@/features/study-schedule/hooks/useStudySchedules';
import type { ScheduleBlock, ScheduleDay } from '@/features/study-schedule/types';
import { daysUntilExam, scheduleExamDate } from '@/features/study-schedule/utils/schedule-dates';
import { exportScheduleToCsv, exportScheduleToPrint } from '@/features/study-schedule/utils/schedule-export';
import { ScheduleWizard } from '@/features/study-schedule/wizard/ScheduleWizard';
import type { WizardSubmitPayload } from '@/features/study-schedule/wizard/useScheduleWizard';

export function CronogramaPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // Atalho "Faça o seu cronograma para esta prova": abre o assistente na hora, ignorando o cronograma aberto.
  const startFromContest = Boolean(searchParams.get('prova'));

  const studies = useStudySchedules(startFromContest);
  const { schedule, savedSchedules, loading } = studies;
  const [showSaved, setShowSaved] = useState(false);

  const handleGenerate = async (payload: WizardSubmitPayload) => {
    const generated = await studies.generate(payload);
    if (generated && startFromContest) setSearchParams({}, { replace: true });
  };

  const openContentFor = (day: ScheduleDay, block?: ScheduleBlock) => {
    const subject = block ? block.subject : day.subject;
    const wantsQuestions = block?.type === 'questoes' || day.type === 'questoes';
    void navigate(wantsQuestions ? '/generate' : '/flashcards', { state: { initialSubject: subject } });
  };

  const ready = startFromContest || studies.isInitialized;

  return (
    <div className="min-h-screen pb-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 border-b border-border/60 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-6 h-6 text-primary" />
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Cronograma de Estudos</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Um plano de estudos focado e dinâmico, otimizado por IA com blocos Pomodoro e ciclos intercalados.
            </p>
          </div>

          {savedSchedules.length > 0 && (
            <button
              type="button"
              onClick={() => setShowSaved(true)}
              className="flex items-center gap-2 px-4 py-2 bg-secondary/70 hover:bg-secondary text-foreground text-sm font-medium rounded-lg border border-border/60 transition-colors cursor-pointer"
            >
              Meus Cronogramas ({savedSchedules.length})
            </button>
          )}
        </div>

        {!ready && <div className="h-72 animate-pulse rounded-2xl bg-secondary/60" />}

        {ready && !schedule && <ScheduleWizard loading={loading} onGenerate={(payload) => void handleGenerate(payload)} />}

        {ready && schedule && (
          <div className="space-y-6 animate-fade-in">
            <ScheduleSummary
              schedule={schedule}
              daysRemaining={daysUntilExam(scheduleExamDate(schedule))}
              isSaving={studies.isSaving}
              busy={loading}
              onSave={() => void studies.save()}
              onExportPdf={() => exportScheduleToPrint(schedule)}
              onExportCsv={() => exportScheduleToCsv(schedule)}
            />

            <div className="space-y-4">
              {schedule.schedule.weeks.map((week, index) => (
                <WeekCollapsible
                  key={index}
                  week={week}
                  weekIndex={index}
                  defaultOpen={index === 0}
                  onToggleDay={(weekIndex, dayIndex) => void studies.toggleDay(weekIndex, dayIndex)}
                  onGenerate={(_dayIndex, day, block) => openContentFor(day, block)}
                />
              ))}
            </div>

            <div className="text-center pt-8 border-t border-border/50">
              <button
                type="button"
                onClick={studies.createAnother}
                className="text-muted-foreground text-sm hover:text-foreground transition-colors underline underline-offset-4 cursor-pointer"
              >
                Criar outro cronograma
              </button>
            </div>
          </div>
        )}

        {showSaved && (
          <SavedSchedulesModal
            schedules={savedSchedules}
            onSelect={studies.select}
            onRename={studies.rename}
            onDelete={(id) => void studies.remove(id)}
            onClose={() => setShowSaved(false)}
          />
        )}
      </div>
    </div>
  );
}
