interface GoalStepProps {
  weeklyHours: number;
  maxSubjectsPerDay: number | null;
  onWeeklyHours: (hours: number) => void;
  onMaxSubjects: (value: number | null) => void;
}

export function GoalStep({ weeklyHours, maxSubjectsPerDay, onWeeklyHours, onMaxSubjects }: GoalStepProps) {
  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-foreground" htmlFor="weekly-hours">
          Total de horas na semana
        </label>
        <input
          id="weekly-hours"
          type="number"
          min={1}
          max={168}
          value={weeklyHours}
          onChange={(e) => onWeeklyHours(Math.max(1, Number(e.target.value) || 1))}
          className="h-11 w-32 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
        <span className="ml-2 text-sm text-muted-foreground">horas</span>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-foreground" htmlFor="max-subjects">
          Limite de matérias por dia
        </label>
        <select
          id="max-subjects"
          value={maxSubjectsPerDay ?? ''}
          onChange={(e) => onMaxSubjects(e.target.value ? Number(e.target.value) : null)}
          className="h-11 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">Sem limite</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? 'matéria' : 'matérias'}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
