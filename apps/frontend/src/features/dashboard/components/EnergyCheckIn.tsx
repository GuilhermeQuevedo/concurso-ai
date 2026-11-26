import { useState } from 'react';
import { BatteryCharging, RotateCcw } from 'lucide-react';

export type EnergyLevel = 'leve' | 'normal' | 'pesado';

export interface EnergyOptionConfig {
  emoji: string;
  label: string;
  tip: string;
  factor: number;
  badgeStyle: string;
}

const OPTIONS: Record<EnergyLevel, EnergyOptionConfig> = {
  leve: {
    emoji: '😌',
    label: 'Leve / Descanso',
    tip: 'Energia tranquila. Vá no seu ritmo, priorize revisões e flashcards.',
    factor: 0.6,
    badgeStyle: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-200',
  },
  normal: {
    emoji: '💪',
    label: 'Normal / Em Foco',
    tip: 'Energia alta para cumprir o planejado e avançar no edital!',
    factor: 1,
    badgeStyle: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200',
  },
  pesado: {
    emoji: '😮‍💨',
    label: 'Pesado / Cansado',
    tip: 'Dia cansativo. Faça só o essencial — constância vale mais que volume.',
    factor: 0.4,
    badgeStyle: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200',
  },
};

function todayKey(): string {
  return `energy-${new Date().toISOString().slice(0, 10)}`;
}

function readEnergy(): EnergyLevel | null {
  try {
    const value = typeof window !== 'undefined' ? localStorage.getItem(todayKey()) : null;
    return value === 'leve' || value === 'normal' || value === 'pesado' ? value : null;
  } catch {
    return null;
  }
}

export interface EnergyCheckInProps {
  dailyGoal: number;
}

export function EnergyCheckIn({ dailyGoal }: EnergyCheckInProps) {
  const [energy, setEnergy] = useState<EnergyLevel | null>(readEnergy);

  const choose = (value: EnergyLevel) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(todayKey(), value);
      }
    } catch {
      // ignore storage errors
    }
    setEnergy(value);
  };

  if (!energy) {
    return (
      <div
        role="region"
        aria-label="Check-in diário de energia e disposição"
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 motion-safe:animate-in motion-safe:fade-in duration-fast"
      >
        <div className="mb-3.5 flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2E8C82]/10 text-[#2E8C82] dark:bg-[#2E8C82]/20 dark:text-[#38b2a6]">
            <BatteryCharging className="h-4 w-4" />
          </span>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            Como está sua energia hoje?
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(Object.keys(OPTIONS) as EnergyLevel[]).map((key) => {
            const opt = OPTIONS[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => choose(key)}
                className="min-h-[56px] flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-center transition-all duration-fast hover:border-[#2E8C82] hover:bg-white hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] focus-visible:ring-offset-2 active:scale-95 touch-manipulation dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-[#2E8C82] dark:hover:bg-slate-800"
              >
                <span className="text-2xl" aria-hidden="true">{opt.emoji}</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const chosen = OPTIONS[energy];
  const suggested = Math.max(1, Math.round(dailyGoal * chosen.factor));

  return (
    <div
      role="region"
      aria-label="Sugestão adaptativa de estudo por energia"
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 motion-safe:animate-in motion-safe:fade-in duration-fast"
    >
      <div className="flex items-center gap-3.5">
        <span className="text-3xl shrink-0 p-1" aria-hidden="true">
          {chosen.emoji}
        </span>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
            {chosen.tip}
          </p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Sugestão pedagógica para hoje:{' '}
            <span className="font-extrabold text-[#2E8C82] dark:text-[#38b2a6]">
              {suggested} {suggested === 1 ? 'questão' : 'questões'}
            </span>
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setEnergy(null)}
        aria-label="Mudar nível de energia selecionado"
        className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8C82] focus-visible:ring-offset-2 active:scale-95 transition-all duration-fast touch-manipulation dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Mudar
      </button>
    </div>
  );
}
