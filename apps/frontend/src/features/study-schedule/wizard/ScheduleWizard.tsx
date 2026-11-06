import { useState, type ReactNode } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

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
  children: ReactNode;
}

function Section({ number, title, hint, children }: SectionProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-xs text-white">
          {number}
        </span>
        {title}
      </h2>
      {hint && <p className="mb-4 ml-8 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
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
      >
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Prova ou estudo
            <select
              value={wizard.contestId}
              onChange={(e) => wizard.setContestId(e.target.value)}
              disabled={wizard.isLoadingContests}
              className="mt-1 h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm font-normal text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Montar manualmente</option>
              {wizard.contests.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Data da prova
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={wizard.examDate}
              onChange={(e) => wizard.setExamDate(e.target.value)}
              className="mt-1 h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm font-normal text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {wizard.examDate && (
              <span className="mt-1 block text-[11px] font-medium text-primary-600 dark:text-primary-400">
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
          <div className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ) : (
          <SubjectsStep subjects={wizard.subjects} onChange={wizard.setSubjects} />
        )}
      </Section>

      <Section number={2} title="Dias e limites de estudo">
        <DaysStep days={wizard.days} onChange={wizard.setDays} />
      </Section>

      <Section number={3} title="Meta semanal">
        <GoalStep
          weeklyHours={wizard.weeklyHours}
          maxSubjectsPerDay={wizard.maxSubjects}
          onWeeklyHours={wizard.setGoalHours}
          onMaxSubjects={wizard.setMaxSubjects}
        />
      </Section>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-600 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Montando seu cronograma…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" /> Gerar cronograma
          </>
        )}
      </button>
    </div>
  );
}
