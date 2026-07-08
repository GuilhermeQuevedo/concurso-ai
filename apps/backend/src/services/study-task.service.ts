import type { Prisma, StudyTaskType } from '@prisma/client';
import type { GeneratePlanDTO } from '../validators/study-task.validators.js';
import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';

const REVIEW_DURATION = 15;
const ESSAY_DURATION = 90;
const FINAL_REVIEW_RATIO = 0.15;
const SPACED_REVIEW_OFFSETS = [3, 7];

interface SyllabusTopic {
  id: string;
  discipline: string;
  topic: string;
}

type NewTask = Omit<Prisma.StudyTaskCreateManyInput, 'userId'>;

export class StudyTaskService {
  async generatePlan(userId: string, dto: GeneratePlanDTO) {
    const contest = await prisma.contest.findUnique({
      where: { id: dto.contestId },
      include: { syllabus: { where: { studied: false }, orderBy: { order: 'asc' } } },
    });

    if (!contest || contest.userId !== userId) {
      throw new AppError(404, 'CONTEST_NOT_FOUND', 'Concurso não encontrado');
    }
    if (!contest.examDate || contest.examDate <= new Date()) {
      throw new AppError(400, 'EXAM_DATE_REQUIRED', 'O concurso precisa de uma data de prova futura para gerar o plano.');
    }
    if (contest.syllabus.length === 0) {
      throw new AppError(400, 'NO_TOPICS', 'Não há tópicos pendentes no conteúdo programático deste concurso.');
    }

    const studyDates = buildStudyDates(contest.examDate, dto.studyWeekdays);
    if (studyDates.length < 3) {
      throw new AppError(400, 'NOT_ENOUGH_DAYS', 'Não há dias de estudo suficientes até a prova.');
    }

    const topics = interleaveByDiscipline(contest.syllabus);
    const tasks = buildTasks(contest.id, contest.name, studyDates, topics, dto.minutesPerDay);

    await prisma.studyTask.deleteMany({ where: { userId, contestId: contest.id } });
    await prisma.studyTask.createMany({
      data: tasks.map((t) => ({ ...t, userId })),
    });

    return { created: tasks.length, firstDay: studyDates[0], examDate: contest.examDate };
  }

  async list(userId: string, from?: string, to?: string) {
    return prisma.studyTask.findMany({
      where: {
        userId,
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: new Date(`${from}T00:00:00`) } : {}),
                ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
              },
            }
          : {}),
      },
      orderBy: [{ date: 'asc' }, { type: 'asc' }],
    });
  }

  async today(userId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return prisma.studyTask.findMany({
      where: { userId, date: { gte: start, lt: end } },
      orderBy: { type: 'asc' },
    });
  }

  async setCompleted(userId: string, taskId: string, completed: boolean) {
    const task = await prisma.studyTask.findUnique({ where: { id: taskId } });
    if (!task || task.userId !== userId) {
      throw new AppError(404, 'TASK_NOT_FOUND', 'Tarefa não encontrada');
    }

    const updated = await prisma.studyTask.update({
      where: { id: taskId },
      data: { completed },
    });

    if (task.type === 'STUDY' && task.syllabusItemId) {
      await prisma.contestSyllabusItem
        .update({ where: { id: task.syllabusItemId }, data: { studied: completed } })
        .catch(() => {});
    }

    return updated;
  }

  async clearPlan(userId: string, contestId: string) {
    await prisma.studyTask.deleteMany({ where: { userId, contestId } });
  }
}

function buildStudyDates(examDate: Date, weekdays: number[]): Date[] {
  const allowed = new Set(weekdays);
  const dates: Date[] = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);

  const limit = new Date(examDate);
  limit.setHours(0, 0, 0, 0);

  while (cursor < limit) {
    if (allowed.has(cursor.getDay())) {
      dates.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function interleaveByDiscipline(items: SyllabusTopic[]): SyllabusTopic[] {
  const groups = new Map<string, SyllabusTopic[]>();
  for (const item of items) {
    const list = groups.get(item.discipline) ?? [];
    list.push(item);
    groups.set(item.discipline, list);
  }

  const queues = Array.from(groups.values());
  const result: SyllabusTopic[] = [];
  let added = true;
  while (added) {
    added = false;
    for (const queue of queues) {
      const next = queue.shift();
      if (next) {
        result.push(next);
        added = true;
      }
    }
  }
  return result;
}

function buildTasks(
  contestId: string,
  contestName: string,
  studyDates: Date[],
  topics: SyllabusTopic[],
  minutesPerDay: number,
): NewTask[] {
  const finalDays = Math.max(2, Math.floor(studyDates.length * FINAL_REVIEW_RATIO));
  const learningDates = studyDates.slice(0, studyDates.length - finalDays);
  const reviewDates = studyDates.slice(studyDates.length - finalDays);
  const dateKeys = new Set(studyDates.map(dayKey));

  const tasks: NewTask[] = [];
  const topicsPerDay = Math.max(1, Math.ceil(topics.length / learningDates.length));
  const studyDuration = Math.max(20, Math.floor(minutesPerDay / topicsPerDay));

  topics.forEach((topic, index) => {
    const date = learningDates[Math.min(Math.floor(index / topicsPerDay), learningDates.length - 1)];
    tasks.push(makeTask(contestId, 'STUDY', date, `Estudar: ${topic.topic}`, topic.discipline, studyDuration, topic.id));

    for (const offset of SPACED_REVIEW_OFFSETS) {
      const reviewDate = addDays(date, offset);
      if (dateKeys.has(dayKey(reviewDate)) && reviewDate < reviewDates[0]) {
        tasks.push(makeTask(contestId, 'REVIEW', reviewDate, `Revisar: ${topic.topic}`, topic.discipline, REVIEW_DURATION, topic.id));
      }
    }
  });

  learningDates.forEach((date, index) => {
    if ((index + 1) % 6 === 0) {
      tasks.push(makeTask(contestId, 'ESSAY', date, 'Escrever redação da semana', null, ESSAY_DURATION, null));
    }
  });

  reviewDates.forEach((date, index) => {
    const isLast = index === reviewDates.length - 1;
    tasks.push(
      isLast
        ? makeTask(contestId, 'MOCK_EXAM', date, `Simulado final — ${contestName}`, null, minutesPerDay, null)
        : makeTask(contestId, 'REVIEW', date, 'Revisão geral do conteúdo', null, minutesPerDay, null),
    );
  });

  return tasks;
}

function makeTask(
  contestId: string,
  type: StudyTaskType,
  date: Date,
  title: string,
  discipline: string | null,
  duration: number,
  syllabusItemId: string | null,
): NewTask {
  return { contestId, type, date, title: title.slice(0, 190), discipline, duration, syllabusItemId };
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
