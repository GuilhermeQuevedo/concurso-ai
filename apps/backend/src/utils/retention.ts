const DAY_MS = 86400000;

export interface RetentionCard {
  interval: number;
  easeFactor: number;
  nextReview: Date;
}

// Curva do esquecimento: a retenção estimada cai exponencialmente desde a última revisão
export function estimateRetention(card: RetentionCard, now = Date.now()): number {
  const lastReview = card.nextReview.getTime() - card.interval * DAY_MS;
  const elapsedDays = Math.max(0, (now - lastReview) / DAY_MS);
  const stability = Math.max(1, card.interval * card.easeFactor);
  return Math.min(1, Math.max(0, Math.exp(-elapsedDays / stability)));
}
