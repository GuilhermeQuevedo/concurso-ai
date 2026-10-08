export interface RevisionModel {
  key: string;
  label: string;
  description: string;
  intervals: number[];
}

export const REVISION_MODELS: RevisionModel[] = [
  {
    key: 'intensivo',
    label: 'Intensivo',
    description: 'Mais revisões, retenção máxima. Exige mais tempo por tópico.',
    intervals: [1, 2, 4, 7, 12, 20, 30, 45],
  },
  {
    key: 'padrao',
    label: 'Padrão',
    description: 'Equilíbrio entre retenção e esforço. Recomendado para a maioria.',
    intervals: [1, 3, 7, 15, 40, 60],
  },
  {
    key: 'leve',
    label: 'Leve',
    description: 'Poucas revisões. Bom quando há muitos tópicos e pouco tempo.',
    intervals: [3, 10, 25, 50],
  },
];

export const HORIZON_DAYS = 70;

const BASE_STRENGTH = 1.8;
const GROWTH = 1.9;

export interface CurvePoint {
  day: number;
  retention: number;
}

export function simulateRetention(intervals: number[], horizon = HORIZON_DAYS): CurvePoint[] {
  const reviewSet = new Set(intervals.filter((d) => d > 0 && d <= horizon));
  const points: CurvePoint[] = [{ day: 0, retention: 100 }];
  let strength = BASE_STRENGTH;
  let lastReview = 0;

  for (let day = 1; day <= horizon; day++) {
    const decayed = 100 * Math.exp(-(day - lastReview) / strength);
    points.push({ day, retention: decayed });
    if (reviewSet.has(day)) {
      strength *= GROWTH;
      lastReview = day;
      points.push({ day, retention: 100 });
    }
  }
  return points;
}

export interface ModelMetrics {
  efficacy: number;
  effort: number;
  schedule: number[];
}

export function computeMetrics(intervals: number[], horizon = HORIZON_DAYS): ModelMetrics {
  const reviewSet = new Set(intervals.filter((d) => d > 0 && d <= horizon));
  let strength = BASE_STRENGTH;
  let lastReview = 0;
  let sum = 100;

  for (let day = 1; day <= horizon; day++) {
    if (reviewSet.has(day)) {
      strength *= GROWTH;
      lastReview = day;
      sum += 100;
    } else {
      sum += 100 * Math.exp(-(day - lastReview) / strength);
    }
  }

  const efficacy = Math.round((sum / (horizon + 1)) / 10 * 10) / 10;
  const effort = Math.min(10, Math.round(reviewSet.size * 1.3 * 10) / 10);
  return { efficacy, effort, schedule: intervals.filter((d) => d <= horizon) };
}
