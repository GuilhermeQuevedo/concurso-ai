import type { Reminder } from '@prisma/client';

import { AppError } from '../middlewares/error-handler.js';
import type { IReminderRepository } from '../repositories/reminder.repository.js';
import type { CreateReminderDTO, UpdateReminderDTO } from '../validators/reminder.validators.js';

const toDate = (value: string): Date => new Date(`${value}T12:00:00.000Z`);

export class ReminderService {
  constructor(private readonly reminders: IReminderRepository) {}

  list(userId: string): Promise<Reminder[]> {
    return this.reminders.listByUser(userId);
  }

  create(userId: string, input: CreateReminderDTO): Promise<Reminder> {
    return this.reminders.create(userId, input.text, input.dueDate ? toDate(input.dueDate) : null);
  }

  async update(userId: string, id: string, input: UpdateReminderDTO): Promise<Reminder> {
    const dueDate = input.dueDate === undefined ? undefined : input.dueDate === null ? null : toDate(input.dueDate);
    const updated = await this.reminders.update(userId, id, { text: input.text, done: input.done, dueDate });
    if (!updated) throw new AppError(404, 'REMINDER_NOT_FOUND', 'Lembrete não encontrado.');
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const removed = await this.reminders.remove(userId, id);
    if (!removed) throw new AppError(404, 'REMINDER_NOT_FOUND', 'Lembrete não encontrado.');
  }
}
