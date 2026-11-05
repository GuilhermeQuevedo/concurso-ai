import { useState, type ReactNode } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

import { DaysStep } from './DaysStep';
import { GoalStep } from './GoalStep';
import { SubjectsStep } from './SubjectsStep';
import { useScheduleWizard, type WizardSubmitPayload } from './useScheduleWizard';

interface ScheduleWizardProps {
  loading: boolean;
  onGenerate: (payload: WizardSubmitPayload) => void;
}

interface SectionProps {
  number: number;
  title: string;
  hint?: string;
  children: ReactNode;
}

function Section({ number, title, hint, children }: SectionProps) {
  return (
    <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-bold text-foreground">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
          {number}
        </span>
        {title}
      </h2>
      {hint && <p className="mb-4 ml-8 text-xs text-muted-foreground">{hint}</p>}
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
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">Faça o seu cronograma</h2>
        <p className="text-sm text-muted-foreground">
          Responda sobre a sua rotina e a IA organiza as matérias dentro do tempo que você realmente tem.
        </p>
      </div>

      <Section
        number={1}
        title="Escolha a prova e as matérias"
        hint="Puxamos as matérias direto de Minhas Provas. Defina importância e dificuldade de cada uma."
      >
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Prova ou estudo
            <select
              value={wizard.contestId}
              onChange={(e) => wizard.setContestId(e.target.value)}
              disabled={wizard.isLoadingContests}
              className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm font-normal normal-case text-foreground outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Montar manualmente</option>
              {wizard.contests.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Data da prova
            <input
              type="date"
              value={wizard.examDate}
              onChange={(e) => wizard.setExamDate(e.target.value)}
              className="mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>
        </div>
        {wizard.isLoadingDetail ? (
          <div className="h-24 animate-pulse rounded-xl bg-secondary/60" />
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

      {error && <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
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
