import fs from 'node:fs/promises';
import { PDFParse } from 'pdf-parse';
import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';
import { mimeToDocType } from '../middlewares/upload.js';

interface UploadedFile {
  originalname: string;
  mimetype: string;
  path: string;
  size: number;
}

export class DocumentService {
  async upload(userId: string, file: UploadedFile, subjectId?: string) {
    if (subjectId) {
      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
      if (!subject) {
        throw new AppError(404, 'SUBJECT_NOT_FOUND', 'Disciplina não encontrada');
      }
    }

    const content = await this.extractText(file);
    const docType = mimeToDocType(file.mimetype);

    const document = await prisma.document.create({
      data: {
        userId,
        name: file.originalname,
        type: docType as 'PDF' | 'TXT' | 'HTML' | 'MARKDOWN' | 'DOCX',
        content,
        subjectId: subjectId ?? null,
      },
    });

    await fs.unlink(file.path).catch(() => {});

    return document;
  }

  async list(userId: string, subjectId?: string) {
    return prisma.document.findMany({
      where: { userId, ...(subjectId ? { subjectId } : {}) },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        type: true,
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

  async getContentBySubject(subjectId: string, maxChars = 8000): Promise<string> {
    const docs = await prisma.document.findMany({
      where: { subjectId },
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

  private async extractText(file: UploadedFile): Promise<string> {
    if (file.mimetype === 'application/pdf') {
      const data = await fs.readFile(file.path);
      const parser = new PDFParse({ data: new Uint8Array(data) }) as unknown as {
        load(): Promise<void>;
        getText(): Promise<{ text: string }>;
      };
      await parser.load();
      const result = await parser.getText();
      return result.text.trim();
    }

    const buffer = await fs.readFile(file.path);
    return buffer.toString('utf-8').trim();
  }
}
