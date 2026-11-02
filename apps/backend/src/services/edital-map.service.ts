import { prisma } from '../database/prisma.js';
import type { Prisma } from '@prisma/client';
import type { IAIProvider, ZionEditalTree, ZionProbabilityItem } from '../interfaces/ai.interfaces.js';
import { extractPdfText } from '../utils/pdf.js';
import { AppError } from '../middlewares/error-handler.js';
import fs from 'node:fs/promises';

export interface TopicCoverage {
  status: 'covered' | 'partial' | 'uncovered';
  matchedDecks: string[];
}

export interface TopicProbability {
  probability: 'alta' | 'media' | 'baixa';
  justification: string;
}

export interface SaveEditalDTO {
  editalName: string;
  banca?: string;
  cargo?: string;
  topicsTree: Prisma.InputJsonValue;
  coverageStatus?: Prisma.InputJsonValue;
  probabilityAnalysis?: Prisma.InputJsonValue;
}

export class EditalMapService {
  constructor(private readonly aiProvider: IAIProvider) {}

  public static normalize(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  public calculateCoverage(
    topicsTree: ZionEditalTree,
    userDecks: Array<{ id: string; name: string; category?: string | null; cardsCount?: number }>,
  ): Record<string, TopicCoverage> {
    const coverageMap: Record<string, TopicCoverage> = {};

    if (!topicsTree || !Array.isArray(topicsTree.subjects)) {
      return coverageMap;
    }

    topicsTree.subjects.forEach((subject) => {
      if (!subject || !Array.isArray(subject.topics)) return;

      subject.topics.forEach((topic) => {
        if (!topic || !topic.name) return;
        const globalKey = `${subject.name}_${topic.name}`;

        const matchedDecks: string[] = [];
        let totalHits = 0;

        const topicTerms = EditalMapService.normalize(topic.name).split(' ');
        const subjectTerms = EditalMapService.normalize(subject.name).split(' ');
        const allKeywords = [...new Set([...topicTerms, ...subjectTerms])].filter((t) => t.length > 3);

        userDecks.forEach((deck) => {
          const deckTitleNom = EditalMapService.normalize(deck.name);
          const deckCatNom = EditalMapService.normalize(deck.category || '');

          let hit = false;
          if (
            deckTitleNom.includes(EditalMapService.normalize(topic.name)) ||
            deckCatNom.includes(EditalMapService.normalize(subject.name))
          ) {
            hit = true;
          } else if (allKeywords.length > 0) {
            const combined = `${deckTitleNom} ${deckCatNom}`;
            const matched = allKeywords.filter((kw) => combined.includes(kw));
            if (matched.length / allKeywords.length >= 0.3) {
              hit = true;
            }
          }

          if (hit) {
            matchedDecks.push(deck.id);
            totalHits += deck.cardsCount ?? 1;
          }
        });

        if (matchedDecks.length === 0) {
          coverageMap[globalKey] = { status: 'uncovered', matchedDecks: [] };
        } else if (totalHits < 10) {
          coverageMap[globalKey] = { status: 'partial', matchedDecks };
        } else {
          coverageMap[globalKey] = { status: 'covered', matchedDecks };
        }
      });
    });

    return coverageMap;
  }

  async mapEdital(
    userId: string,
    filePath: string,
    editalName: string,
    saveToDb = false,
  ) {
    let text = '';
    try {
      text = await extractPdfText(filePath);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Arquivo corrompido ou ilegível';
      throw new AppError(400, 'PDF_EXTRACTION_ERROR', `Falha ao ler o PDF: ${message}`);
    } finally {
      await fs.unlink(filePath).catch(() => {});
    }

    if (text.trim().length < 100) {
      throw new AppError(400, 'INVALID_PDF', 'O PDF enviado parece não conter texto legível suficiente.');
    }

    if (!this.aiProvider.mapEditalZion) {
      throw new AppError(500, 'AI_PROVIDER_ERROR', 'Provedor de IA não suporta mapeamento de edital');
    }

    const topicsTree = await this.aiProvider.mapEditalZion(text);

    const userDecks = await prisma.flashcardDeck.findMany({
      where: { userId },
      include: { cards: true, subject: true },
    });

    const normalizedDecks = userDecks.map((d) => ({
      id: d.id,
      name: d.name,
      category: d.subject?.name || d.topic || '',
      cardsCount: d.cards.length,
    }));

    const coverageMap = this.calculateCoverage(topicsTree, normalizedDecks);

    const editalData = {
      userId,
      editalName,
      banca: topicsTree.banca || 'Não identificada',
      cargo: topicsTree.cargo || 'Não identificado',
      topicsTree: topicsTree as unknown as Prisma.InputJsonValue,
      coverageStatus: coverageMap as unknown as Prisma.InputJsonValue,
    };

    if (!saveToDb) {
      return editalData;
    }

    const saved = await prisma.editalMap.create({
      data: editalData,
    });

    return saved;
  }

  async analyzeProbabilities(userId: string, editalMapId: string, topicsTree: ZionEditalTree, banca: string) {
    if (!this.aiProvider.analyzeProbabilitiesZion) {
      throw new AppError(500, 'AI_PROVIDER_ERROR', 'Provedor de IA não suporta análise de probabilidades');
    }

    const analysisItems: ZionProbabilityItem[] = await this.aiProvider.analyzeProbabilitiesZion(topicsTree, banca);
    const probMap: Record<string, TopicProbability> = {};

    analysisItems.forEach((item: ZionProbabilityItem) => {
      const key = `${item.subjectName}_${item.topicName}`;
      probMap[key] = {
        probability: item.probability,
        justification: item.justification,
      };
    });

    const updated = await prisma.editalMap.update({
      where: { id: editalMapId, userId },
      data: {
        probabilityAnalysis: probMap as unknown as Prisma.InputJsonValue,
      },
    });

    return updated;
  }

  async listEditais(userId: string) {
    return prisma.editalMap.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getEdital(id: string, userId: string) {
    const edital = await prisma.editalMap.findFirst({
      where: { id, userId },
    });
    if (!edital) {
      throw new AppError(404, 'EDITAL_NOT_FOUND', 'Edital não encontrado');
    }
    return edital;
  }

  async saveEdital(userId: string, data: SaveEditalDTO) {
    return prisma.editalMap.create({
      data: {
        userId,
        editalName: data.editalName,
        banca: data.banca,
        cargo: data.cargo,
        topicsTree: data.topicsTree,
        coverageStatus: data.coverageStatus,
        probabilityAnalysis: data.probabilityAnalysis,
      },
    });
  }

  async updateName(id: string, userId: string, editalName: string) {
    return prisma.editalMap.update({
      where: { id, userId },
      data: { editalName },
    });
  }

  async deleteEdital(id: string, userId: string) {
    return prisma.editalMap.delete({
      where: { id, userId },
    });
  }
}
