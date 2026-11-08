import type { Reminder } from '@prisma/client';

import { prisma } from '../database/prisma.js';

export interface ReminderChanges {
  text?: string;
  done?: boolean;
  dueDate?: Date | null;
}

export interface IReminderRepository {
  listByUser(userId: string): Promise<Reminder[]>;
  create(userId: string, text: string, dueDate: Date | null): Promise<Reminder>;
  update(userId: string, id: string, changes: ReminderChanges): Promise<Reminder | null>;
  remove(userId: string, id: string): Promise<boolean>;
}

const MAX_REMINDERS = 200;

export class ReminderRepository implements IReminderRepository {
  listByUser(userId: string): Promise<Reminder[]> {
    return prisma.reminder.findMany({
      where: { userId },
      orderBy: [{ done: 'asc' }, { createdAt: 'desc' }],
      take: MAX_REMINDERS,
    });
  }

  create(userId: string, text: string, dueDate: Date | null): Promise<Reminder> {
    return prisma.reminder.create({ data: { userId, text, dueDate } });
  }

  async update(userId: string, id: string, changes: ReminderChanges): Promise<Reminder | null> {
    const { count } = await prisma.reminder.updateMany({ where: { id, userId }, data: changes });
    if (count === 0) return null;
    return prisma.reminder.findUnique({ where: { id } });
  }

  async remove(userId: string, id: string): Promise<boolean> {
    const { count } = await prisma.reminder.deleteMany({ where: { id, userId } });
    return count > 0;
  }
}
