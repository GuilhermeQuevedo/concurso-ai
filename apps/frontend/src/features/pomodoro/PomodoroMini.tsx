import { Link, useLocation } from 'react-router';
import {
  Pause,
  Play,
  Timer,
  X,
  GripHorizontal,
  Maximize2,
  Minimize2,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';

import { setPomodoroFloating, usePomodoroFloating } from './floating-preference';
import { isInProgress, POMODORO_MODES } from './pomodoro-store';
import { formatClock, usePomodoro } from './usePomodoro';
import { useFloatingLayout } from './useFloatingLayout';

export function PomodoroMini() {
  const { pathname } = useLocation();
  const pomo = usePomodoro();
  const floating = usePomodoroFloating();

  const {
    x,
    y,
    width,
    height,
    isExpanded,
    isDragging,
    isResizing,
    handlePointerDownDrag,
    handlePointerDownResize,
    toggleExpand,
  } = useFloatingLayout();

  // Exibir apenas quando estiver fora do dashboard, habilitado e com ciclo em andamento
  if (!floating || pathname === '/dashboard' || !isInProgress(pomo)) return null;

  const currentMode = POMODORO_MODES[pomo.mode];
  const totalModeMs = currentMode.minutes * 60_000;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((totalModeMs - pomo.remainingMs) / totalModeMs) * 100))
  );

  return (
    <div
      role="timer"
      aria-label="Cronômetro flutuante maleável"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
      className={`fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-2xl backdrop-blur-md select-none touch-none dark:border-slate-800/90 dark:bg-slate-900/95 transition-shadow duration-fast ${
        isDragging
          ? 'ring-2 ring-[#2E8C82] shadow-2xl cursor-grabbing'
          : isResizing
            ? 'ring-2 ring-amber-500 shadow-2xl'
            : 'hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Visual Corner Resize Handle at Bottom-Right */}
      <div
        onPointerDown={handlePointerDownResize}
        title="Arraste para redimensionar largura e altura"
        className="absolute bottom-0 right-0 z-20 flex h-5 w-5 cursor-nwse-resize items-end justify-end p-1 text-slate-400 hover:text-[#2E8C82] dark:text-slate-500 dark:hover:text-[#38b2a6]"
      >
        <svg viewBox="0 0 8 8" className="h-2.5 w-2.5 fill-current">
          <circle cx="7" cy="7" r="1" />
          <circle cx="7" cy="4" r="1" />
          <circle cx="4" cy="7" r="1" />
        </svg>
      </div>

      {!isExpanded ? (
        /* Modo Compacto (Pílula Flutuante) */
        <div className="flex h-full w-full items-center justify-between gap-1.5 px-2.5 py-1">
          {/* Drag Grip Handle */}
          <button
            type="button"
            onPointerDown={handlePointerDownDrag}
            title="Arraste para mover o cronômetro para qualquer lugar da tela"
            aria-label="Mover cronômetro"
            className="flex h-7 w-5 shrink-0 cursor-grab active:cursor-grabbing items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200 focus-visible:outline-none"
          >
            <GripHorizontal className="h-4 w-4" />
          </button>

          {/* Clock Display & Link to Dashboard */}
          <Link
            to="/dashboard"
            className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg px-1 py-0.5 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2E8C82]"
            title="Abrir detalhes no Dashboard"
          >
            <Timer className="h-4 w-4 shrink-0 text-[#2E8C82] dark:text-[#38b2a6]" />
            <span className="font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white truncate">
              {formatClock(pomo.secondsLeft)}
            </span>
            <span className="hidden sm:inline-block rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300 truncate max-w-[70px]">
              {currentMode.label}
            </span>
          </Link>

          {/* Controls: Play/Pause, Expand, Close */}
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => (pomo.running ? pomo.actions.pause() : pomo.actions.start())}
              aria-label={pomo.running ? 'Pausar Pomodoro' : 'Iniciar Pomodoro'}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2E8C82] text-white hover:bg-[#26776f] active:scale-95 transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82]"
            >
              {pomo.running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>

            <button
              type="button"
              onClick={toggleExpand}
              aria-label="Expandir tamanho do cronômetro"
              title="Expandir tamanho do cronômetro"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2E8C82]"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setPomodoroFloating(false)}
              aria-label="Ocultar cronômetro flutuante"
              title="Ocultar (o cronômetro continuará rodando no painel)"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2E8C82]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Modo Expandido (Card Widget Flutuante) */
        <div className="flex h-full w-full flex-col justify-between p-3.5">
          {/* Top Drag Header */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
            <div
              onPointerDown={handlePointerDownDrag}
              title="Arraste para mover o cronômetro para qualquer lugar da tela"
              className="flex flex-1 cursor-grab active:cursor-grabbing items-center gap-1.5"
            >
              <GripHorizontal className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Pomodoro</span>
              <span className="rounded-full bg-[#2E8C82]/10 px-2 py-0.5 text-[10px] font-bold text-[#2E8C82] dark:bg-[#2E8C82]/20 dark:text-[#38b2a6]">
                {currentMode.label}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleExpand}
                aria-label="Minimizar para formato compacto"
                title="Minimizar para formato compacto"
                className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200 focus-visible:outline-none"
              >
                <Minimize2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPomodoroFloating(false)}
                aria-label="Ocultar cronômetro flutuante"
                title="Ocultar"
                className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200 focus-visible:outline-none"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Central Clock & Progress */}
          <div className="flex flex-1 flex-col items-center justify-center py-2 text-center">
            <span className="font-mono text-3xl font-black tracking-tight tabular-nums text-[#2E8C82] dark:text-[#38b2a6]">
              {formatClock(pomo.secondsLeft)}
            </span>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span>{`Ciclo ${pomo.cycles + 1}`}</span>
              <span>•</span>
              <span>{`${progressPercent}% decorrido`}</span>
            </div>

            {/* Progress bar */}
            <div
              role="progressbar"
              aria-label="Progresso do ciclo flutuante"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
            >
              <div
                className="h-full rounded-full bg-[#2E8C82] transition-all duration-normal"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Bottom Actions Bar */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => pomo.actions.reset()}
              aria-label="Reiniciar ciclo"
              title="Reiniciar ciclo atual"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200 active:scale-95 transition-all focus-visible:outline-none"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => (pomo.running ? pomo.actions.pause() : pomo.actions.start())}
              className="min-h-[34px] flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2E8C82] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#26776f] active:scale-95 transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82]"
            >
              {pomo.running ? (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  <span>Iniciar</span>
                </>
              )}
            </button>

            <Link
              to="/dashboard"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200 active:scale-95 transition-all focus-visible:outline-none"
              title="Ir para o Dashboard"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
