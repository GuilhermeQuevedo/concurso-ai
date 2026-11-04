import { SCHEDULE_PRESETS, WEEK_DAYS, applyPreset, totalMinutes, type DayLimit } from './schedule-wizard.model';

interface DaysStepProps {
  days: DayLimit[];
  onChange: (days: DayLimit[]) => void;
}

function MinutesInput({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {label}
      <input
        type="number"
        min={0}
        max={1440}
        step={15}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="h-8 w-20 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
      />
      min
    </label>
  );
}

export function DaysStep({ days, onChange }: DaysStepProps) {
  const patch = (day: string, change: Partial<DayLimit>) =>
    onChange(days.map((d) => (d.day === day ? { ...d, ...change } : d)));

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-1 text-sm font-semibold text-foreground">Não sabe quanto tempo estudar na semana?</p>
        <p className="mb-3 text-xs text-muted-foreground">Escolha um modelo pronto. Você pode ajustar tudo depois.</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SCHEDULE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange(applyPreset(days, preset.hoursPerWeek))}
              className="rounded-lg border border-border bg-background p-3 text-left transition-colors hover:border-primary/60"
            >
              <span className="block text-sm font-semibold text-foreground">{preset.label}</span>
              <span className="block text-xs text-primary">{preset.hoursPerWeek}h/semana</span>
              <span className="block text-[11px] text-muted-foreground">{preset.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {WEEK_DAYS.map(({ key, label }) => {
          const limit = days.find((d) => d.day === key);
          if (!limit) return null;
          return (
            <div key={key} className="flex flex-wrap items-center gap-3 rounded-lg border border-border/70 bg-background px-3 py-2">
              <label className="flex w-16 items-center gap-2 text-sm font-semibold text-foreground">
                <input type="checkbox" checked={limit.enabled} onChange={(e) => patch(key, { enabled: e.target.checked })} />
                {label}
              </label>
              {limit.enabled ? (
                <>
                  <MinutesInput label="Mín" value={limit.minMinutes} onChange={(n) => patch(key, { minMinutes: n })} />
                  <MinutesInput label="Máx" value={limit.maxMinutes} onChange={(n) => patch(key, { maxMinutes: n })} />
                </>
              ) : (
                <span className="text-xs text-muted-foreground">Dia de descanso</span>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Capacidade da semana: <strong className="text-foreground">{(totalMinutes(days) / 60).toFixed(1)}h</strong>
      </p>
    </div>
  );
}
