import type { Difficulty, Prisma } from '@prisma/client';

import { prisma } from '../database/prisma.js';

export interface BankFilters {
  examBoardId?: string;
  subjectId?: string;
  examYear?: number;
  organ?: string;
  area?: string;
  position?: string;
  difficulty?: Difficulty;
}

export interface FacetCount<T> {
  value: T;
  count: number;
}

const whereOf = (filters: BankFilters): Prisma.QuestionWhereInput => ({
  source: 'BANK',
  examBoardId: filters.examBoardId,
  subjectId: filters.subjectId,
  examYear: filters.examYear,
  organ: filters.organ,
  area: filters.area,
  position: filters.position,
  difficulty: filters.difficulty,
});

export class QuestionBankRepository {
  count(filters: BankFilters): Promise<number> {
    return prisma.question.count({ where: whereOf(filters) });
  }

  async findIds(filters: BankFilters): Promise<string[]> {
    const rows = await prisma.question.findMany({ where: whereOf(filters), select: { id: true } });
    return rows.map((row) => row.id);
  }

  // Questões deste filtro que o aluno já respondeu (uma consulta só, sem listar ids no IN).
  async answeredIds(userId: string, filters: BankFilters): Promise<Set<string>> {
    const rows = await prisma.questionAttempt.findMany({
      where: { userId, question: whereOf(filters) },
      distinct: ['questionId'],
      select: { questionId: true },
    });
    return new Set(rows.map((row) => row.questionId));
  }

  alternativesOf(ids: string[]) {
    return prisma.question.findMany({ where: { id: { in: ids } }, select: { id: true, alternatives: true } });
  }

  async facets() {
    const where = { source: 'BANK' as const };
    const [boards, years, organs, subjects, areas, positions] = await Promise.all([
      prisma.question.groupBy({ by: ['examBoardId'], where, _count: { _all: true } }),
      prisma.question.groupBy({ by: ['examYear'], where, _count: { _all: true } }),
      prisma.question.groupBy({ by: ['organ'], where, _count: { _all: true } }),
      prisma.question.groupBy({ by: ['subjectId'], where, _count: { _all: true } }),
      prisma.question.groupBy({ by: ['area'], where, _count: { _all: true } }),
      prisma.question.groupBy({ by: ['position'], where, _count: { _all: true } }),
    ]);
    return { boards, years, organs, subjects, areas, positions };
  }

  boardNames(ids: string[]) {
    return prisma.examBoard.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
  }

  subjectNames(ids: string[]) {
    return prisma.subject.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
  }
}
