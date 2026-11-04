import React, { useState, useEffect } from 'react';
import { studyScheduleService } from '@/features/study-schedule/services/study-schedule.service';
import type { StudySchedule, ScheduleWeek, ScheduleBlock, ScheduleDay } from '@/features/study-schedule/types';
import { ScheduleDayRow } from '@/features/study-schedule/components/ScheduleDayRow';
import { exportScheduleToCsv, exportScheduleToPrint } from '@/features/study-schedule/utils/schedule-export';
import { ScheduleWizard } from '@/features/study-schedule/wizard/ScheduleWizard';
import type { WizardSubmitPayload } from '@/features/study-schedule/wizard/useScheduleWizard';
import {
  Loader2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Check,
  Download,
  Save,
  FileText,
  AlertCircle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router';

export const CronogramaPage: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [schedule, setSchedule] = useState<StudySchedule | null>(null);
  const [examDate, setExamDate] = useState('');
  const [dailyHours, setDailyHours] = useState<number>(3);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [userObservations, setUserObservations] = useState('');
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  const [savedSchedules, setSavedSchedules] = useState<StudySchedule[]>([]);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const [isInitialized, setIsInitialized] = useState(false);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 5000);
    } else {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const schedules = await studyScheduleService.listSchedules().catch(() => []);

        if (schedules && schedules.length > 0) {
          setSavedSchedules(schedules);
        }

        const isCreatingNew = localStorage.getItem('@zion_creating_schedule');
        if (!isCreatingNew) {
          const draftStr = localStorage.getItem('@schedule_draft');
          if (draftStr) {
            try {
              const draft = JSON.parse(draftStr) as {
                schedule?: StudySchedule;
                examDate?: string;
                dailyHours?: number;
                subjects?: string[];
                userObservations?: string;
                daysRemaining?: number | null;
              };
              if (draft.schedule) {
                setSchedule(draft.schedule);
                setExamDate(draft.examDate || '');
                setDailyHours(draft.dailyHours || 3);
                setSubjects(draft.subjects || []);
                setUserObservations(draft.userObservations || '');
                setDaysRemaining(draft.daysRemaining ?? null);
                setIsInitialized(true);
                return;
              }
            } catch (e: unknown) {
              console.warn('Erro ao restaurar rascunho de cronograma:', e);
            }
          }

          if (schedules && schedules.length > 0) {
            const latest = schedules[0];
            setSchedule(latest);
            const dateStr = latest.examDate || latest.exam_date || '';
            setExamDate(dateStr);
            setDailyHours(latest.dailyHours || latest.daily_hours || 3);
            setSubjects(latest.subjects || []);

            if (dateStr) {
              const today = new Date();
              const target = new Date(`${dateStr}T12:00:00Z`);
              const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 3600 * 24));
              setDaysRemaining(diff > 0 ? diff : 0);
            }
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar dados';
        console.warn('Erro ao carregar dados iniciais de cronograma:', message);
      } finally {
        setIsInitialized(true);
      }
    };
    void loadInitialData();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    if (!schedule && !examDate && subjects.length === 0) {
      localStorage.removeItem('@schedule_draft');
      return;
    }
    const draft = {
      schedule,
      examDate,
      dailyHours,
      subjects,
      userObservations,
      daysRemaining,
    };
    localStorage.setItem('@schedule_draft', JSON.stringify(draft));
  }, [isInitialized, schedule, examDate, dailyHours, subjects, userObservations, daysRemaining]);

  const handleWizardGenerate = async (payload: WizardSubmitPayload) => {
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
      setExamDate(payload.examDate);
      setDailyHours(payload.dailyHours);
      setSubjects(payload.subjects);
      setSchedule(result);
      localStorage.removeItem('@zion_creating_schedule');
      const diff = Math.ceil((new Date(`${payload.examDate}T12:00:00Z`).getTime() - Date.now()) / 86400000);
      setDaysRemaining(diff > 0 ? diff : 0);
      showNotification('Cronograma gerado! Clique em Salvar para mantê-lo.');
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : 'Falha na geração do cronograma.', true);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (!schedule) return;
    if (schedule.id) {
      showNotification('Este cronograma já está salvo!');
      return;
    }

    setIsSaving(true);
    try {
      const saved = await studyScheduleService.saveSchedule(schedule);
      setSchedule(saved);
      setSavedSchedules((prev) => [saved, ...prev]);
      localStorage.removeItem('@schedule_draft');
      showNotification('Cronograma salvo com sucesso!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar cronograma.';
      showNotification(message, true);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDayCompletion = async (weekIndex: number, dayIndex: number) => {
    if (!schedule || !schedule.schedule?.weeks) return;

    const newSchedule = { ...schedule };
    const day = newSchedule.schedule.weeks[weekIndex].days[dayIndex];
    day.completed = !day.completed;
    setSchedule(newSchedule);

    if (newSchedule.id) {
      await studyScheduleService.toggleDayCompletion(newSchedule.id, weekIndex, dayIndex).catch((e: unknown) =>
        console.warn('Erro ao sincronizar conclusão de dia:', e)
      );
    }
  };

  const handleDeleteSchedule = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja excluir este cronograma?')) return;

    try {
      await studyScheduleService.deleteSchedule(id);
      setSavedSchedules((prev) => prev.filter((s) => s.id !== id));
      if (schedule?.id === id) {
        setSchedule(null);
        setSubjects([]);
        setExamDate('');
        setDaysRemaining(null);
        localStorage.removeItem('@schedule_draft');
      }
      showNotification('Cronograma excluído.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir cronograma.';
      showNotification(message, true);
    }
  };

  const handleEditName = (e: React.MouseEvent, id: string, currentName: string) => {
    e.stopPropagation();
    setEditingId(id);
    setEditName(currentName);
  };

  const handleSaveName = async (e: React.MouseEvent, sched: StudySchedule) => {
    e.stopPropagation();
    if (!editName.trim() || !sched.id) return;

    try {
      await studyScheduleService.updateName(sched.id, editName.trim());
      const updatedObj = { ...sched.schedule, title: editName.trim() };
      setSavedSchedules((prev) =>
        prev.map((s) => (s.id === sched.id ? { ...s, schedule: updatedObj } : s))
      );
      if (schedule?.id === sched.id) {
        setSchedule({ ...schedule, schedule: updatedObj });
      }
      setEditingId(null);
      showNotification('Nome atualizado!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar nome.';
      showNotification(message, true);
    }
  };

  const handleExportCsv = () => {
    if (schedule) exportScheduleToCsv(schedule);
  };

  const handleExportPdf = () => {
    if (schedule) exportScheduleToPrint(schedule);
  };

  const handleGenerateContentForDay = (
    _weekPhase: string,
    _dayIndex: number,
    _weekNumber: number,
    day: ScheduleDay,
    block?: ScheduleBlock
  ) => {
    const targetSubject = block ? block.subject : day.subject;
    const isQuestoes = block?.type === 'questoes' || day.type === 'questoes';

    if (isQuestoes) {
      void navigate('/generate', {
        state: {
          initialSubject: targetSubject,
        },
      });
    } else {
      void navigate('/flashcards', {
        state: {
          initialSubject: targetSubject,
        },
      });
    }
  };

  const createAnotherSchedule = () => {
    localStorage.setItem('@zion_creating_schedule', 'true');
    localStorage.removeItem('@schedule_draft');
    setSchedule(null);
    setSubjects([]);
    setUserObservations('');
    setExamDate('');
    setDaysRemaining(null);
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Banner de notificações */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center justify-between animate-in fade-in">
            <span>{errorMessage}</span>
            <button type="button" onClick={() => setErrorMessage(null)} className="p-1 hover:opacity-70">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-between animate-in fade-in">
            <span>{successMessage}</span>
            <button type="button" onClick={() => setSuccessMessage(null)} className="p-1 hover:opacity-70">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header da Página */}
        <div className="mb-8 border-b border-border/60 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-6 h-6 text-primary" />
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Cronograma de Estudos
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Um plano de estudos focado e dinâmico, otimizado por IA com blocos Pomodoro e ciclos intercalados.
            </p>
          </div>

          {savedSchedules.length > 0 && (
            <button
              type="button"
              onClick={() => setShowSavedModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-secondary/70 hover:bg-secondary text-foreground text-sm font-medium rounded-lg border border-border/60 transition-colors cursor-pointer"
            >
              Meus Cronogramas ({savedSchedules.length})
            </button>
          )}
        </div>

        {/* ESTADO VAZIO: assistente de cronograma */}
        {!schedule && <ScheduleWizard loading={loading} onGenerate={(payload) => void handleWizardGenerate(payload)} />}

        {/* ESTADO COM CRONOGRAMA GERADO / CARREGADO */}
        {schedule && (
          <div className="space-y-6 animate-fade-in">
            {/* Header / Resumo */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-2xl border border-border/80 bg-card shadow-sm">
              <div className="flex items-center gap-6 w-full md:w-auto">
                {daysRemaining !== null && (
                  <div className="text-center px-4 md:px-6 md:border-r border-border/60">
                    <div className="text-3xl font-display font-bold text-primary">{daysRemaining}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
                      Dias P/ Prova
                    </div>
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
                    onClick={() => void handleSaveSchedule()}
                    disabled={isSaving || loading}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors cursor-pointer"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Salvar
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-muted-foreground border border-border rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" /> Exportar PDF
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-muted-foreground border border-border rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Planilha
                </button>
              </div>
            </div>

            {/* Aviso de Desempenho Histórico Neutro */}
            {!schedule.hasPerformanceData && !schedule.has_performance_data && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/70 shadow-sm text-foreground">
                <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <div className="text-xs text-muted-foreground leading-relaxed">
                  Sua taxa histórica de simulados e questões ainda está inicial. O algoritmo dividiu a carga de forma equilibrada. Conforme você resolver questões e revisar flashcards, a IA calibrará os próximos ciclos com foco nas suas fraquezas!
                </div>
              </div>
            )}

            {/* Semanas do Cronograma */}
            <div className="space-y-4">
              {schedule.schedule.weeks.map((week, idx) => (
                <WeekCollapsible
                  key={idx}
                  week={week}
                  weekIndex={idx}
                  defaultOpen={idx === 0}
                  onToggleDay={(wIdx, dIdx) => void toggleDayCompletion(wIdx, dIdx)}
                  onGenerate={(dayIndex: number, day: ScheduleDay, block?: ScheduleBlock) =>
                    handleGenerateContentForDay(week.phase, dayIndex, week.weekNumber, day, block)
                  }
                />
              ))}
            </div>

            {/* Ação para criar outro cronograma */}
            <div className="text-center pt-8 border-t border-border/50">
              <button
                type="button"
                onClick={createAnotherSchedule}
                className="text-muted-foreground text-sm hover:text-foreground transition-colors underline underline-offset-4 cursor-pointer"
              >
                Criar outro cronograma
              </button>
            </div>
          </div>
        )}

        {/* Modal: Cronogramas Salvos */}
        {showSavedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border p-6 flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
                <h3 className="text-lg font-bold text-foreground">Cronogramas Salvos</h3>
                <button
                  type="button"
                  onClick={() => setShowSavedModal(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                {savedSchedules.map((sched) => {
                  const sTitle =
                    sched.schedule?.title ||
                    `Prova: ${new Date(`${sched.examDate || sched.exam_date}T12:00:00Z`).toLocaleDateString('pt-BR')}`;

                  return (
                    <div
                      key={sched.id}
                      onClick={() => {
                        if (editingId === sched.id) return;
                        localStorage.removeItem('@zion_creating_schedule');
                        setSchedule(sched);
                        setExamDate(sched.examDate || sched.exam_date || '');
                        setDailyHours(sched.dailyHours || sched.daily_hours || 3);
                        setSubjects(sched.subjects || []);
                        const dateStr = sched.examDate || sched.exam_date;
                        if (dateStr) {
                          const today = new Date();
                          const target = new Date(`${dateStr}T12:00:00Z`);
                          const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 3600 * 24));
                          setDaysRemaining(diff > 0 ? diff : 0);
                        }
                        setShowSavedModal(false);
                      }}
                      className="p-4 rounded-xl border border-border bg-background hover:border-primary/50 cursor-pointer transition-all relative group"
                    >
                      {editingId === sched.id ? (
                        <div className="flex items-center gap-2 mb-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 h-8 px-2.5 text-sm border rounded-md text-foreground bg-card focus:ring-1 focus:ring-primary outline-none"
                            placeholder="Nome customizado..."
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              void handleSaveName(e, sched);
                            }}
                            className="p-1.5 bg-primary/10 text-primary rounded-md hover:bg-primary/20"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(null);
                            }}
                            className="p-1.5 bg-secondary text-muted-foreground rounded-md hover:bg-secondary/80"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start">
                          <p className="font-semibold text-foreground text-sm pr-16">{sTitle}</p>
                          <div className="absolute top-3.5 right-3.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => {
                                if (sched.id) handleEditName(e, sched.id, sTitle);
                              }}
                              className="p-1.5 text-muted-foreground hover:text-primary rounded-md bg-secondary/60 hover:bg-secondary"
                              title="Renomear"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                if (sched.id) void handleDeleteSchedule(e, sched.id);
                              }}
                              className="p-1.5 text-muted-foreground hover:text-destructive rounded-md bg-secondary/60 hover:bg-secondary"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                        <span>{sched.subjects?.length || 0} matérias</span>
                        <span>{sched.dailyHours || sched.daily_hours}h / dia</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface WeekCollapsibleProps {
  week: ScheduleWeek;
  weekIndex: number;
  defaultOpen: boolean;
  onToggleDay: (wIdx: number, dIdx: number) => void;
  onGenerate: (dayIndex: number, day: ScheduleDay, block?: ScheduleBlock) => void;
}

const WeekCollapsible: React.FC<WeekCollapsibleProps> = ({
  week,
  weekIndex,
  defaultOpen,
  onToggleDay,
  onGenerate,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const phaseLabel =
    week.phase === 'base'
      ? 'Fase Base (50%)'
      : week.phase === 'intensification'
      ? 'Fase Intensificação (30%)'
      : 'Fase Reta Final / Revisões (20%)';

  const phaseBadgeClass =
    week.phase === 'base'
      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      : week.phase === 'intensification'
      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

  return (
    <div className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden transition-all duration-300">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 bg-card hover:bg-muted/30 transition-colors text-left cursor-pointer"
      >
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-3">
            <h3 className="font-display font-bold text-base sm:text-lg text-foreground">
              Semana {week.weekNumber}
            </h3>
            <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border', phaseBadgeClass)}>
              {phaseLabel}
            </span>
          </div>
          {week.theme && (
            <span className="text-xs font-medium text-primary uppercase tracking-wide">
              {week.theme}
            </span>
          )}
        </div>
        <div className="p-1 rounded-full bg-secondary text-muted-foreground">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {isOpen && (
        <div className="flex flex-col bg-background/50 border-t border-border/50">
          {week.days.map((day, dIdx) => (
            <ScheduleDayRow
              key={dIdx}
              day={day}
              onToggleCompletion={() => onToggleDay(weekIndex, dIdx)}
              onGenerate={(block?: ScheduleBlock) => onGenerate(dIdx, day, block)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
