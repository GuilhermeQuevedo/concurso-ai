import { SCHEDULE_PRESETS, WEEK_DAYS, applyPreset, totalMinutes, type DayLimit } from './schedule-wizard.model';

export interface DaysStepProps {
  days: DayLimit[];
  onChange: (days: DayLimit[]) => void;
}

export interface MinutesInputProps {
  label: string;
  value: number;
  onChange: (minutes: number) => void;
}

function MinutesInput({ label, value, onChange }: MinutesInputProps) {
  return (
    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400">
      {label}
      <input
        type="number"
        min={0}
        max={1440}
        step={15}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="h-9 w-20 rounded-lg border border-gray-300 bg-white px-2 text-sm text-gray-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      />
      <span className="text-[11px] font-normal text-gray-500">min</span>
    </label>
  );
}

export function DaysStep({ days, onChange }: DaysStepProps) {
  const patch = (day: string, change: Partial<DayLimit>) =>
    onChange(days.map((d) => (d.day === day ? { ...d, ...change } : d)));

  const totalHours = (totalMinutes(days) / 60).toFixed(1);

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-1 text-sm font-bold text-gray-900 dark:text-white">Não sabe quanto tempo estudar na semana?</p>
        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">Escolha um modelo pronto baseado no seu ritmo de vida. Você pode refinar cada dia abaixo.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {SCHEDULE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange(applyPreset(days, preset.hoursPerWeek))}
              className="min-h-[56px] rounded-xl border border-gray-200 bg-white p-3.5 text-left transition-all hover:border-primary-500 hover:shadow-xs active:scale-[0.98] touch-manipulation dark:border-gray-800 dark:bg-gray-900 dark:hover:border-primary-500"
            >
              <span className="block text-sm font-bold text-gray-900 dark:text-white">{preset.label}</span>
              <span className="block text-xs font-semibold text-primary-600 dark:text-primary-400">{preset.hoursPerWeek}h / semana</span>
              <span className="mt-1 block text-[11px] text-gray-500 dark:text-gray-400 leading-snug">{preset.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {WEEK_DAYS.map(({ key, label }) => {
          const limit = days.find((d) => d.day === key);
          if (!limit) return null;
          return (
            <div
              key={key}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 transition-colors ${
                limit.enabled
                  ? 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'
                  : 'border-dashed border-gray-200 bg-gray-50/60 opacity-60 dark:border-gray-800 dark:bg-gray-900/40'
              }`}
            >
              <label className="flex min-h-[36px] items-center gap-2.5 text-sm font-bold text-gray-900 dark:text-white cursor-pointer select-none touch-manipulation">
                <input
                  type="checkbox"
                  checked={limit.enabled}
                  onChange={(e) => patch(key, { enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
                {label}
              </label>
              {limit.enabled ? (
                <div className="flex items-center gap-3">
                  <MinutesInput label="Mín" value={limit.minMinutes} onChange={(n) => patch(key, { minMinutes: n })} />
                  <MinutesInput label="Máx" value={limit.maxMinutes} onChange={(n) => patch(key, { maxMinutes: n })} />
                </div>
              ) : (
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500">Dia de descanso programado</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-primary-100 bg-primary-50/50 p-3.5 text-xs text-primary-900 dark:border-primary-900/40 dark:bg-primary-950/20 dark:text-primary-200">
        Capacidade semanal configurada: <strong className="font-bold text-sm text-primary-700 dark:text-primary-300">{totalHours}h</strong> de estudo líquido.
      </div>
    </div>
  );
}
