import fs from 'node:fs/promises';
import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';
import { mimeToDocType } from '../middlewares/upload.js';
import { splitPdfPages, splitPlainText, MAX_FIRST_PART_PAGES } from '../utils/document-parts.js';
import { extractPdfPageTexts } from '../utils/pdf.js';
import { decodeTextBuffer } from '../utils/text-encoding.js';
import { detectDocumentKind, DOCUMENT_KINDS, type DocumentKind } from '../utils/document-kind.js';

interface UploadedFile {
  originalname: string;
  mimetype: string;
  path: string;
  size: number;
}

export class DocumentService {
  async upload(userId: string, file: UploadedFile, subjectId?: string, kind?: DocumentKind, name?: string) {
    if (subjectId) {
      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
      if (!subject) {
        throw new AppError(404, 'SUBJECT_NOT_FOUND', 'Disciplina não encontrada');
      }
    }

    const { content, pageCount, firstPartChars } = await this.extractText(file);
    const docType = mimeToDocType(file.mimetype);
    const suggestedKind = detectDocumentKind(content);
    const finalKind = kind ?? suggestedKind;

    const document = await prisma.document.create({
      data: {
        userId,
        name: name?.trim() || file.originalname,
        type: docType as 'PDF' | 'TXT' | 'HTML' | 'MARKDOWN' | 'DOCX',
        kind: finalKind,
        content,
        pageCount,
        firstPartChars,
        subjectId: subjectId ?? null,
      },
    });

    await fs.unlink(file.path).catch(() => {});

    return { ...document, suggestedKind, kindAutoDetected: !kind, reading: readingInfo(content.length, pageCount, firstPartChars) };
  }

  async updateName(userId: string, id: string, name: string) {
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc || doc.userId !== userId) {
      throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado');
    }
    return prisma.document.update({ where: { id }, data: { name: name.trim() } });
  }

  async updateKind(userId: string, id: string, kind: DocumentKind) {
    if (!DOCUMENT_KINDS.includes(kind)) {
      throw new AppError(400, 'INVALID_KIND', 'Tipo de documento inválido');
    }
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc || doc.userId !== userId) {
      throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado');
    }
    return prisma.document.update({ where: { id }, data: { kind } });
  }

  async list(userId: string, subjectId?: string) {
    return prisma.document.findMany({
      where: { userId, ...(subjectId ? { subjectId } : {}) },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        type: true,
        kind: true,
        subjectId: true,
        createdAt: true,
        content: false,
      },
    });
  }

  async getById(userId: string, id: string) {
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc || doc.userId !== userId) {
      throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado');
    }
    return doc;
  }

  async delete(userId: string, id: string) {
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc || doc.userId !== userId) {
      throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado');
    }
    await prisma.document.delete({ where: { id } });
  }

  async getContentBySubject(userId: string, subjectId: string, maxChars = 8000): Promise<string> {
    const docs = await prisma.document.findMany({
      where: { userId, subjectId },
      orderBy: { createdAt: 'desc' },
      select: { content: true, name: true },
      take: 5,
    });

    if (docs.length === 0) return '';

    let combined = '';
    for (const doc of docs) {
      const chunk = `--- ${doc.name} ---\n${doc.content}\n\n`;
      if (combined.length + chunk.length > maxChars) {
        combined += chunk.slice(0, maxChars - combined.length);
        break;
      }
      combined += chunk;
    }

    return combined;
  }

  private async extractText(file: UploadedFile): Promise<{ content: string; pageCount: number | null; firstPartChars: number | null }> {
    if (file.mimetype === 'application/pdf') {
      const split = splitPdfPages(await extractPdfPageTexts(file.path));
      return { content: split.content, pageCount: split.pageCount, firstPartChars: split.firstPartChars };
    }

    const content = decodeTextBuffer(await fs.readFile(file.path)).trim();
    return { content, pageCount: null, firstPartChars: splitPlainText(content) };
  }
}

export interface ReadingInfo {
  characters: number;
  pageCount: number | null;
  processedPages: number | null;
  processedChars: number;
  // true quando o documento será lido em duas partes (as primeiras páginas agora, o restante em seguida).
  inParts: boolean;
}

function readingInfo(characters: number, pageCount: number | null, firstPartChars: number | null): ReadingInfo {
  const inParts = firstPartChars !== null;
  return {
    characters,
    pageCount,
    processedPages: pageCount === null ? null : inParts ? Math.min(MAX_FIRST_PART_PAGES, pageCount) : pageCount,
    processedChars: firstPartChars ?? characters,
    inParts,
  };
}
