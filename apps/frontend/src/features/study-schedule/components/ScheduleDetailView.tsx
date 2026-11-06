import { useNavigate } from 'react-router';
import {
  CalendarDays,
  ChevronLeft,
  Clock,
  BookOpen,
  Download,
  FileText,
  Save,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { daysUntil, formatExamDate } from '@/features/contests/components/ContestCard';
import { exportScheduleToCsv, exportScheduleToPrint } from '../utils/schedule-export';
import { WeekCollapsible } from './WeekCollapsible';
import type { StudySchedule, ScheduleDay, ScheduleBlock } from '../types';

export interface ScheduleDetailViewProps {
  schedule: StudySchedule;
  isSaving?: boolean;
  onBack: () => void;
  onSave?: (schedule: StudySchedule) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggleDayCompletion: (weekIndex: number, dayIndex: number) => void;
}

export function ScheduleDetailView({
  schedule,
  isSaving = false,
  onBack,
  onSave,
  onDelete,
  onToggleDayCompletion,
}: ScheduleDetailViewProps) {
  const navigate = useNavigate();

  const rawExamDate = schedule.examDate || schedule.exam_date || null;
  const days = daysUntil(rawExamDate);
  const dailyHours = schedule.dailyHours || schedule.daily_hours || 3;
  const subjectsCount = schedule.subjects?.length || 0;
  const title =
    schedule.schedule?.title ||
    (rawExamDate ? `Prova em ${formatExamDate(rawExamDate)}` : 'Cronograma de Estudos');

  const handleGenerateContentForDay = (
    _dayIndex: number,
    day: ScheduleDay,
    block?: ScheduleBlock
  ) => {
    const targetSubject = block ? block.subject : day.subject;
    const isQuestoes = block?.type === 'questoes' || day.type === 'questoes';

    if (isQuestoes) {
      void navigate('/generate', { state: { initialSubject: targetSubject } });
    } else {
      void navigate('/flashcards', { state: { initialSubject: targetSubject } });
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ChevronLeft className="mr-1 inline h-4 w-4" />
          Voltar
        </button>

        <div className="flex items-center gap-2">
          {!schedule.id && onSave && (
            <button
              type="button"
              onClick={() => void onSave(schedule)}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              {isSaving ? 'Salvando…' : 'Salvar Cronograma'}
            </button>
          )}

          <button
            type="button"
            onClick={() => exportScheduleToPrint(schedule)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <FileText className="h-3.5 w-3.5" />
            PDF
          </button>

          <button
            type="button"
            onClick={() => exportScheduleToCsv(schedule)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <Download className="h-3.5 w-3.5" />
            Planilha
          </button>

          {schedule.id && (
            <button
              type="button"
              onClick={() => {
                if (schedule.id) void onDelete(schedule.id);
              }}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 ml-2"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Excluir
            </button>
          )}
        </div>
      </div>

      {/* Header Info */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            <Clock className="h-3 w-3" />
            {dailyHours}h por dia
          </span>
          <span className="flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <BookOpen className="h-3 w-3" />
            {subjectsCount} {subjectsCount === 1 ? 'matéria' : 'matérias'}
          </span>
          {rawExamDate && (
            <span className="flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              <CalendarDays className="h-3 w-3" />
              Data da Prova: {formatExamDate(rawExamDate)}
            </span>
          )}
        </div>
      </div>

      {/* Countdown Card */}
      {days !== null && days >= 0 && (
        <div className="flex items-center justify-center gap-3 rounded-xl border border-primary-200 bg-primary-50 p-5 dark:border-primary-800 dark:bg-primary-950">
          <Clock className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          <div>
            <p className="text-3xl font-bold text-primary-700 dark:text-primary-300">{days} dias</p>
            <p className="text-xs text-primary-600 dark:text-primary-400">até a prova</p>
          </div>
        </div>
      )}

      {/* Performance Advice */}
      {!schedule.hasPerformanceData && !schedule.has_performance_data && (
        <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
            Sua taxa histórica de questões ainda é inicial. Conforme você resolver simulados e revisar flashcards, a IA calibrará os próximos ciclos com base nos seus pontos de maior dificuldade.
          </p>
        </div>
      )}

      {/* Weeks list */}
      <div className="space-y-3 pt-2">
        {schedule.schedule.weeks.map((week, weekIndex) => (
          <WeekCollapsible
            key={weekIndex}
            week={week}
            weekIndex={weekIndex}
            defaultOpen={weekIndex === 0}
            onToggleDay={onToggleDayCompletion}
            onGenerate={handleGenerateContentForDay}
          />
        ))}
      </div>
    </div>
  );
}
