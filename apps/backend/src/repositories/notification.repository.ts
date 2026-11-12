import type { Notification, Prisma } from '@prisma/client';

import { prisma } from '../database/prisma.js';

export interface NewNotification {
  userId: string;
  type: string;
  message: string;
  payload?: Prisma.InputJsonValue;
}

const PAGE_SIZE = 30;

export class NotificationRepository {
  create(data: NewNotification): Promise<Notification> {
    return prisma.notification.create({ data });
  }

  listByUser(userId: string): Promise<Notification[]> {
    return prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: PAGE_SIZE });
  }

  countUnread(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, readAt: null } });
  }

  async markRead(userId: string, id: string): Promise<void> {
    await prisma.notification.updateMany({ where: { id, userId, readAt: null }, data: { readAt: new Date() } });
  }

  async markAllRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
  }
}
