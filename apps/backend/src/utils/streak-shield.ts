export const SHIELD_EVERY_DAYS = 7;
export const MAX_SHIELDS = 2;

export interface StreakState {
  current: number;
  longest: number;
  shields: number;
}

export interface StreakStep extends StreakState {
  // Dias perdidos que foram cobertos por escudos nesta atualização.
  coveredDays: number;
}

// Estudou hoje; "missedDays" são os dias sem estudo entre a última atividade e hoje.
// Cada escudo cobre um dia perdido. Sem escudos suficientes a sequência recomeça (os escudos ficam).
export function advanceStreak(state: StreakState, missedDays: number): StreakStep {
  const covered = missedDays > 0 && state.shields >= missedDays;
  const broken = missedDays > 0 && !covered;
  const current = broken ? 1 : state.current + 1;
  let shields = covered ? state.shields - missedDays : state.shields;
  if (!broken && current % SHIELD_EVERY_DAYS === 0) shields = Math.min(MAX_SHIELDS, shields + 1);
  return {
    current,
    longest: Math.max(state.longest, current),
    shields,
    coveredDays: covered ? missedDays : 0,
  };
}

// Valor mostrado na tela: a sequência só segue "viva" se hoje ainda dá para cobrir os dias perdidos.
export function displayedStreak(state: StreakState, daysSinceLast: number): number {
  const missed = daysSinceLast - 1;
  if (missed <= 0 || state.shields >= missed) return state.current;
  return 0;
}
