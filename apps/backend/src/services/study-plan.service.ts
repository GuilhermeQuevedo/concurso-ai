import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';

interface CreatePlanDTO {
  name: string;
  startDate: string;
  endDate: string;
  items: { subjectId: string; dayOfWeek: number; duration: number }[];
}

export class StudyPlanService {
  async create(userId: string, dto: CreatePlanDTO) {
    await prisma.studyPlan.updateMany({
      where: { userId, active: true },
      data: { active: false },
    });

    return prisma.studyPlan.create({
      data: {
        userId,
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        items: {
          create: dto.items.map((item) => ({
            subjectId: item.subjectId,
            dayOfWeek: item.dayOfWeek,
            duration: item.duration,
          })),
        },
      },
      include: { items: { include: { subject: true } } },
    });
  }

  async getActive(userId: string) {
    return prisma.studyPlan.findFirst({
      where: { userId, active: true },
      include: { items: { include: { subject: true } } },
    });
  }

  async list(userId: string) {
    return prisma.studyPlan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { subject: true } } },
    });
  }

  async toggleItemComplete(userId: string, itemId: string) {
    const item = await prisma.studyPlanItem.findUnique({
      where: { id: itemId },
      include: { plan: true },
    });
    if (!item || item.plan.userId !== userId) {
      throw new AppError(404, 'ITEM_NOT_FOUND', 'Item não encontrado');
    }

    return prisma.studyPlanItem.update({
      where: { id: itemId },
      data: { completed: !item.completed },
    });
  }

  async delete(userId: string, planId: string) {
    const plan = await prisma.studyPlan.findUnique({ where: { id: planId } });
    if (!plan || plan.userId !== userId) {
      throw new AppError(404, 'PLAN_NOT_FOUND', 'Plano não encontrado');
    }
    await prisma.studyPlan.delete({ where: { id: planId } });
  }

  async generateSuggestion(userId: string) {
    const subjectAttempts = await prisma.questionAttempt.findMany({
      where: { userId },
      include: { question: { select: { subjectId: true } } },
    });

    const subjectStats: Record<string, { total: number; correct: number }> = {};
    for (const attempt of subjectAttempts) {
      const sid = attempt.question.subjectId;
      if (!subjectStats[sid]) subjectStats[sid] = { total: 0, correct: 0 };
      subjectStats[sid].total++;
      if (attempt.isCorrect) subjectStats[sid].correct++;
    }

    const subjects = await prisma.subject.findMany({
      where: { id: { in: Object.keys(subjectStats) } },
    });

    const ranked = subjects
      .map((s) => ({
        subjectId: s.id,
        name: s.name,
        accuracy: subjectStats[s.id]
          ? Math.round((subjectStats[s.id].correct / subjectStats[s.id].total) * 100)
          : 0,
        total: subjectStats[s.id]?.total ?? 0,
      }))
      .sort((a, b) => a.accuracy - b.accuracy);

    return ranked;
  }
}
