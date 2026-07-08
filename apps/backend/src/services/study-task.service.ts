import type { Prisma, StudyTaskType } from '@prisma/client';
import type { GeneratePlanDTO } from '../validators/study-task.validators.js';
import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';

const REVIEW_DURATION = 15;
const ESSAY_DURATION = 90;
const FINAL_REVIEW_RATIO = 0.15;
const SPACED_REVIEW_OFFSETS = [3, 7];
const WEAK_REVIEW_OFFSETS = [3, 7, 14];
const WEAK_ACCURACY_THRESHOLD = 0.6;
const MIN_ATTEMPTS_FOR_FEEDBACK = 5;

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
    const weakDisciplines = await getWeakDisciplines(userId);
    const tasks = buildTasks(contest.id, contest.name, studyDates, topics, dto.minutesPerDay, weakDisciplines);

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

// Disciplinas com taxa de acerto baixa nas questões ganham revisões extras no plano
async function getWeakDisciplines(userId: string): Promise<Set<string>> {
  const attempts = await prisma.questionAttempt.findMany({
    where: { userId },
    select: {
      isCorrect: true,
      question: {
        select: {
          subject: { select: { name: true, parent: { select: { name: true } } } },
        },
      },
    },
  });

  const stats = new Map<string, { total: number; correct: number }>();
  for (const attempt of attempts) {
    const name = (attempt.question.subject.parent?.name ?? attempt.question.subject.name).toLowerCase();
    const entry = stats.get(name) ?? { total: 0, correct: 0 };
    entry.total += 1;
    if (attempt.isCorrect) entry.correct += 1;
    stats.set(name, entry);
  }

  const weak = new Set<string>();
  for (const [name, { total, correct }] of stats) {
    if (total >= MIN_ATTEMPTS_FOR_FEEDBACK && correct / total < WEAK_ACCURACY_THRESHOLD) {
      weak.add(name);
    }
  }
  return weak;
}

function buildStudyDates(examDate: Date, weekdays: number[]): Date[] {
  const allowed = new Set(weekdays);
  const dates: Date[] = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);

  // examDate é "somente data" (meia-noite UTC) — usa os componentes UTC
  // para não deslocar o limite um dia em fusos negativos
  const limit = new Date(examDate.getUTCFullYear(), examDate.getUTCMonth(), examDate.getUTCDate());

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
  weakDisciplines: Set<string>,
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

    const isWeak = weakDisciplines.has(topic.discipline.toLowerCase());
    const offsets = isWeak ? WEAK_REVIEW_OFFSETS : SPACED_REVIEW_OFFSETS;
    for (const offset of offsets) {
      const reviewDate = addDays(date, offset);
      if (dateKeys.has(dayKey(reviewDate)) && reviewDate < reviewDates[0]) {
        const prefix = isWeak ? 'Reforçar' : 'Revisar';
        tasks.push(makeTask(contestId, 'REVIEW', reviewDate, `${prefix}: ${topic.topic}`, topic.discipline, REVIEW_DURATION, topic.id));
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
