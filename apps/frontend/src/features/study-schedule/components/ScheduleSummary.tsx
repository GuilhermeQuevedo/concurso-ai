import { AlertCircle, CalendarDays, Clock, Download, FileText, Loader2, Save } from 'lucide-react';

import type { StudySchedule } from '../types';

interface ScheduleSummaryProps {
  schedule: StudySchedule;
  daysRemaining: number | null;
  isSaving: boolean;
  busy: boolean;
  onSave: () => void;
  onExportPdf: () => void;
  onExportCsv: () => void;
}

export function ScheduleSummary({
  schedule,
  daysRemaining,
  isSaving,
  busy,
  onSave,
  onExportPdf,
  onExportCsv,
}: ScheduleSummaryProps) {
  const hasPerformance = schedule.hasPerformanceData || schedule.has_performance_data;
  const rawExamDate = schedule.examDate || schedule.exam_date || null;
  const dailyHours = schedule.dailyHours || schedule.daily_hours || 3;
  const subjectsCount = schedule.subjects?.length || 0;
  const title = schedule.schedule?.title || 'Cronograma de Estudos';

  const formattedExamDate = rawExamDate
    ? new Date(`${rawExamDate}T12:00:00Z`).toLocaleDateString('pt-BR')
    : null;

  return (
    <div className="space-y-4">
      {/* Resumo do Edital e Métrica — Padrão Visual Edital Mapeado */}
      <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/80 backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-lg">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-white mb-2">
            {title}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              Carga: <strong className="text-slate-200">{dailyHours}h por dia</strong>
            </span>
            <span>•</span>
            <span>
              Matérias: <strong className="text-slate-200">{subjectsCount} disciplinas</strong>
            </span>
            {formattedExamDate && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-teal-400" />
                  Prova: <strong className="text-slate-200">{formattedExamDate}</strong>
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6 shrink-0 border-t md:border-t-0 md:border-l border-slate-800/80 pt-4 md:pt-0 md:pl-6 w-full md:w-auto justify-between md:justify-end">
          {daysRemaining !== null && (
            <div className="text-left md:text-right">
              <div className="text-3xl sm:text-4xl font-extrabold font-display text-teal-400 leading-none mb-1">
                {daysRemaining}
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Dias P/ Prova
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 shrink-0">
            {!schedule.id && (
              <button
                type="button"
                onClick={onSave}
                disabled={isSaving || busy}
                className="flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-teal-500/15 text-teal-300 border border-teal-500/40 font-semibold hover:bg-teal-500/25 transition-colors disabled:opacity-50 text-xs cursor-pointer shadow-sm"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Salvar Cronograma
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onExportPdf}
                className="flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg border border-slate-700/80 bg-slate-800/70 hover:bg-slate-800 text-xs font-medium text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-slate-400" /> Exportar PDF
              </button>
              <button
                type="button"
                onClick={onExportCsv}
                className="flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg border border-slate-700/80 bg-slate-800/70 hover:bg-slate-800 text-xs font-medium text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" /> Planilha
              </button>
            </div>
          </div>
        </div>
      </div>

      {!hasPerformance && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 shadow-sm text-slate-300">
          <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div className="text-xs text-slate-400 leading-relaxed">
            Sua taxa histórica de simulados e questões ainda está inicial. O algoritmo dividiu a carga de forma equilibrada.
            Conforme você resolver questões e revisar flashcards, a IA calibrará os próximos ciclos com foco nas suas
            fraquezas!
          </div>
        </div>
      )}
    </div>
  );
}
