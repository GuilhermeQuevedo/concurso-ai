/*
 * Importa o arquivo nap-questoes-all.json (raiz do repositório) para o banco de questões das bancas (source = BANK).
 *
 *   pnpm --filter @concurso-ai/backend prisma:import-nap [caminho/do/arquivo.json]
 *
 * Idempotente: cada questão é identificada por "nap:<id>" (coluna sourceRef); rodar de novo não duplica.
 * Descarta questões ocultas, sem gabarito, sem alternativas ou com gabarito que não bate com as alternativas.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { PrismaClient } from '@prisma/client';

import { toBankQuestion, type BankQuestionData, type NapQuestion } from '../src/utils/nap-question.js';

const prisma = new PrismaClient();
const BATCH = 500;

const slugOf = (name: string) =>
  name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const boards = new Map<string, string>();
const subjects = new Map<string, string>();

async function boardId(name: string): Promise<string> {
  const slug = slugOf(name) || 'sem-nome';
  const cached = boards.get(slug);
  if (cached) return cached;
  const board =
    (await prisma.examBoard.findUnique({ where: { slug } })) ??
    (await prisma.examBoard.findFirst({ where: { name } })) ??
    (await prisma.examBoard.create({ data: { name, slug } }));
  boards.set(slug, board.id);
  return board.id;
}

async function subjectId(name: string): Promise<string> {
  const cached = subjects.get(name);
  if (cached) return cached;
  const subject = (await prisma.subject.findFirst({ where: { name, parentId: null } })) ?? (await prisma.subject.create({ data: { name } }));
  subjects.set(name, subject.id);
  return subject.id;
}

async function toRow(item: BankQuestionData) {
  return {
    statement: item.statement,
    alternatives: item.alternatives,
    correctAnswer: item.correctAnswer,
    difficulty: item.difficulty,
    explanation: item.explanation,
    comments: [],
    subjectId: await subjectId(item.subject),
    examBoardId: await boardId(item.board),
    source: 'BANK' as const,
    examYear: item.examYear,
    organ: item.organ,
    examName: item.examName,
    position: item.position,
    area: item.area,
    sourceRef: item.sourceRef,
  };
}

async function main(): Promise<void> {
  const file = resolve(process.argv[2] ?? '../../nap-questoes-all.json');
  const raw: NapQuestion[] = JSON.parse(readFileSync(file, 'utf-8'));
  const valid = raw.flatMap((q) => toBankQuestion(q) ?? []);
  console.log(`${raw.length} lidas, ${valid.length} aproveitáveis, ${raw.length - valid.length} descartadas.`);

  let created = 0;
  for (let i = 0; i < valid.length; i += BATCH) {
    const rows = [];
    for (const item of valid.slice(i, i + BATCH)) rows.push(await toRow(item));
    created += (await prisma.question.createMany({ data: rows, skipDuplicates: true })).count;
    // Quem já existia recebe os campos de metadados novos (cargo, área, órgão), sem mexer no resto.
    await prisma.$transaction(
      rows.map((row) =>
        prisma.question.updateMany({
          where: { sourceRef: row.sourceRef },
          data: { organ: row.organ, examName: row.examName, position: row.position, area: row.area, examYear: row.examYear },
        }),
      ),
    );
    console.log(`  ${Math.min(i + BATCH, valid.length)}/${valid.length}`);
  }
  console.log(`Concluído: ${created} novas, ${valid.length - created} já existiam.`);
}

main().finally(() => prisma.$disconnect());
