import { prisma } from '../database/prisma.js';
import type { Prisma } from '@prisma/client';
import type { IAIProvider, ZionScheduleWeek, ZionScheduleDay } from '../interfaces/ai.interfaces.js';
import { extractPdfText } from '../utils/pdf.js';
import { AppError } from '../middlewares/error-handler.js';
import fs from 'node:fs/promises';
import { formatAvailabilityForPrompt, type ScheduleAvailability } from '../dto/schedule-availability.dto.js';

export interface GenerateScheduleDTO {
  examDate: string;
  dailyHours: number;
  subjects: string[];
  userObservations?: string;
  availability?: ScheduleAvailability;
  forceRefresh?: boolean;
  saveToDb?: boolean;
  contestId?: string | null;
}

export interface SaveScheduleDTO {
  examDate?: string;
  exam_date?: string;
  dailyHours?: number;
  daily_hours?: number;
  subjects: Prisma.InputJsonValue;
  schedule: Prisma.InputJsonValue;
  hasPerformanceData?: boolean;
  has_performance_data?: boolean;
  contestId?: string | null;
}

interface ParsedScheduleJSON {
  title?: string;
  weeks?: Array<{
    days?: Array<{
      completed?: boolean;
    }>;
  }>;
}

export class StudyScheduleService {
  constructor(private readonly aiProvider: IAIProvider) {}

  private async fetchUserPerformance(userId: string): Promise<Record<string, number> | null> {
    const attempts = await prisma.questionAttempt.findMany({
      where: { userId },
      include: { question: { include: { subject: true } } },
    });

    if (!attempts || attempts.length === 0) return null;

    const catStats: Record<string, { total: number; correct: number }> = {};

    attempts.forEach((att) => {
      const cat = att.question?.subject?.name || 'Geral';
      if (!catStats[cat]) catStats[cat] = { total: 0, correct: 0 };
      catStats[cat].total += 1;
      if (att.isCorrect) catStats[cat].correct += 1;
    });

    const result: Record<string, number> = {};
    Object.keys(catStats).forEach((cat) => {
      if (catStats[cat].total > 0) {
        result[cat] = Math.round((catStats[cat].correct / catStats[cat].total) * 100);
      }
    });

    return Object.keys(result).length > 0 ? result : null;
  }

  private async fetchEditalProbabilities(userId: string): Promise<Record<string, string> | null> {
    const editais = await prisma.editalMap.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    for (const edital of editais) {
      if (edital.probabilityAnalysis && typeof edital.probabilityAnalysis === 'object') {
        const raw = edital.probabilityAnalysis as Record<string, { probability?: string }>;
        const result: Record<string, string> = {};
        for (const [key, val] of Object.entries(raw)) {
          if (val && typeof val === 'object' && val.probability) {
            result[key] = val.probability;
          }
        }
        if (Object.keys(result).length > 0) {
          return result;
        }
      }
    }
    return null;
  }

