/*
 * Importa questões de bancas para o banco de questões (source = BANK).
 *
 *   pnpm --filter backend prisma:import-bank                       -> importa prisma/question-bank-sample.json
 *   pnpm --filter backend prisma:import-bank caminho/do/arquivo.json
 *
 * Idempotente: a mesma questão (banca + ano + órgão + enunciado) não é duplicada.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const itemSchema = z.object({
  board: z.string().min(1),
  subject: z.string().min(1),
  year: z.number().int().min(1990).max(2100),
  organ: z.string().min(1),
  exam: z.string().min(1),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  statement: z.string().min(3),
  alternatives: z.array(z.object({ letter: z.string().min(1).max(2), text: z.string().min(1) })).min(2).max(5),
  answer: z.string().min(1).max(2),
  explanation: z.string().default(''),
});

type BankItem = z.infer<typeof itemSchema>;

const prisma = new PrismaClient();
const slugOf = (name: string) => name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-');

async function boardId(name: string): Promise<string> {
  const board = await prisma.examBoard.upsert({ where: { slug: slugOf(name) }, update: {}, create: { name, slug: slugOf(name) } });
  return board.id;
}

async function subjectId(name: string): Promise<string> {
  const existing = await prisma.subject.findFirst({ where: { name, parentId: null } });
  return existing?.id ?? (await prisma.subject.create({ data: { name } })).id;
}

async function importItem(item: BankItem): Promise<boolean> {
  const examBoardId = await boardId(item.board);
  const duplicate = await prisma.question.findFirst({
    where: { source: 'BANK', examBoardId, examYear: item.year, organ: item.organ, statement: item.statement },
    select: { id: true },
  });
  if (duplicate) return false;
  await prisma.question.create({
    data: {
      statement: item.statement,
      alternatives: item.alternatives,
      correctAnswer: item.answer,
      difficulty: item.difficulty,
      explanation: item.explanation,
      comments: [],
      subjectId: await subjectId(item.subject),
      examBoardId,
      source: 'BANK',
      examYear: item.year,
      organ: item.organ,
      examName: item.exam,
    },
  });
  return true;
}

async function main(): Promise<void> {
  const file = resolve(process.argv[2] ?? 'prisma/question-bank-sample.json');
  const items = z.array(itemSchema).parse(JSON.parse(readFileSync(file, 'utf-8')));
  let created = 0;
  for (const item of items) if (await importItem(item)) created += 1;
  console.log(`${created} questões importadas, ${items.length - created} já existiam (${file}).`);
}

main().finally(() => prisma.$disconnect());
