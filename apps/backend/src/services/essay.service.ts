import type { Prisma } from '@prisma/client';
import type { IAIProvider } from '../interfaces/ai.interfaces.js';
import type { SubmitEssayDTO } from '../validators/essay.validators.js';
import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';
import { GroupService } from './group.service.js';

const ESSAY_SUBMISSION_POINTS = 1;

interface SubmitParams {
  dto: SubmitEssayDTO;
  file?: { path: string; originalname: string; mimetype: string };
}

export class EssayService {
  private readonly groupService = new GroupService();

  constructor(private readonly aiProvider: IAIProvider) {}

  async submit(userId: string, params: SubmitParams) {
    const { dto, file } = params;

    if (!dto.content && !file) {
      throw new AppError(400, 'MISSING_CONTENT', 'Envie o texto da redação ou um arquivo (PDF/imagem).');
    }

    const essay = await prisma.essay.create({
      data: {
        userId,
        title: dto.title,
        theme: dto.theme,
        content: dto.content ?? '',
        fileUrl: file ? `/uploads/essays/${file.path.split(/[/\\]/).pop()}` : null,
        fileName: file?.originalname ?? null,
        status: 'GRADING',
      },
    });

    try {
      const result = await this.aiProvider.gradeEssay({
        theme: dto.theme,
        content: dto.content,
        filePath: file?.path,
        fileMimeType: file?.mimetype,
      });

      const graded = await prisma.essay.update({
        where: { id: essay.id },
        data: {
          score: result.score,
          feedback: result.feedback,
          criteria: result.criteria as unknown as Prisma.InputJsonValue,
          status: 'GRADED',
        },
      });

      const totalPoints = ESSAY_SUBMISSION_POINTS + Math.round(result.score / 10);
      await this.groupService.recordActivity(
        userId,
        'ESSAY_SUBMITTED',
        `Enviou redação "${dto.title}" — Nota: ${result.score}/${result.maxScore}`,
        totalPoints,
      );

      return { ...graded, competitionPoints: totalPoints };
    } catch (error) {
      await prisma.essay.update({
        where: { id: essay.id },
        data: { status: 'ERROR' },
      });
      throw error;
    }
  }

  async listByUser(userId: string) {
    return prisma.essay.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        theme: true,
        status: true,
        score: true,
        fileName: true,
        createdAt: true,
      },
    });
  }

  async getById(userId: string, essayId: string) {
    const essay = await prisma.essay.findUnique({
      where: { id: essayId },
    });

    if (!essay) {
      throw new AppError(404, 'ESSAY_NOT_FOUND', 'Redação não encontrada');
    }

    if (essay.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'Sem permissão para acessar esta redação');
    }

    return essay;
  }

  async delete(userId: string, essayId: string) {
    const essay = await prisma.essay.findUnique({
      where: { id: essayId },
      select: { userId: true },
    });

    if (!essay) {
      throw new AppError(404, 'ESSAY_NOT_FOUND', 'Redação não encontrada');
    }

    if (essay.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'Sem permissão para excluir esta redação');
    }

    await prisma.essay.delete({ where: { id: essayId } });
  }
}
