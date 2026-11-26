import { useState, type ReactNode } from 'react';
import { Loader2, Sparkles, Calendar, BookOpen, Clock, Target } from 'lucide-react';

import { DaysStep } from './DaysStep';
import { GoalStep } from './GoalStep';
import { SubjectsStep } from './SubjectsStep';
import { useScheduleWizard, type WizardSubmitPayload } from './useScheduleWizard';

export interface ScheduleWizardProps {
  loading: boolean;
  onGenerate: (payload: WizardSubmitPayload) => void;
}

export interface SectionProps {
  number: number;
  title: string;
  hint?: string;
  icon?: typeof Calendar;
  children: ReactNode;
}

function Section({ number, title, hint, icon: Icon, children }: SectionProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900 sm:p-6 transition-all duration-normal motion-safe:animate-in motion-safe:fade-in">
      <h2 className="mb-1 flex items-center gap-2.5 text-base font-bold text-gray-900 dark:text-white">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white shadow-xs">
          {number}
        </span>
        <span className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-primary-500" />}
          {title}
        </span>
      </h2>
      {hint && <p className="mb-4 ml-9 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{hint}</p>}
      <div className={hint ? '' : 'mt-4'}>{children}</div>
    </section>
  );
}

export function ScheduleWizard({ loading, onGenerate }: ScheduleWizardProps) {
  const wizard = useScheduleWizard();
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const problem = wizard.validate();
    setError(problem);
    if (!problem) onGenerate(wizard.buildPayload());
  };

  return (
    <div className="space-y-4">
      <Section
        number={1}
        title="Escolha a prova e as matérias"
        hint="Puxamos as matérias direto de Meus Editais. Defina importância e dificuldade de cada uma."
        icon={BookOpen}
      >
        <div className="mb-4 grid gap-3.5 sm:grid-cols-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
            Prova ou estudo
            <select
              value={wizard.contestId}
              onChange={(e) => wizard.setContestId(e.target.value)}
              disabled={wizard.isLoadingContests}
              className="mt-1.5 h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 text-sm font-normal text-gray-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Montar manualmente</option>
              {wizard.contests.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
            Data da prova
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={wizard.examDate}
              onChange={(e) => wizard.setExamDate(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 text-sm font-normal text-gray-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {wizard.examDate && (
              <span className="mt-1.5 block text-xs font-semibold text-primary-600 dark:text-primary-400 motion-safe:animate-in motion-safe:fade-in">
                {(() => {
                  const [y, m, d] = wizard.examDate.split('-').map(Number);
                  const target = new Date(y, m - 1, d);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
                  if (diffDays <= 0) return 'Atenção: selecione uma data futura.';
                  const wks = Math.max(1, Math.ceil(diffDays / 7));
                  return `${diffDays} dias até a prova (${wks} semanas de cronograma completo)`;
                })()}
              </span>
            )}
          </label>
        </div>
        {wizard.isLoadingDetail ? (
          <div className="h-28 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ) : (
          <SubjectsStep subjects={wizard.subjects} onChange={wizard.setSubjects} />
        )}
      </Section>

      <Section number={2} title="Dias e limites de estudo" icon={Clock}>
        <DaysStep days={wizard.days} onChange={wizard.setDays} />
      </Section>

      <Section number={3} title="Meta semanal e distribuição diária" icon={Target}>
        <GoalStep
          weeklyHours={wizard.weeklyHours}
          maxSubjectsPerDay={wizard.maxSubjects}
          onWeeklyHours={wizard.setGoalHours}
          onMaxSubjects={wizard.setMaxSubjects}
        />
      </Section>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 motion-safe:animate-in motion-safe:fade-in"
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={loading}
        aria-busy={loading}
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700 active:scale-[0.98] disabled:opacity-60 touch-manipulation"
      >
        {loading ? (
          <span role="status" className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Montando seu cronograma inteligente…
          </span>
        ) : (
          <>
            <Sparkles className="h-4 w-4" /> Gerar cronograma inteligente
          </>
        )}
      </button>
    </div>
  );
}
