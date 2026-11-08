import { prisma } from '../database/prisma.js';
import { NotificationRepository } from '../repositories/notification.repository.js';

import { GROUP_INVITE_NOTIFICATION } from './group-invite.service.js';

export interface NotificationView {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: Date;
  // Só para convites: permite mostrar aceitar/recusar apenas enquanto estiver pendente.
  invite?: { id: string; status: string };
}

export class NotificationService {
  constructor(private readonly notifications = new NotificationRepository()) {}

  async list(userId: string): Promise<{ unread: number; items: NotificationView[] }> {
    const [rows, unread] = await Promise.all([
      this.notifications.listByUser(userId),
      this.notifications.countUnread(userId),
    ]);

    const inviteIds = rows
      .filter((n) => n.type === GROUP_INVITE_NOTIFICATION)
      .map((n) => (n.payload as { inviteId?: string } | null)?.inviteId)
      .filter((id): id is string => typeof id === 'string');
    const invites = await prisma.groupInvite.findMany({
      where: { id: { in: inviteIds }, invitedUserId: userId },
      select: { id: true, status: true },
    });
    const inviteById = new Map(invites.map((i) => [i.id, i]));

    const items = rows.map((n) => {
      const inviteId = (n.payload as { inviteId?: string } | null)?.inviteId;
      return {
        id: n.id,
        type: n.type,
        message: n.message,
        read: n.readAt !== null,
        createdAt: n.createdAt,
        invite: inviteId ? inviteById.get(inviteId) : undefined,
      };
    });
    return { unread, items };
  }

  markRead(userId: string, id: string): Promise<void> {
    return this.notifications.markRead(userId, id);
  }

  markAllRead(userId: string): Promise<void> {
    return this.notifications.markAllRead(userId);
  }
}
