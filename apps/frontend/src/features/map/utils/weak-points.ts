import type { GraphNode, UserTopicMastery } from '../types/map.types';

export interface WeakPointItem {
  readonly node: GraphNode;
  readonly mastery?: UserTopicMastery;
  readonly masteryScore: number;
  readonly gapScore: number;
  readonly priorityScore: number;
  readonly dueFlashcardsCount: number;
  readonly rank: number;
}

/**
 * Calcula os tópicos mais críticos do aluno ordenados pela fórmula:
 * Prioridade = Incidência na banca × Lacuna de domínio (100 - masteryScore)
 */
export function calculateWeakPoints(
  nodes: readonly GraphNode[],
  overlay: Record<string, UserTopicMastery>,
  limit = 5,
): WeakPointItem[] {
  const scoredItems = nodes
    .filter((node) => node.level !== 'DISCIPLINE') // Foca em tópicos e subtópicos praticáveis
    .map((node) => {
      const mastery = overlay[node.id];
      const masteryScore = mastery ? mastery.masteryScore : 0;
      const gapScore = Math.max(0, 100 - masteryScore);
      const incidence = node.incidenceWeight > 0 ? node.incidenceWeight : 1.0;
      const priorityScore = Number((incidence * gapScore).toFixed(1));
      const dueFlashcardsCount = mastery ? mastery.dueFlashcardsCount : 0;

      return {
        node,
        mastery,
        masteryScore,
        gapScore,
        priorityScore,
        dueFlashcardsCount,
      };
    });

  // Ordena decrescente por prioridade (maior urgência primeiro)
  scoredItems.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    // Desempate por quantidade de flashcards vencidos
    return b.dueFlashcardsCount - a.dueFlashcardsCount;
  });

  return scoredItems.slice(0, limit).map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}
