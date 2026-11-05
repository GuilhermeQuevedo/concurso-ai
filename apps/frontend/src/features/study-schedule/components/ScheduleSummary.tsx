import { AlertCircle, Download, FileText, Loader2, Save } from 'lucide-react';

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

const GHOST_BUTTON =
  'flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-muted-foreground border border-border rounded-lg hover:bg-secondary transition-colors cursor-pointer';

export function ScheduleSummary({ schedule, daysRemaining, isSaving, busy, onSave, onExportPdf, onExportCsv }: ScheduleSummaryProps) {
  const hasPerformance = schedule.hasPerformanceData || schedule.has_performance_data;

  return (
    <>
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-2xl border border-border/80 bg-card shadow-sm">
        <div className="flex items-center gap-6 w-full md:w-auto">
          {daysRemaining !== null && (
            <div className="text-center px-4 md:px-6 md:border-r border-border/60">
              <div className="text-3xl font-display font-bold text-primary">{daysRemaining}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">Dias P/ Prova</div>
            </div>
          )}
          <div>
            <h3 className="font-display font-bold text-lg text-foreground mb-1">
              {schedule.schedule?.title || 'Visão Geral do Ciclo'}
            </h3>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="bg-secondary/70 px-2 py-0.5 rounded border border-border/50">
                {schedule.dailyHours || schedule.daily_hours}h por dia
              </span>
              <span className="bg-secondary/70 px-2 py-0.5 rounded border border-border/50">
                {schedule.subjects?.length || 0} matérias
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {!schedule.id && (
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving || busy}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Salvar
            </button>
          )}
          <button type="button" onClick={onExportPdf} className={GHOST_BUTTON}>
            <FileText className="w-3.5 h-3.5" /> Exportar PDF
          </button>
          <button type="button" onClick={onExportCsv} className={GHOST_BUTTON}>
            <Download className="w-3.5 h-3.5" /> Planilha
          </button>
        </div>
      </div>

      {!hasPerformance && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/70 shadow-sm text-foreground">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div className="text-xs text-muted-foreground leading-relaxed">
            Sua taxa histórica de simulados e questões ainda está inicial. O algoritmo dividiu a carga de forma equilibrada.
            Conforme você resolver questões e revisar flashcards, a IA calibrará os próximos ciclos com foco nas suas
            fraquezas!
          </div>
        </div>
      )}
    </>
  );
}
