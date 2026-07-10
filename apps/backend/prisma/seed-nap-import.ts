import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { htmlToPlainText } from '../src/utils/html.js';

const prisma = new PrismaClient();

interface NapAlternative {
  letra: string;
  texto: string;
  texto_html?: string;
}

interface NapQuestion {
  id: string;
  ano: number;
  banca: string;
  orgao: string;
  prova?: string;
  disciplina: string;
  subtopicos: string[];
  tipo: string;
  alternativas: NapAlternative[] | null;
  gabarito: string;
  texto_principal_rich: string;
  texto_apoio_rich?: string;
  dificuldade: string;
  comentario_rich?: string;
}

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

function mapDifficulty(dif: string): Difficulty {
  const lower = (dif || '').toLowerCase();
  if (lower.includes('fácil') || lower.includes('facil')) return 'EASY';
  if (lower.includes('difícil') || lower.includes('dificil')) return 'HARD';
  return 'MEDIUM';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const filePath = resolve(__dirname, '../../../nap-questoes-all.json');
  console.log(`Reading ${filePath}...`);
  const raw = readFileSync(filePath, 'utf-8');
  const questions: NapQuestion[] = JSON.parse(raw);
  console.log(`Loaded ${questions.length} questions`);

  const subjectCache = new Map<string, string>();
  const examBoardCache = new Map<string, string>();
  const subtopicCache = new Map<string, string>();

  async function getOrCreateSubject(rawName: string): Promise<string> {
    const name = rawName.length > 190 ? rawName.substring(0, 190) : rawName;
    const cached = subjectCache.get(name);
    if (cached) return cached;

    let subject = await prisma.subject.findFirst({ where: { name, parentId: null } });
    if (!subject) {
      subject = await prisma.subject.create({ data: { name } });
      console.log(`  Created subject: ${name}`);
    }
    subjectCache.set(name, subject.id);
    return subject.id;
  }

  async function getOrCreateSubtopic(rawName: string, parentId: string): Promise<string> {
    const name = rawName.length > 190 ? rawName.substring(0, 190) : rawName;
    const key = `${parentId}::${name}`;
    const cached = subtopicCache.get(key);
    if (cached) return cached;

    let sub = await prisma.subject.findFirst({ where: { name, parentId } });
    if (!sub) {
      sub = await prisma.subject.create({ data: { name, parentId } });
    }
    subtopicCache.set(key, sub.id);
    return sub.id;
  }

  function normalizeBancaName(name: string): string {
    return name.replace(/\s*\/\s*/g, '/').trim();
  }

  async function getOrCreateExamBoard(rawName: string): Promise<string> {
    const name = normalizeBancaName(rawName);
    const cached = examBoardCache.get(name);
    if (cached) return cached;

    let slug = slugify(name);
    let board = await prisma.examBoard.findFirst({ where: { name } });
    if (!board) {
      const existingSlug = await prisma.examBoard.findFirst({ where: { slug } });
      if (existingSlug) {
        slug = `${slug}-${Date.now()}`;
      }
      try {
        board = await prisma.examBoard.create({ data: { name, slug } });
        console.log(`  Created exam board: ${name}`);
      } catch {
        board = await prisma.examBoard.findFirst({ where: { slug } });
        if (!board) board = await prisma.examBoard.findFirst({ where: { name } });
        if (!board) throw new Error(`Failed to create exam board: ${name}`);
      }
    }
    examBoardCache.set(name, board.id);
    return board.id;
  }

  const BATCH_SIZE = 200;
  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, i + BATCH_SIZE);
    const createData = [];

    for (const q of batch) {
      if (!q.alternativas || q.alternativas.length === 0 || !q.gabarito) {
        skipped++;
        continue;
      }

      if (!q.texto_principal_rich && !q.disciplina) {
        skipped++;
        continue;
      }

      const parentSubjectId = await getOrCreateSubject(q.disciplina);

      let subjectId = parentSubjectId;
      if (q.subtopicos && q.subtopicos.length > 0) {
        subjectId = await getOrCreateSubtopic(q.subtopicos[0], parentSubjectId);
      }

      const examBoardId = q.banca ? await getOrCreateExamBoard(q.banca) : null;

      const statement = htmlToPlainText(buildStatement(q));
      const alternatives = q.alternativas.map((a) => ({
        letter: a.letra,
        text: htmlToPlainText(a.texto),
      }));

      createData.push({
        statement,
        alternatives,
        correctAnswer: q.gabarito,
        difficulty: mapDifficulty(q.dificuldade),
        explanation: htmlToPlainText(q.comentario_rich || `Gabarito: ${q.gabarito}`),
        comments: buildComments(q),
        subjectId,
        examBoardId,
        source: 'IMPORTED' as const,
        aiModel: null,
      });
    }

    if (createData.length > 0) {
      await prisma.question.createMany({ data: createData });
      imported += createData.length;
    }

    if ((i + BATCH_SIZE) % 2000 === 0 || i + BATCH_SIZE >= questions.length) {
      console.log(`Progress: ${Math.min(i + BATCH_SIZE, questions.length)}/${questions.length} (imported: ${imported}, skipped: ${skipped})`);
    }
  }

  console.log(`\nDone! Imported: ${imported}, Skipped: ${skipped}`);
}

function buildStatement(q: NapQuestion): string {
  const parts: string[] = [];
  if (q.orgao || q.ano) {
    parts.push(`(${[q.orgao, q.banca, q.ano].filter(Boolean).join(' - ')})`);
  }
  if (q.texto_apoio_rich) {
    parts.push(q.texto_apoio_rich);
  }
  parts.push(q.texto_principal_rich || '');
  return parts.join('\n\n');
}

function buildComments(q: NapQuestion): unknown[] {
  const comments: unknown[] = [];
  if (q.subtopicos && q.subtopicos.length > 0) {
    comments.push({ type: 'subtopics', data: q.subtopicos });
  }
  if (q.prova) {
    comments.push({ type: 'exam', data: q.prova });
  }
  if (q.orgao) {
    comments.push({ type: 'org', data: q.orgao });
  }
  return comments;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
