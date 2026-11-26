import type { CurvePoint } from '../utils/memory-curve';

const WIDTH = 700;
const HEIGHT = 300;
const PAD_LEFT = 42;
const PAD_BOTTOM = 28;
const PAD_TOP = 16;
const PAD_RIGHT = 16;

const PLOT_W = WIDTH - PAD_LEFT - PAD_RIGHT;
const PLOT_H = HEIGHT - PAD_TOP - PAD_BOTTOM;

export interface ForgettingCurveChartProps {
  points: CurvePoint[];
  reviewDays: number[];
  horizon: number;
}

export function ForgettingCurveChart({
  points,
  reviewDays,
  horizon,
}: ForgettingCurveChartProps) {
  // Scale functions mapping days and retention percentages to SVG coordinates
  const scaleX = (day: number): number => PAD_LEFT + (day / horizon) * PLOT_W;
  const scaleY = (retention: number): number => PAD_TOP + (1 - retention / 100) * PLOT_H;

  const path = points.map((p) => `${scaleX(p.day).toFixed(1)},${scaleY(p.retention).toFixed(1)}`).join(' ');
  const area = `${scaleX(0)},${scaleY(0)} ${path} ${scaleX(horizon)},${scaleY(0)}`;

  // Ticks at 0%, 25%, 50%, 75%, 100%
  const yTicks = [0, 25, 50, 75, 100];
  const stepCount = Math.max(1, Math.floor(horizon / 10));
  const xTicks = Array.from({ length: stepCount + 1 }, (_, i) => i * 10);

  return (
    <div className="w-full overflow-hidden rounded-xl bg-white p-2 dark:bg-slate-900/60">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto select-none"
        role="img"
        aria-label="Gráfico da curva do esquecimento de Ebbinghaus mostrando retenção percentual ao longo do tempo"
      >
        <title>Curva do Esquecimento e Revisão Espaçada</title>
        <desc>
          Visualização gráfica demonstrando a queda natural da retenção de memória e a recuperação para 100% a cada ciclo de revisão programado.
        </desc>

        <defs>
          {/* Gradient for area fill under curve - Verde-Revisão Engrama (#2E8C82) */}
          <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2E8C82" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#2E8C82" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines & percentage labels */}
        {yTicks.map((v) => (
          <g key={v} className="transition-colors duration-fast">
            <line
              x1={PAD_LEFT}
              y1={scaleY(v)}
              x2={WIDTH - PAD_RIGHT}
              y2={scaleY(v)}
              className="stroke-slate-200/80 dark:stroke-slate-800/80"
              strokeWidth={1}
              strokeDasharray={v === 0 || v === 100 ? undefined : '3 3'}
            />
            <text
              x={PAD_LEFT - 8}
              y={scaleY(v) + 3.5}
              textAnchor="end"
              className="fill-slate-500 dark:fill-slate-400 font-mono text-[10px] select-none"
            >
              {`${v}%`}
            </text>
          </g>
        ))}

        {/* Vertical day markers */}
        {xTicks.map((d) => (
          <g key={d}>
            <line
              x1={scaleX(d)}
              y1={PAD_TOP}
              x2={scaleX(d)}
              y2={HEIGHT - PAD_BOTTOM}
              className="stroke-slate-100 dark:stroke-slate-800/40"
              strokeWidth={1}
            />
            <text
              x={scaleX(d)}
              y={HEIGHT - 10}
              textAnchor="middle"
              className="fill-slate-500 dark:fill-slate-400 font-mono text-[10px] select-none"
            >
              {`${d}d`}
            </text>
          </g>
        ))}

        {/* Filled retention area under the curve */}
        <polygon points={area} fill="url(#curveGradient)" />

        {/* Main retention curve line - Verde-Revisão (#2E8C82) */}
        <polyline
          points={path}
          fill="none"
          stroke="#2E8C82"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="filter drop-shadow-xs"
        />

        {/* Review recovery milestone markers */}
        {reviewDays
          .filter((d) => d <= horizon)
          .map((d) => (
            <g key={d} className="group cursor-pointer">
              <circle
                cx={scaleX(d)}
                cy={scaleY(100)}
                r={4}
                fill="#2E8C82"
                className="stroke-white dark:stroke-slate-900 stroke-2 filter drop-shadow-xs transition-transform duration-fast hover:scale-125"
              />
            </g>
          ))}
      </svg>
    </div>
  );
}