  public expandWeekTemplate(
    baseWeekTemplate: ZionScheduleWeek,
    examDate: string,
    dailyHours: number,
  ): ZionScheduleWeek[] {
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const cleanDateStr = String(examDate).split('T')[0].trim();
    let target = new Date(`${cleanDateStr}T12:00:00Z`);
    if (isNaN(target.getTime())) {
      target = new Date(today);
      target.setDate(target.getDate() + 90);
    }

    const diffMs = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 3600 * 24));

    // Se a data já passou ou for hoje, garante um ciclo estruturado de 8 semanas
    const weeksCount = diffDays <= 0 ? 8 : Math.max(1, Math.ceil(diffDays / 7));

    const dayNames = [
      'Domingo',
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado',
    ];

    const fullWeeks: ZionScheduleWeek[] = [];
    const currentDate = new Date(today);

    for (let w = 1; w <= weeksCount; w++) {
      let currentPhase: 'base' | 'intensification' | 'revision' = 'base';
      const baseThreshold = Math.ceil(weeksCount * 0.5);
      const intensificationThreshold = Math.ceil(weeksCount * 0.8);

      let theme = `Ciclo Base — Fundamentação Teórica (Semana ${w} de ${weeksCount})`;

      if (w > intensificationThreshold) {
        currentPhase = 'revision';
        theme = `Reta Final — Revisão Global e Simulados (Semana ${w} de ${weeksCount})`;
      } else if (w > baseThreshold) {
        currentPhase = 'intensification';
        theme = `Intensificação — Questões e Pontos Críticos (Semana ${w} de ${weeksCount})`;
      }

      const isRevisionPhase = currentPhase === 'revision';
      const isIntensificationPhase = currentPhase === 'intensification';

      const clonedDays: ZionScheduleDay[] = (baseWeekTemplate.days || []).map((dayData, dayIdx) => {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayOfWeek = dayNames[currentDate.getDay()];
        currentDate.setDate(currentDate.getDate() + 1);

        const blocks = (dayData.blocks || []).map((b, bIdx) => {
          let blockType: 'estudo' | 'revisao' | 'questoes' | 'descanso' = b.type || 'estudo';
          let notes = b.hours > 0 ? `Pomodoro: ${Math.ceil(b.hours * 2)} ciclos de 25m` : null;

          if (isRevisionPhase && blockType === 'estudo') {
            blockType = 'revisao';
            notes = `Revisão Ativa & Flashcards: ${Math.ceil(b.hours * 2)} ciclos Pomodoro`;
          } else if (isIntensificationPhase && bIdx === 0 && blockType === 'estudo') {
            notes = `Aprofundamento & Questões Comentadas: ${Math.ceil(b.hours * 2)} ciclos Pomodoro`;
          }

          return {
            order: bIdx + 1,
            subject: b.subject || 'Descanso/Simulado',
            type: blockType,
            hours: b.hours,
            priority: b.priority || 'normal',
            revisionNumber: b.revision || null,
            cardTarget: 10,
            notes,
          };
        });

        let dayType: 'estudo' | 'revisao' | 'simulado' | 'descanso' | 'questoes' = 'estudo';
        if (isRevisionPhase && dayData.type === 'estudo') {
          dayType = 'revisao';
        } else if (isIntensificationPhase && dayIdx === 5 && dayData.type !== 'descanso') {
          dayType = 'simulado';
        } else if (
          dayData.type === 'estudo' ||
          dayData.type === 'revisao' ||
          dayData.type === 'simulado' ||
          dayData.type === 'descanso' ||
          dayData.type === 'questoes'
        ) {
          dayType = dayData.type;
        }

        return {
          date: dateStr,
          dayOfWeek,
          type: dayType,
          totalHours: dayData.totalHours || dailyHours,
          blocks,
          completed: false,
        };
      });

      while (clonedDays.length < 7) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayOfWeek = dayNames[currentDate.getDay()];
        currentDate.setDate(currentDate.getDate() + 1);
        clonedDays.push({
          date: dateStr,
          dayOfWeek,
          type: 'descanso',
          totalHours: dailyHours,
          blocks: [
            {
              order: 1,
              subject: 'Estudo Livre',
              type: 'estudo',
              hours: dailyHours,
              priority: 'normal',
              cardTarget: 10,
              notes: null,
            },
          ],
          completed: false,
        });
      }

      fullWeeks.push({
        weekNumber: w,
        phase: currentPhase,
        theme,
        days: clonedDays,
      });
    }

    return fullWeeks;
  }

  async generateSchedule(
    userId: string,
    dto: GenerateScheduleDTO,
    filePath?: string,
  ) {
    if (!dto.forceRefresh) {
      const existing = await prisma.studySchedule.findFirst({
        where: {
          userId,
          examDate: dto.examDate,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existing) {
        return existing;
      }
    }

    let editalFileText: string | null = null;
    if (filePath) {
      try {
        editalFileText = await extractPdfText(filePath);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Falha ao extrair texto do PDF';
        console.warn('PDF text extraction error for schedule:', msg);
      } finally {
        await fs.unlink(filePath).catch(() => {});
      }
    }

    const performanceData = await this.fetchUserPerformance(userId);
    const probabilityData = await this.fetchEditalProbabilities(userId);

    const latestEdital = await prisma.editalMap.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    const banca = latestEdital?.banca || null;

    if (!this.aiProvider.generateScheduleZion) {
      throw new AppError(500, 'AI_PROVIDER_ERROR', 'Provedor de IA não suporta geração de cronograma');
    }

    const aiResult = await this.aiProvider.generateScheduleZion({
      subjects: dto.subjects,
      examDate: dto.examDate,
      dailyHours: dto.dailyHours,
      performanceData,
      probabilityData,
      editalFileText,
      banca,
      userObservations: dto.userObservations,
      availability: dto.availability ? formatAvailabilityForPrompt(dto.availability) : null,
    });

    if (!aiResult || !aiResult.weeks || aiResult.weeks.length === 0) {
      throw new AppError(502, 'AI_EMPTY_RESPONSE', 'Falha na geração do modelo base pela IA');
    }

    const baseWeekTemplate = aiResult.weeks[0];
    const fullWeeks = this.expandWeekTemplate(baseWeekTemplate, dto.examDate, dto.dailyHours);

    const derivedSubjects: string[] = [...dto.subjects];
    if (derivedSubjects.length === 0 && baseWeekTemplate?.days) {
      const set = new Set<string>();
      for (const d of baseWeekTemplate.days) {
        for (const b of d.blocks || []) {
          if (
            b.subject &&
            b.subject !== 'Descanso' &&
            b.subject !== 'Simulado' &&
            b.subject !== 'Descanso/Simulado' &&
            b.subject !== 'Estudo Livre'
          ) {
            set.add(b.subject);
          }
        }
      }
      derivedSubjects.push(...Array.from(set));
    }

    const scheduleData = {
      userId,
      examDate: dto.examDate,
      dailyHours: dto.dailyHours,
      subjects: derivedSubjects as unknown as Prisma.InputJsonValue,
      schedule: { weeks: fullWeeks } as unknown as Prisma.InputJsonValue,
      hasPerformanceData: performanceData !== null,
    };

    if (!dto.saveToDb) {
      return scheduleData;
    }

    const contestId = await this.resolveContestId(userId, dto.contestId);
    const saved = await prisma.studySchedule.create({
      data: { ...scheduleData, contestId },
    });

    return saved;
  }

  async listSchedules(userId: string) {
    return prisma.studySchedule.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { contest: { select: { id: true, name: true } } },
    });
  }

  // O vínculo com o edital só vale para editais da própria pessoa.
  private async resolveContestId(userId: string, contestId?: string | null): Promise<string | null> {
    if (!contestId) return null;
    const contest = await prisma.contest.findFirst({ where: { id: contestId, userId }, select: { id: true } });
    if (!contest) throw new AppError(404, 'CONTEST_NOT_FOUND', 'Edital não encontrado');
    return contest.id;
  }

  async getSchedule(id: string, userId: string) {
    const sched = await prisma.studySchedule.findFirst({
      where: { id, userId },
    });
    if (!sched) {
      throw new AppError(404, 'SCHEDULE_NOT_FOUND', 'Cronograma não encontrado');
    }
    return sched;
  }

  async saveSchedule(userId: string, data: SaveScheduleDTO) {
    const contestId = await this.resolveContestId(userId, data.contestId);
    return prisma.studySchedule.create({
      include: { contest: { select: { id: true, name: true } } },
      data: {
        userId,
        contestId,
        examDate: data.examDate || data.exam_date || '',
        dailyHours: Number(data.dailyHours || data.daily_hours || 3),
        subjects: data.subjects,
        schedule: data.schedule,
        hasPerformanceData: Boolean(data.hasPerformanceData || data.has_performance_data || false),
      },
    });
  }

  async updateName(id: string, userId: string, title: string) {
    const sched = await this.getSchedule(id, userId);
    const scheduleObj = (sched.schedule as ParsedScheduleJSON) ?? {};
    const updatedSchedule = { ...scheduleObj, title } as unknown as Prisma.InputJsonValue;

    return prisma.studySchedule.update({
      where: { id, userId },
      data: { schedule: updatedSchedule },
    });
  }

  async toggleDayCompletion(id: string, userId: string, weekIndex: number, dayIndex: number) {
    const sched = await this.getSchedule(id, userId);
    const scheduleObj = (sched.schedule as ParsedScheduleJSON) ?? {};

    if (scheduleObj?.weeks?.[weekIndex]?.days?.[dayIndex]) {
      const day = scheduleObj.weeks[weekIndex].days[dayIndex];
      day.completed = !day.completed;

      return prisma.studySchedule.update({
        where: { id, userId },
        data: { schedule: scheduleObj as unknown as Prisma.InputJsonValue },
      });
    }

    return sched;
  }

  async deleteSchedule(id: string, userId: string) {
    return prisma.studySchedule.delete({
      where: { id, userId },
    });
  }
}
