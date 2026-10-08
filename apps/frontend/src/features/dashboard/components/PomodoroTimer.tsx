import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';

type Mode = 'foco' | 'curta' | 'longa';

const MODES: Record<Mode, { label: string; minutes: number }> = {
  foco: { label: 'Foco', minutes: 25 },
  curta: { label: 'Pausa curta', minutes: 5 },
  longa: { label: 'Pausa longa', minutes: 15 },
};

function todayKey(): string {
  return `pomodoro-cycles-${new Date().toISOString().slice(0, 10)}`;
}

function readCycles(): number {
  try {
    return Number(localStorage.getItem(todayKey()) ?? '0');
  } catch {
    return 0;
  }
}

function formatClock(totalSeconds: number): string {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export function PomodoroTimer() {
  const [mode, setMode] = useState<Mode>('foco');
  const [secondsLeft, setSecondsLeft] = useState(MODES.foco.minutes * 60);
  const [running, setRunning] = useState(false);
  const [cycles, setCycles] = useState(readCycles);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectMode = (next: Mode) => {
    setMode(next);
    setRunning(false);
    setSecondsLeft(MODES[next].minutes * 60);
  };

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  useEffect(() => {
    if (secondsLeft > 0) return;
    setRunning(false);
    if (mode === 'foco') {
      const next = readCycles() + 1;
      try {
        localStorage.setItem(todayKey(), String(next));
      } catch {
        // ignore storage errors
      }
      setCycles(next);
    }
    setSecondsLeft(MODES[mode].minutes * 60);
  }, [secondsLeft, mode]);

  const total = MODES[mode].minutes * 60;
  const progress = ((total - secondsLeft) / total) * 100;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
        <Timer className="h-4 w-4 text-primary-600" />
        Pomodoro
      </h2>

      <div className="mb-3 flex gap-1.5">
        {(Object.keys(MODES) as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => selectMode(m)}
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
          onClick={() => setRunning((r) => !r)}
          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? 'Pausar' : 'Iniciar'}
        </button>
        <button
          onClick={() => selectMode(mode)}
          className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          title="Reiniciar"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-3 text-center text-[11px] text-gray-400">
        {cycles} ciclo{cycles === 1 ? '' : 's'} de foco hoje
      </p>
    </div>
  );
}
