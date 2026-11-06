export interface GoalStepProps {
  weeklyHours: number;
  maxSubjectsPerDay: number | null;
  onWeeklyHours: (hours: number) => void;
  onMaxSubjects: (value: number | null) => void;
}

export function GoalStep({ weeklyHours, maxSubjectsPerDay, onWeeklyHours, onMaxSubjects }: GoalStepProps) {
  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-white" htmlFor="weekly-hours">
          Total de horas na semana
        </label>
        <div className="flex items-center gap-2">
          <input
            id="weekly-hours"
            type="number"
            min={1}
            max={168}
            value={weeklyHours}
            onChange={(e) => onWeeklyHours(Math.max(1, Number(e.target.value) || 1))}
            className="h-10 w-28 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <span className="text-sm text-gray-500 dark:text-gray-400">horas</span>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-white" htmlFor="max-subjects">
          Limite de matérias por dia
        </label>
        <select
          id="max-subjects"
          value={maxSubjectsPerDay ?? ''}
          onChange={(e) => onMaxSubjects(e.target.value ? Number(e.target.value) : null)}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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
