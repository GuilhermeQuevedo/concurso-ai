import { useMemo, useState } from 'react';
import { Brain, Sparkles } from 'lucide-react';
import {
  REVISION_MODELS,
  HORIZON_DAYS,
  simulateRetention,
  computeMetrics,
} from '@/features/dashboard/utils/memory-curve';
import { ForgettingCurveChart } from '@/features/dashboard/components/ForgettingCurveChart';

export function MemorySimulatorPage() {
  const [modelKey, setModelKey] = useState('padrao');

  const model = REVISION_MODELS.find((m) => m.key === modelKey) ?? REVISION_MODELS[1];
  const points = useMemo(() => simulateRetention(model.intervals), [model]);
  const metrics = useMemo(() => computeMetrics(model.intervals), [model]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
          <Brain className="h-6 w-6 text-primary-600" />
          Simulador de Memória
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Veja como sua memória se comporta pela Curva do Esquecimento de Ebbinghaus e escolha o melhor plano de revisões.
        </p>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {REVISION_MODELS.map((m) => (
          <button
            key={m.key}
            onClick={() => setModelKey(m.key)}
            className={`rounded-xl border p-4 text-left transition-colors ${
              m.key === modelKey
                ? 'border-primary-400 bg-primary-50 dark:border-primary-600 dark:bg-primary-950/40'
                : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900'
            }`}
          >
            <p className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">{m.label}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{m.description}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 lg:col-span-2">
          <ForgettingCurveChart points={points} reviewDays={model.intervals} horizon={HORIZON_DAYS} />
          <p className="mt-2 text-center text-[11px] text-gray-400">
            Retenção (%) ao longo de {HORIZON_DAYS} dias — cada ponto é uma revisão que recupera a memória.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
            <Sparkles className="h-4 w-4 text-primary-600" />
            Cronograma gerado
          </h2>
          <ol className="space-y-1.5">
            {metrics.schedule.map((day, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{i + 1}ª revisão</span>
                <span className="font-semibold text-primary-600 dark:text-primary-400">Dia {day}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MetricBar label="Eficácia de memorização" value={metrics.efficacy} color="bg-green-500" hint="Retenção média no período." />
        <MetricBar label="Esforço / dedicação" value={metrics.effort} color="bg-amber-500" hint="Baseado na quantidade de revisões." />
      </div>

      <p className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
        Dica: o modelo <span className="font-semibold">Padrão</span> usa os mesmos intervalos (1, 3, 7, 15, 40, 60 dias) das
        revisões espaçadas que a plataforma gera nos tópicos do seu edital.
      </p>
    </div>
  );
}

function MetricBar({ label, value, color, hint }: { label: string; value: number; color: string; hint: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-sm font-bold text-gray-900 dark:text-white">{value.toFixed(1)}/10</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value * 10}%` }} />
      </div>
      <p className="mt-1.5 text-[11px] text-gray-400">{hint}</p>
    </div>
  );
}
