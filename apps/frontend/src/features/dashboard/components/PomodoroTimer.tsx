import { Play, Pause, RotateCcw, Timer } from 'lucide-react';

import { POMODORO_MODES as MODES, type PomodoroMode } from '@/features/pomodoro/pomodoro-store';
import { setPomodoroFloating, usePomodoroFloating } from '@/features/pomodoro/floating-preference';
import { formatClock, usePomodoro } from '@/features/pomodoro/usePomodoro';

// O estado vive em features/pomodoro (fora do componente) para o cronômetro sobreviver à troca de página.
export function PomodoroTimer() {
  const { mode, running, secondsLeft, cycles, actions } = usePomodoro();
  const floating = usePomodoroFloating();

  const total = MODES[mode].minutes * 60;
  const progress = ((total - secondsLeft) / total) * 100;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
        <Timer className="h-4 w-4 text-primary-600" />
        Pomodoro
      </h2>

      <div className="mb-3 flex gap-1.5">
        {(Object.keys(MODES) as PomodoroMode[]).map((m) => (
          <button
            key={m}
            onClick={() => actions.reset(m)}
            className={`flex-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors ${
              mode === m
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            {MODES[m].label}
          </button>
        ))}
      </div>

      <div className="mb-3 text-center">
        <p className="font-mono text-4xl font-bold tabular-nums text-gray-900 dark:text-white">
          {formatClock(Math.max(0, secondsLeft))}
        </p>
        <div className="mx-auto mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => (running ? actions.pause() : actions.start())}
          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? 'Pausar' : 'Iniciar'}
        </button>
        <button
          onClick={() => actions.reset()}
          className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          title="Reiniciar"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 text-xs text-gray-600 dark:text-gray-300">
        <input
          type="checkbox"
          checked={floating}
          onChange={(e) => setPomodoroFloating(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600"
        />
        Manter o cronômetro flutuando nas outras telas
      </label>

      <p className="mt-2 text-center text-[11px] text-gray-400">
        {cycles} ciclo{cycles === 1 ? '' : 's'} de foco hoje
      </p>
    </div>
  );
}
