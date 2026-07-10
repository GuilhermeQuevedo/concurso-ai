import { PrismaClient } from '@prisma/client';
import { htmlToPlainText, hasHtml } from '../src/utils/html.js';

const prisma = new PrismaClient();

interface Alternative {
  letter: string;
  text: string;
}

async function main() {
  const BATCH = 500;
  let processed = 0;
  let updated = 0;
  let cursor: string | undefined;

  for (;;) {
    const questions = await prisma.question.findMany({
      take: BATCH,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
      select: { id: true, statement: true, explanation: true, alternatives: true },
    });
    if (questions.length === 0) break;
    cursor = questions[questions.length - 1].id;

    for (const q of questions) {
      processed++;
      const alts = (q.alternatives as unknown as Alternative[]) ?? [];

      const needsFix =
        hasHtml(q.statement) ||
        hasHtml(q.explanation) ||
        alts.some((a) => hasHtml(a.text ?? ''));

      if (!needsFix) continue;

      await prisma.question.update({
        where: { id: q.id },
        data: {
          statement: htmlToPlainText(q.statement),
          explanation: htmlToPlainText(q.explanation),
          alternatives: alts.map((a) => ({ letter: a.letter, text: htmlToPlainText(a.text ?? '') })),
        },
      });
      updated++;
    }

    console.log(`Processadas: ${processed} | Limpas: ${updated}`);
  }

  console.log(`\nConcluído! ${updated} de ${processed} questões tiveram HTML removido.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
