import type { CurvePoint } from '../utils/memory-curve';

const WIDTH = 700;
const HEIGHT = 300;
const PAD_LEFT = 38;
const PAD_BOTTOM = 26;
const PAD_TOP = 12;
const PAD_RIGHT = 12;

const PLOT_W = WIDTH - PAD_LEFT - PAD_RIGHT;
const PLOT_H = HEIGHT - PAD_TOP - PAD_BOTTOM;

export function ForgettingCurveChart({
  points,
  reviewDays,
  horizon,
}: {
  points: CurvePoint[];
  reviewDays: number[];
  horizon: number;
}) {
  const x = (day: number) => PAD_LEFT + (day / horizon) * PLOT_W;
  const y = (retention: number) => PAD_TOP + (1 - retention / 100) * PLOT_H;

  const path = points.map((p) => `${x(p.day).toFixed(1)},${y(p.retention).toFixed(1)}`).join(' ');
  const area = `${x(0)},${y(0)} ${path} ${x(horizon)},${y(0)}`;

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Curva do esquecimento">
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line x1={PAD_LEFT} y1={y(v)} x2={WIDTH - PAD_RIGHT} y2={y(v)} className="stroke-gray-200 dark:stroke-gray-800" strokeWidth={1} />
          <text x={PAD_LEFT - 6} y={y(v) + 3} textAnchor="end" className="fill-gray-400 text-[10px]">
            {v}%
          </text>
        </g>
      ))}

      {Array.from({ length: horizon / 10 + 1 }, (_, i) => i * 10).map((d) => (
        <text key={d} x={x(d)} y={HEIGHT - 8} textAnchor="middle" className="fill-gray-400 text-[10px]">
          {d}
        </text>
      ))}

      <polygon points={area} className="fill-primary-500/10" />
      <polyline points={path} fill="none" className="stroke-primary-500" strokeWidth={2} strokeLinejoin="round" />

      {reviewDays
        .filter((d) => d <= horizon)
        .map((d) => (
          <circle key={d} cx={x(d)} cy={y(100)} r={3.5} className="fill-primary-600 dark:fill-primary-400" />
        ))}
    </svg>
  );
}
