import { useState } from 'react';

type Energy = 'leve' | 'normal' | 'pesado';

const OPTIONS: Record<Energy, { emoji: string; label: string; tip: string; factor: number }> = {
  leve: { emoji: '😌', label: 'Leve', tip: 'Hoje tá tranquilo. Vá no seu ritmo, foque em revisões.', factor: 0.6 },
  normal: { emoji: '💪', label: 'Normal', tip: 'Energia boa pra cumprir o planejado.', factor: 1 },
  pesado: { emoji: '😮‍💨', label: 'Pesado', tip: 'Dia difícil. Faça só o essencial — constância vale mais que volume.', factor: 0.4 },
};

function todayKey(): string {
  return `energy-${new Date().toISOString().slice(0, 10)}`;
}

function readEnergy(): Energy | null {
  try {
    const value = localStorage.getItem(todayKey());
    return value === 'leve' || value === 'normal' || value === 'pesado' ? value : null;
  } catch {
    return null;
  }
}

export function EnergyCheckIn({ dailyGoal }: { dailyGoal: number }) {
  const [energy, setEnergy] = useState<Energy | null>(readEnergy);

  const choose = (value: Energy) => {
    try {
      localStorage.setItem(todayKey(), value);
    } catch {
      // ignore storage errors
    }
    setEnergy(value);
  };

  if (!energy) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Como está sua energia hoje?</p>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(OPTIONS) as Energy[]).map((key) => (
            <button
              key={key}
              onClick={() => choose(key)}
              className="flex flex-col items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-3 text-center hover:border-primary-400 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary-600"
            >
              <span className="text-xl">{OPTIONS[key].emoji}</span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{OPTIONS[key].label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const chosen = OPTIONS[energy];
  const suggested = Math.max(1, Math.round(dailyGoal * chosen.factor));

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{chosen.emoji}</span>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {chosen.tip}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Sugestão de hoje: <span className="font-semibold text-primary-600 dark:text-primary-400">{suggested} questões</span>
          </p>
        </div>
      </div>
      <button
        onClick={() => setEnergy(null)}
        className="shrink-0 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        mudar
      </button>
    </div>
  );
}
