import type { IAIProvider } from '../interfaces/ai.interfaces.js';
import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';
import { partsOf } from '../utils/document-parts.js';
import { newTopics } from '../utils/syllabus-merge.js';

const CONTINUATION_NOTE = '[CONTINUAÇÃO DO EDITAL: este trecho segue as páginas já analisadas. Extraia só matérias e tópicos que aparecem aqui.]';

// Lê o restante de um edital grande e soma ao edital já criado, sem repetir matérias ou tópicos.
export class EditalContinuationService {
  constructor(private readonly aiProvider: IAIProvider) {}

  // Devolve quantos tópicos novos foram acrescentados.
  async append(userId: string, contestId: string, documentId: string): Promise<number> {
    const [document, contest] = await Promise.all([
      prisma.document.findUnique({ where: { id: documentId } }),
      prisma.contest.findUnique({ where: { id: contestId }, include: { syllabus: { orderBy: { order: 'asc' } } } }),
    ]);
    if (!document || document.userId !== userId || !contest || contest.userId !== userId) {
      throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado');
    }

    const { rest } = partsOf(document.content, document.firstPartChars);
    if (rest.length < 200) return 0;

    const parsed = await this.aiProvider.parseEdital({ content: `${CONTINUATION_NOTE}\n${rest}`, focus: contest.focus ?? undefined });
    const existing = groupByDiscipline(contest.syllabus);
    const added = newTopics(existing, parsed.syllabus);
    if (added.length === 0) return 0;

    const lastOrder = contest.syllabus.reduce((max, item) => Math.max(max, item.order), 0);
    await prisma.contestSyllabusItem.createMany({
      data: added.map((entry, index) => ({ contestId, discipline: entry.discipline, topic: entry.topic, order: lastOrder + index + 1, focus: true })),
    });
    return added.length;
  }
}

function groupByDiscipline(items: ReadonlyArray<{ discipline: string; topic: string }>) {
  const groups = new Map<string, string[]>();
  for (const item of items) groups.set(item.discipline, [...(groups.get(item.discipline) ?? []), item.topic]);
  return [...groups].map(([discipline, topics]) => ({ discipline, topics }));
}
