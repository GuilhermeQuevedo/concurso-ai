import type { Prisma } from '@prisma/client';

import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';
import type { ReorganizeScheduleDTO } from '../dto/schedule-reorganize.dto.js';

interface StoredSchedule {
  title?: string;
  weeks?: unknown;
}

export class StudyScheduleLayoutService {
  async replaceWeeks(id: string, userId: string, input: ReorganizeScheduleDTO) {
    const existing = await prisma.studySchedule.findFirst({ where: { id, userId } });
    if (!existing) throw new AppError(404, 'SCHEDULE_NOT_FOUND', 'Cronograma não encontrado');

    const current = (existing.schedule as StoredSchedule | null) ?? {};
    const next = { ...current, weeks: input.weeks };
    return prisma.studySchedule.update({
      where: { id },
      data: { schedule: next as unknown as Prisma.InputJsonValue },
    });
  }
}
