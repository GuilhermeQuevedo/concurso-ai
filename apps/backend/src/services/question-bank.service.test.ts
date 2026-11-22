import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { prisma } from '../database/prisma.js';
import { QuestionBankService } from './question-bank.service.js';

const TRUE_FALSE = [{ letter: 'C', text: 'Certo' }, { letter: 'E', text: 'Errado' }];
const MULTIPLE = ['A', 'B', 'C', 'D', 'E'].map((letter) => ({ letter, text: `Alternativa ${letter}` }));

describe('QuestionBankService', () => {
  const suffix = `${Date.now()}`;
  const service = new QuestionBankService();
  let userId = '';
  let boardA = '';
  let boardB = '';
  let subjectId = '';
  const questionIds: string[] = [];

  async function addQuestion(examBoardId: string, year: number, alternatives: unknown) {
    const question = await prisma.question.create({
      data: {
        statement: `Enunciado ${suffix} ${questionIds.length}`,
        alternatives: alternatives as object,
        correctAnswer: 'C',
        difficulty: 'EASY',
        explanation: '',
        comments: [],
        subjectId,
        examBoardId,
        source: 'BANK',
        examYear: year,
        organ: `Órgão ${suffix}`,
        area: year === 2023 ? `Área ${suffix}` : 'Outras',
        position: year === 2023 ? `Cargo ${suffix}` : null,
      },
    });
    questionIds.push(question.id);
    return question.id;
  }

  before(async () => {
    userId = (await prisma.user.create({ data: { email: `bank-${suffix}@teste.local`, name: 'Bank' } })).id;
    boardA = (await prisma.examBoard.create({ data: { name: `Banca A ${suffix}`, slug: `banca-a-${suffix}` } })).id;
    boardB = (await prisma.examBoard.create({ data: { name: `Banca B ${suffix}`, slug: `banca-b-${suffix}` } })).id;
    subjectId = (await prisma.subject.create({ data: { name: `Matéria ${suffix}` } })).id;
    await addQuestion(boardA, 2023, TRUE_FALSE);
    await addQuestion(boardA, 2024, TRUE_FALSE);
    await addQuestion(boardB, 2024, MULTIPLE);
  });

  after(async () => {
    await prisma.questionSet.deleteMany({ where: { userId } });
    await prisma.questionAttempt.deleteMany({ where: { userId } });
    await prisma.question.deleteMany({ where: { id: { in: questionIds } } });
    await prisma.examBoard.deleteMany({ where: { id: { in: [boardA, boardB] } } });
    await prisma.subject.deleteMany({ where: { id: subjectId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('conta só questões de banca, respeitando os filtros', async () => {
    assert.equal(await service.count({ examBoardId: boardA }), 2);
    assert.equal(await service.count({ examBoardId: boardA, examYear: 2024 }), 1);
    assert.equal(await service.count({ examBoardId: boardB, examYear: 2023 }), 0);
  });

  it('filtra por área e por cargo', async () => {
    assert.equal(await service.count({ area: `Área ${suffix}` }), 1);
    assert.equal(await service.count({ position: `Cargo ${suffix}`, examBoardId: boardA }), 1);
    assert.equal(await service.count({ area: `Área ${suffix}`, examBoardId: boardB }), 0);
    const facets = await service.facets();
    assert.equal(facets.areas.find((a) => a.value === `Área ${suffix}`)?.count, 1);
  });

  it('monta o caderno sem IA e marca o tipo certo', async () => {
    const certoErrado = await service.buildSet(userId, { examBoardId: boardA, quantity: 10 });
    const items = await prisma.questionSetItem.count({ where: { setId: certoErrado.id } });
    assert.equal(items, 2);
    assert.equal((await prisma.questionSet.findUniqueOrThrow({ where: { id: certoErrado.id } })).questionType, 'TRUE_FALSE');

    const multipla = await service.buildSet(userId, { examBoardId: boardB, quantity: 10 });
    assert.equal((await prisma.questionSet.findUniqueOrThrow({ where: { id: multipla.id } })).questionType, 'MULTIPLE_5');
  });

  it('respeita a quantidade pedida', async () => {
    const set = await service.buildSet(userId, { examBoardId: boardA, quantity: 1 });
    assert.equal(await prisma.questionSetItem.count({ where: { setId: set.id } }), 1);
  });

  it('com "só não respondidas", pula as que o aluno já respondeu e avisa quando acabam', async () => {
    const [first, second] = await prisma.question.findMany({ where: { examBoardId: boardA }, select: { id: true } });
    await prisma.questionAttempt.create({ data: { userId, questionId: first.id, answer: 'C', isCorrect: true, timeSpent: 5 } });

    const set = await service.buildSet(userId, { examBoardId: boardA, quantity: 10, onlyUnanswered: true });
    const chosen = await prisma.questionSetItem.findMany({ where: { setId: set.id } });
    assert.deepEqual(chosen.map((i) => i.questionId), [second.id]);

    await prisma.questionAttempt.create({ data: { userId, questionId: second.id, answer: 'C', isCorrect: true, timeSpent: 5 } });
    await assert.rejects(() => service.buildSet(userId, { examBoardId: boardA, quantity: 10, onlyUnanswered: true }), /já respondeu/);
  });

  it('sem questões no filtro, não cria caderno vazio', async () => {
    await assert.rejects(() => service.buildSet(userId, { examBoardId: boardB, examYear: 2023, quantity: 5 }), /Não há questões/);
  });

  it('lista as bancas, anos e órgãos disponíveis com contagem', async () => {
    const facets = await service.facets();
    assert.equal(facets.boards.find((b) => b.value.id === boardA)?.count, 2);
    assert.ok(facets.years.some((y) => y.value === 2024));
    assert.ok(facets.organs.length <= 300, 'a lista de órgãos é limitada aos mais frequentes');
    assert.ok(facets.organs.every((o, i, list) => i === 0 || list[i - 1].count >= o.count));
  });
});
