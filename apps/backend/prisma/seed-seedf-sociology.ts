import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const prisma = new PrismaClient();

interface SeedQuestion {
  number: number;
  statement: string;
  correctAnswer: string;
  subject: string;
}

const EXAM_INFO = {
  board: { name: 'Quadrix', slug: 'quadrix' },
  exam: 'SEEDF PSS 2021',
  type: 'Tipo C',
  cargo: 'Professor de Educação Básica — Sociologia (Cargo 464)',
};

const CERTO_ERRADO_ALTERNATIVES = JSON.stringify([
  { letter: 'C', text: 'Certo' },
  { letter: 'E', text: 'Errado' },
]);

function loadQuestions(): SeedQuestion[] {
  const raw = readFileSync(
    join(__dirname, 'seedf-sociology-data.json'),
    'utf-8',
  );
  return JSON.parse(raw);
}

function mapDifficulty(
  subject: string,
): 'EASY' | 'MEDIUM' | 'HARD' {
  const hard = [
    'Constituição do Saber Sociológico',
    'Cultura e Sociedade',
    'Juventude e Socialização',
  ];
  const easy = ['Informática', 'Conhecimentos sobre o DF'];
  if (hard.includes(subject)) return 'HARD';
  if (easy.includes(subject)) return 'EASY';
  return 'MEDIUM';
}

async function ensureBoard() {
  return prisma.examBoard.upsert({
    where: { slug: EXAM_INFO.board.slug },
    update: {},
    create: EXAM_INFO.board,
  });
}

async function ensureSubjects(names: string[]) {
  const sociologia = await prisma.subject.upsert({
    where: { id: 'sociologia-seedf' },
    update: {},
    create: { id: 'sociologia-seedf', name: 'Sociologia (SEEDF)' },
  });

  const map = new Map<string, string>();

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const id = `seedf-${name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}`;

    const sub = await prisma.subject.upsert({
      where: { id },
      update: {},
      create: {
        id,
        name,
        parentId: sociologia.id,
        order: i,
      },
    });
    map.set(name, sub.id);
  }

  return map;
}

function buildExplanation(q: SeedQuestion): string {
  const label = q.correctAnswer === 'C' ? 'CERTO' : 'ERRADO';
  return `Gabarito oficial: ${label}. Prova: ${EXAM_INFO.exam} (${EXAM_INFO.type}), item ${q.number}. ${EXAM_INFO.cargo}.`;
}

async function seedQuestions(
  questions: SeedQuestion[],
  boardId: string,
  subjectMap: Map<string, string>,
) {
  let created = 0;

  for (const q of questions) {
    const subjectId = subjectMap.get(q.subject);
    if (!subjectId) {
      console.warn(`Subject not found: ${q.subject}`);
      continue;
    }

    await prisma.question.create({
      data: {
        statement: q.statement,
        alternatives: JSON.parse(CERTO_ERRADO_ALTERNATIVES),
        correctAnswer: q.correctAnswer,
        difficulty: mapDifficulty(q.subject),
        explanation: buildExplanation(q),
        comments: JSON.parse('{}'),
        subjectId,
        examBoardId: boardId,
        source: 'IMPORTED',
      },
    });
    created++;
  }

  return created;
}

async function main() {
  console.log('Seeding SEEDF Sociology exam questions...');

  const questions = loadQuestions();
  console.log(`Loaded ${questions.length} questions from JSON`);

  const board = await ensureBoard();
  console.log(`Board: ${board.name} (${board.id})`);

  const subjectNames = [...new Set(questions.map((q) => q.subject))];
  const subjectMap = await ensureSubjects(subjectNames);
  console.log(`Subjects: ${subjectMap.size} created/verified`);

  const created = await seedQuestions(questions, board.id, subjectMap);
  console.log(`Questions created: ${created}`);
  console.log('SEEDF Sociology seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
