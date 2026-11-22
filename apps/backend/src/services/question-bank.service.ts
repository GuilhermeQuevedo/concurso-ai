import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';
import { QuestionBankRepository, type BankFilters, type FacetCount } from '../repositories/question-bank.repository.js';
import { shuffle } from '../utils/shuffle.js';

export interface BuildBankSetInput extends BankFilters {
  name?: string;
  quantity: number;
  onlyUnanswered?: boolean;
}

type Named = { id: string; name: string };

export interface BankFacets {
  total: number;
  boards: Array<FacetCount<Named>>;
  subjects: Array<FacetCount<Named>>;
  years: Array<FacetCount<number>>;
  organs: Array<FacetCount<string>>;
  areas: Array<FacetCount<string>>;
  positions: Array<FacetCount<string>>;
}

// Há milhares de órgãos: a lista de sugestões traz só os mais frequentes.
const MAX_ORGANS = 300;
const byCountDesc = <T>(a: FacetCount<T>, b: FacetCount<T>) => b.count - a.count;
const nameOf = (list: Named[], id: string) => list.find((item) => item.id === id)?.name ?? '';

const isTrueFalse = (alternatives: unknown): boolean =>
  Array.isArray(alternatives) &&
  alternatives.length === 2 &&
  alternatives.some((item) => typeof item === 'object' && item !== null && (item as { letter?: unknown }).letter === 'C');

function setTypeOf(questions: Array<{ alternatives: unknown }>): 'TRUE_FALSE' | 'MIXED' | 'MULTIPLE_5' {
  const flags = questions.map((q) => isTrueFalse(q.alternatives));
  if (flags.every(Boolean)) return 'TRUE_FALSE';
  return flags.some(Boolean) ? 'MIXED' : 'MULTIPLE_5';
}

export class QuestionBankService {
  constructor(private readonly repository = new QuestionBankRepository()) {}

  count(filters: BankFilters): Promise<number> {
    return this.repository.count(filters);
  }

  async facets(): Promise<BankFacets> {
    const raw = await this.repository.facets();
    const boardIds = raw.boards.flatMap((b) => (b.examBoardId ? [b.examBoardId] : []));
    const [boardNames, subjectNames] = await Promise.all([
      this.repository.boardNames(boardIds),
      this.repository.subjectNames(raw.subjects.map((s) => s.subjectId)),
    ]);

    return {
      total: raw.subjects.reduce((sum, s) => sum + s._count._all, 0),
      boards: raw.boards
        .flatMap((b) => (b.examBoardId ? [{ value: { id: b.examBoardId, name: nameOf(boardNames, b.examBoardId) }, count: b._count._all }] : []))
        .sort(byCountDesc),
      subjects: raw.subjects
        .map((s) => ({ value: { id: s.subjectId, name: nameOf(subjectNames, s.subjectId) }, count: s._count._all }))
        .sort(byCountDesc),
      years: raw.years.flatMap((y) => (y.examYear ? [{ value: y.examYear, count: y._count._all }] : [])).sort((a, b) => b.value - a.value),
      organs: raw.organs.flatMap((o) => (o.organ ? [{ value: o.organ, count: o._count._all }] : [])).sort(byCountDesc).slice(0, MAX_ORGANS),
      areas: raw.areas.flatMap((a) => (a.area ? [{ value: a.area, count: a._count._all }] : [])).sort(byCountDesc),
      positions: raw.positions.flatMap((p) => (p.position ? [{ value: p.position, count: p._count._all }] : [])).sort(byCountDesc).slice(0, MAX_ORGANS),
    };
  }

  // Monta um caderno só com questões já cadastradas (sem IA), priorizando as que o aluno ainda não respondeu.
  async buildSet(userId: string, input: BuildBankSetInput) {
    const { name, quantity, onlyUnanswered, ...filters } = input;
    const [matching, answered] = await Promise.all([this.repository.findIds(filters), this.repository.answeredIds(userId, filters)]);
    const fresh = matching.filter((id) => !answered.has(id));
    if (onlyUnanswered && fresh.length === 0 && matching.length > 0) {
      throw new AppError(400, 'NO_UNANSWERED_QUESTIONS', 'Você já respondeu todas as questões deste filtro.');
    }

    const ordered = onlyUnanswered ? shuffle(fresh) : [...shuffle(fresh), ...shuffle(matching.filter((id) => answered.has(id)))];
    const chosenIds = ordered.slice(0, quantity);
    if (chosenIds.length === 0) {
      throw new AppError(400, 'NO_BANK_QUESTIONS', 'Não há questões das bancas para este filtro.');
    }
    const chosen = await this.repository.alternativesOf(chosenIds);
    const position = new Map(chosenIds.map((id, index) => [id, index]));

    return prisma.questionSet.create({
      data: {
        userId,
        name: name?.trim() || (await this.defaultName(filters)),
        subjectId: filters.subjectId ?? null,
        questionType: setTypeOf(chosen),
        items: { create: chosen.map((q) => ({ questionId: q.id, order: position.get(q.id) ?? 0 })) },
      },
      select: { id: true, name: true },
    });
  }

  private async defaultName(filters: BankFilters): Promise<string> {
    const board = filters.examBoardId ? (await this.repository.boardNames([filters.examBoardId]))[0]?.name : undefined;
    const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return `${board ?? 'Bancas'}${filters.examYear ? ` ${filters.examYear}` : ''} - ${date}`;
  }
}
