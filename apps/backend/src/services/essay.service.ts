import type { Prisma } from '@prisma/client';
import type { IAIProvider } from '../interfaces/ai.interfaces.js';
import { extractPdfText } from '../utils/pdf.js';
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
    const isCaseStudy = dto.type === 'ESTUDO_CASO';

    if (!dto.content && !file) {
      throw new AppError(400, 'MISSING_CONTENT', 'Envie o texto da resposta ou um arquivo (PDF/imagem).');
    }
    if (isCaseStudy && !dto.caseStatement?.trim()) {
      throw new AppError(400, 'MISSING_CASE_STATEMENT', 'Informe o enunciado do caso para a correção do estudo de caso.');
    }

    let content = dto.content ?? '';
    if (!content && file && file.mimetype === 'application/pdf') {
      content = await extractPdfText(file.path);
    }

    const essay = await prisma.essay.create({
      data: {
        userId,
        type: dto.type,
        title: dto.title,
        theme: dto.theme,
        content,
        role: dto.role ?? null,
        examBoard: dto.examBoard ?? null,
        caseStatement: dto.caseStatement ?? null,
        answerKey: dto.answerKey ?? null,
        lineLimit: dto.lineLimit ?? null,
        fileUrl: file ? `/uploads/essays/${file.path.split(/[/\\]/).pop()}` : null,
        fileName: file?.originalname ?? null,
        status: 'GRADING',
      },
    });

    try {
      const { score, maxScore, feedback, criteria } = isCaseStudy
        ? await this.gradeCaseStudy(dto, content, file)
        : await this.gradeDissertativa(dto, content, file);

      const graded = await prisma.essay.update({
        where: { id: essay.id },
        data: {
          score,
          maxScore,
          feedback,
          criteria: criteria as unknown as Prisma.InputJsonValue,
          status: 'GRADED',
        },
      });

      const totalPoints = ESSAY_SUBMISSION_POINTS + Math.round((score / maxScore) * 10);
      await this.groupService.recordActivity(
        userId,
        'ESSAY_SUBMITTED',
        `Enviou ${isCaseStudy ? 'estudo de caso' : 'redação'} "${dto.title}" — Nota: ${score}/${maxScore}`,
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

  private async gradeDissertativa(dto: SubmitEssayDTO, content: string, file?: SubmitParams['file']) {
    const result = await this.aiProvider.gradeEssay({
      theme: dto.theme,
      content: content || undefined,
      filePath: file?.path,
      fileMimeType: file?.mimetype,
    });
    return { score: result.score, maxScore: result.maxScore, feedback: result.feedback, criteria: result.criteria };
  }

  private async gradeCaseStudy(dto: SubmitEssayDTO, content: string, file?: SubmitParams['file']) {
    const result = await this.aiProvider.gradeCaseStudy({
      role: dto.role,
      examBoard: dto.examBoard,
      caseStatement: dto.caseStatement ?? dto.theme,
      answerKey: dto.answerKey,
      lineLimit: dto.lineLimit,
      content: content || undefined,
      filePath: file?.path,
      fileMimeType: file?.mimetype,
    });
    // O feedback textual guarda o enquadramento; o restante vai em criteria
    return { score: result.score, maxScore: result.maxScore, feedback: result.framing, criteria: result };
  }

  async listByUser(userId: string) {
    return prisma.essay.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        title: true,
        theme: true,
        status: true,
        score: true,
        maxScore: true,
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
