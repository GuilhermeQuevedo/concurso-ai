import type { IAIProvider } from '../interfaces/ai.interfaces.js';
import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';
import { parseFlashcardText } from '../utils/flashcard-parser.js';
import { estimateRetention } from '../utils/retention.js';
import { shuffle } from '../utils/shuffle.js';

const FALLBACK_SUBJECT = 'Geral';
const DEFAULT_COLOR = '#3b82f6';
const MIN_CONTENT_CHARS = 50;
const MIN_AUTO_CARDS = 6;
const MAX_AUTO_CARDS = 20;
const MAX_GENERATED_CARDS = 30;
const CHARS_PER_CARD = 600;
const STUDY_BATCH = 50;
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

interface CardInput {
  front: string;
  back: string;
}

interface DeckInput {
  name: string;
  subjectName?: string;
  topic?: string;
  color?: string;
}

interface GenerateDeckInput extends DeckInput {
  text?: string;
  documentId?: string;
  count?: number;
}

export class FlashcardDeckService {
  constructor(private readonly aiProvider: IAIProvider) {}

  async list(userId: string) {
    await this.adoptOrphanCards(userId);
    const [decks, cards] = await Promise.all([
      prisma.flashcardDeck.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { subject: { select: { id: true, name: true } } },
      }),
      prisma.flashcard.findMany({
        where: { userId, deckId: { not: null } },
        select: { deckId: true, repetition: true, interval: true, easeFactor: true, nextReview: true },
      }),
    ]);

    const now = Date.now();
    return decks.map((deck) => {
      const own = cards.filter((c) => c.deckId === deck.id);
      const due = own.filter((c) => c.nextReview.getTime() <= now).length;
      const confidence = own.length
        ? Math.round(
            (own.reduce((sum, c) => sum + (c.repetition === 0 ? 0 : estimateRetention(c, now)), 0) / own.length) * 100,
          )
        : 0;
      const next = own.length ? Math.min(...own.map((c) => c.nextReview.getTime())) : null;
      return {
        id: deck.id,
        name: deck.name,
        topic: deck.topic,
        color: deck.color,
        subject: deck.subject,
        total: own.length,
        due,
        confidence,
        nextReview: next ? new Date(next) : null,
        createdAt: deck.createdAt,
      };
    });
  }

  async create(userId: string, dto: DeckInput & { cards: CardInput[] }) {
    const subject = await this.resolveSubject(dto.subjectName);
    return prisma.flashcardDeck.create({
      data: {
        ...this.deckData(userId, dto, subject.id),
        cards: { create: dto.cards.map((c) => ({ userId, subjectId: subject.id, front: c.front, back: c.back })) },
      },
      select: { id: true, name: true },
    });
  }

  async generate(userId: string, dto: GenerateDeckInput) {
    const subject = await this.resolveSubject(dto.subjectName);
    const { content, source } = await this.loadContent(userId, dto);
    if (content.length < MIN_CONTENT_CHARS) {
      throw new AppError(400, 'CONTENT_TOO_SHORT', 'Envie um texto ou PDF com conteúdo suficiente para gerar flashcards.');
    }

    const count = Math.min(
      MAX_GENERATED_CARDS,
      dto.count ?? Math.min(MAX_AUTO_CARDS, Math.max(MIN_AUTO_CARDS, Math.round(content.length / CHARS_PER_CARD))),
    );
    const generated = await this.aiProvider.generateFlashcards({ content, subject: subject.name, count });

    return prisma.flashcardDeck.create({
      data: {
        ...this.deckData(userId, dto, subject.id),
        cards: {
          create: generated.map((c) => ({ userId, subjectId: subject.id, front: c.front, back: c.back, source })),
        },
      },
      select: { id: true, name: true },
    });
  }

  async update(userId: string, id: string, dto: DeckInput) {
    await this.ownedDeck(userId, id);
    const subject = await this.resolveSubject(dto.subjectName);
    return prisma.flashcardDeck.update({
      where: { id },
      data: { name: dto.name.trim(), topic: dto.topic?.trim() || null, color: dto.color ?? DEFAULT_COLOR, subjectId: subject.id },
      select: { id: true, name: true },
    });
  }

  async remove(userId: string, id: string) {
    await this.ownedDeck(userId, id);
    await prisma.flashcardDeck.delete({ where: { id } });
  }

  async cards(userId: string, deckId: string) {
    await this.ownedDeck(userId, deckId);
    return prisma.flashcard.findMany({ where: { deckId }, orderBy: { createdAt: 'asc' } });
  }

  async addCard(userId: string, deckId: string, card: CardInput) {
    const deck = await this.ownedDeck(userId, deckId);
    const subject = await this.resolveSubject(undefined, deck.subjectId);
    return prisma.flashcard.create({ data: { userId, deckId, subjectId: subject.id, front: card.front, back: card.back } });
  }

  async updateCard(userId: string, cardId: string, card: CardInput) {
    const existing = await prisma.flashcard.findUnique({ where: { id: cardId }, select: { userId: true } });
    if (!existing || existing.userId !== userId) throw new AppError(404, 'CARD_NOT_FOUND', 'Flashcard não encontrado');
    return prisma.flashcard.update({ where: { id: cardId }, data: { front: card.front, back: card.back } });
  }

  async importCards(userId: string, deckId: string, text: string) {
    const deck = await this.ownedDeck(userId, deckId);
    const { cards, skipped } = parseFlashcardText(text);
    if (cards.length === 0) {
      throw new AppError(400, 'NO_CARDS_FOUND', 'Nenhum flashcard reconhecido. Use "frente" e "verso" separados por tab, ponto e vírgula ou vírgula.');
    }
    const subject = await this.resolveSubject(undefined, deck.subjectId);
    await prisma.flashcard.createMany({
      data: cards.map((c) => ({ userId, deckId, subjectId: subject.id, front: c.front, back: c.back })),
    });
    return { imported: cards.length, skipped };
  }

  async study(userId: string, deckId: string, all: boolean) {
    await this.ownedDeck(userId, deckId);
    const cards = await prisma.flashcard.findMany({
      where: { deckId, ...(all ? {} : { nextReview: { lte: new Date() } }) },
      orderBy: { nextReview: 'asc' },
      take: STUDY_BATCH,
      include: { subject: true },
    });
    // Embaralha para evitar o efeito de posição serial (primazia/recência)
    return shuffle(cards);
  }

  private deckData(userId: string, dto: DeckInput, subjectId: string) {
    return {
      userId,
      subjectId,
      name: dto.name.trim(),
      topic: dto.topic?.trim() || null,
      color: dto.color ?? DEFAULT_COLOR,
    };
  }

  private async loadContent(userId: string, dto: GenerateDeckInput): Promise<{ content: string; source: string | null }> {
    const text = dto.text?.trim();
    if (text) return { content: text, source: null };
    if (!dto.documentId) return { content: '', source: null };
    const doc = await prisma.document.findUnique({ where: { id: dto.documentId } });
    if (!doc || doc.userId !== userId) throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado');
    return { content: doc.content, source: doc.name };
  }

  private async ownedDeck(userId: string, id: string) {
    const deck = await prisma.flashcardDeck.findUnique({ where: { id } });
    if (!deck || deck.userId !== userId) throw new AppError(404, 'DECK_NOT_FOUND', 'Deck não encontrado');
    return deck;
  }

  // Matéria digitada ou escolhida; sem ela, usa (ou cria) "Geral"
  private async resolveSubject(name?: string, fallbackId?: string | null) {
    const trimmed = name?.trim();
    if (!trimmed && fallbackId) {
      const known = await prisma.subject.findUnique({ where: { id: fallbackId } });
      if (known) return known;
    }
    const wanted = trimmed || FALLBACK_SUBJECT;
    const existing = await prisma.subject.findFirst({ where: { name: wanted } });
    return existing ?? prisma.subject.create({ data: { name: wanted } });
  }

  // Cartões antigos (sem deck) viram um deck por matéria, uma única vez
  private async adoptOrphanCards(userId: string) {
    const groups = await prisma.flashcard.groupBy({ by: ['subjectId'], where: { userId, deckId: null } });
    for (const group of groups) {
      const subject = await prisma.subject.findUnique({ where: { id: group.subjectId } });
      const deck = await prisma.flashcardDeck.create({
        data: {
          userId,
          subjectId: group.subjectId,
          name: subject?.name ?? FALLBACK_SUBJECT,
          color: COLORS[Math.abs(this.hash(group.subjectId)) % COLORS.length],
        },
      });
      await prisma.flashcard.updateMany({ where: { userId, deckId: null, subjectId: group.subjectId }, data: { deckId: deck.id } });
    }
  }

  private hash(key: string): number {
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
    return h;
  }
}
