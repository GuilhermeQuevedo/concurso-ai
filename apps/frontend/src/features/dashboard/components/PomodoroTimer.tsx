import { Play, Pause, RotateCcw, Timer, Flame } from 'lucide-react';

import { POMODORO_MODES as MODES, type PomodoroMode } from '@/features/pomodoro/pomodoro-store';
import { setPomodoroFloating, usePomodoroFloating } from '@/features/pomodoro/floating-preference';
import { formatClock, usePomodoro } from '@/features/pomodoro/usePomodoro';

// O estado vive em features/pomodoro (fora do componente) para o cronômetro sobreviver à troca de página.
export function PomodoroTimer() {
  const { mode, running, secondsLeft, cycles, actions } = usePomodoro();
  const floating = usePomodoroFloating();

  const total = MODES[mode].minutes * 60;
  const progress = total > 0 ? Math.min(100, Math.max(0, ((total - secondsLeft) / total) * 100)) : 0;

  return (
    <div
      role="region"
      aria-label="Cronômetro Pomodoro de alta concentração"
      className="rounded-2xl border border-gray-200/90 bg-white p-5 sm:p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900 motion-safe:animate-in motion-safe:fade-in duration-fast"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600/10 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400">
            <Timer className="h-4 w-4" />
          </span>
          Pomodoro & Foco
        </h2>
        {cycles > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200/70 dark:border-amber-900/60">
            <Flame className="h-3 w-3 fill-amber-500 text-amber-500" />
            {cycles} {cycles === 1 ? 'ciclo' : 'ciclos'} hoje
          </span>
        )}
      </div>

      <div className="mb-4 flex gap-1.5 rounded-xl border border-gray-200/80 bg-gray-50/70 p-1 dark:border-gray-800 dark:bg-gray-800/40">
        {(Object.keys(MODES) as PomodoroMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => actions.reset(m)}
            className={`min-h-[38px] flex-1 rounded-lg px-2 py-1 text-xs font-semibold transition-all touch-manipulation cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
              mode === m
                ? 'bg-primary-600 text-white shadow-xs font-bold'
                : 'text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
            }`}
          >
            {MODES[m].label}
          </button>
        ))}
      </div>

      <div className="mb-5 text-center">
        <p
          role="timer"
          aria-label={`Tempo restante: ${formatClock(Math.max(0, secondsLeft))}`}
          className="font-mono text-5xl font-extrabold tracking-tight tabular-nums text-gray-900 dark:text-white"
        >
          {formatClock(Math.max(0, secondsLeft))}
        </p>
        <div
          className="mx-auto mt-3.5 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso do ciclo de foco atual"
        >
          <div
            className="h-full rounded-full bg-primary-600 transition-all duration-normal ease-standard dark:bg-primary-500 shadow-2xs"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={() => (running ? actions.pause() : actions.start())}
          className="flex min-h-[44px] items-center gap-2 rounded-xl bg-primary-600 hover:bg-primary-700 px-6 py-2.5 text-sm font-bold text-white shadow-xs transition-all duration-fast hover:shadow-sm active:scale-[0.98] touch-manipulation cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
        >
          {running ? <Pause className="h-4 w-4 stroke-[2.5]" /> : <Play className="h-4 w-4 stroke-[2.5]" />}
          {running ? 'Pausar Ciclo' : 'Iniciar Foco'}
        </button>
        <button
          type="button"
          onClick={() => actions.reset()}
          aria-label="Reiniciar cronômetro"
          title="Reiniciar cronômetro"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white text-gray-500 shadow-xs transition-all duration-fast hover:bg-gray-50 hover:text-gray-900 active:scale-95 touch-manipulation cursor-pointer dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <label className="mt-4 flex min-h-[36px] cursor-pointer items-center justify-center gap-2 text-xs font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 touch-manipulation select-none">
        <input
          type="checkbox"
          checked={floating}
          onChange={(e) => setPomodoroFloating(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
        />
        Manter cronômetro flutuando em outras telas
      </label>
    </div>
  );
}
