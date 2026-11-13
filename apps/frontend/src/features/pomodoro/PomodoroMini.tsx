import { Link, useLocation } from 'react-router';
import { Pause, Play, Timer, X } from 'lucide-react';

import { setPomodoroFloating, usePomodoroFloating } from './floating-preference';
import { isInProgress, POMODORO_MODES } from './pomodoro-store';
import { formatClock, usePomodoro } from './usePomodoro';

// Cronômetro compacto: mantém o Pomodoro visível e controlável enquanto a pessoa navega pelo app.
export function PomodoroMini() {
  const { pathname } = useLocation();
  const pomo = usePomodoro();
  const floating = usePomodoroFloating();
  if (!floating || pathname === '/dashboard' || !isInProgress(pomo)) return null;

  return (
    <div
      role="timer"
      aria-label="Pomodoro em andamento"
      className="fixed bottom-6 left-4 z-40 flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1.5 pl-3 pr-1.5 shadow-lg dark:border-gray-700 dark:bg-gray-900 lg:left-[19rem]"
    >
      <Link to="/dashboard" className="flex items-center gap-2" title="Abrir o Pomodoro">
        <Timer className="h-4 w-4 text-primary-600" />
        <span className="font-mono text-sm font-semibold tabular-nums text-gray-900 dark:text-white">{formatClock(pomo.secondsLeft)}</span>
        <span className="hidden text-[11px] text-gray-500 sm:inline dark:text-gray-400">{POMODORO_MODES[pomo.mode].label}</span>
      </Link>
      <button
        type="button"
        onClick={() => (pomo.running ? pomo.actions.pause() : pomo.actions.start())}
        aria-label={pomo.running ? 'Pausar Pomodoro' : 'Retomar Pomodoro'}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-white hover:bg-primary-700"
      >
        {pomo.running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </button>
      <button
        type="button"
        onClick={() => setPomodoroFloating(false)}
        aria-label="Esconder o Pomodoro flutuante"
        title="Esconder (o cronômetro continua no Painel; dá para reativar lá)"
        className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
