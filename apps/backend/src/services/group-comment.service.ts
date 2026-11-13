import { xpService } from './xp.service.js';
import { DOUBT_CLEARED_XP } from '@concurso-ai/shared';
import type { CommentKind, CommentTarget, GroupComment } from '@prisma/client';

import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';
import { NotificationRepository } from '../repositories/notification.repository.js';
import { containsOffensiveText } from '../utils/offensive-text.js';

import { assertGroupMember } from './group-share.service.js';

export interface CommentAuthor {
  id: string;
  name: string;
  nickname: string | null;
}

export interface CommentView {
  id: string;
  body: string;
  kind: CommentKind;
  resolved: boolean;
  helpful: boolean;
  targetType: CommentTarget;
  targetId: string | null;
  context: string | null;
  author: CommentAuthor;
  isMine: boolean;
  createdAt: Date;
  replies: CommentView[];
}

export interface ListFilter {
  targetType?: CommentTarget;
  targetId?: string;
  onlyOpenDoubts?: boolean;
}

export interface NewComment {
  body: string;
  kind: CommentKind;
  targetType: CommentTarget;
  targetId?: string;
  context?: string;
  parentId?: string;
}

const MAX_THREADS = 50;
const authorSelect = { id: true, name: true, nickname: true } as const;

type CommentRow = GroupComment & { user: CommentAuthor };

function toView(row: CommentRow, viewerId: string, replies: CommentRow[] = []): CommentView {
  return {
    id: row.id,
    body: row.body,
    kind: row.kind,
    resolved: row.resolved,
    helpful: row.helpful,
    targetType: row.targetType,
    targetId: row.targetId,
    context: row.context,
    author: row.user,
    isMine: row.userId === viewerId,
    createdAt: row.createdAt,
    replies: replies.map((reply) => toView(reply, viewerId)),
  };
}

// Conversa dentro do grupo: comentários em questões, flashcards e decks, com dúvidas que podem ser resolvidas.
export class GroupCommentService {
  constructor(private readonly notifications = new NotificationRepository()) {}

  async list(userId: string, groupId: string, filter: ListFilter): Promise<CommentView[]> {
    await assertGroupMember(groupId, userId);
    const roots = await prisma.groupComment.findMany({
      where: {
        groupId,
        parentId: null,
        ...(filter.targetType ? { targetType: filter.targetType } : {}),
        ...(filter.targetId ? { targetId: filter.targetId } : {}),
        ...(filter.onlyOpenDoubts ? { kind: 'DOUBT' as const, resolved: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_THREADS,
      include: { user: { select: authorSelect } },
    });
    const replies = await prisma.groupComment.findMany({
      where: { groupId, parentId: { in: roots.map((r) => r.id) } },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: authorSelect } },
    });
    return roots.map((root) =>
      toView(
        root,
        userId,
        replies.filter((r) => r.parentId === root.id),
      ),
    );
  }

  async create(userId: string, groupId: string, input: NewComment): Promise<void> {
    await assertGroupMember(groupId, userId);
    if (containsOffensiveText(input.body) || (input.context && containsOffensiveText(input.context))) {
      throw new AppError(400, 'COMMENT_NOT_ALLOWED', 'Sua mensagem contém termos não permitidos. Reescreva e tente de novo.');
    }

    const parent = input.parentId ? await this.findRoot(groupId, input.parentId) : null;
    const comment = await prisma.groupComment.create({
      data: {
        groupId,
        userId,
        body: input.body,
        kind: parent ? 'COMMENT' : input.kind,
        targetType: parent ? parent.targetType : input.targetType,
        targetId: parent ? parent.targetId : input.targetId,
        context: parent ? null : input.context,
        parentId: parent?.id,
      },
      include: { user: { select: authorSelect }, group: { select: { name: true } } },
    });

    if (parent && parent.userId !== userId) {
      const who = comment.user.nickname ? `@${comment.user.nickname}` : comment.user.name;
      await this.notifications.create({
        userId: parent.userId,
        type: 'COMMENT_REPLY',
        message: `${who} respondeu no grupo "${comment.group.name}".`,
        payload: { groupId },
      });
    }
  }

  async remove(userId: string, groupId: string, commentId: string): Promise<void> {
    await assertGroupMember(groupId, userId);
    const comment = await prisma.groupComment.findFirst({ where: { id: commentId, groupId } });
    if (!comment) throw new AppError(404, 'COMMENT_NOT_FOUND', 'Comentário não encontrado.');
    const membership = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } } });
    if (comment.userId !== userId && membership?.role !== 'ADMIN') {
      throw new AppError(403, 'FORBIDDEN', 'Só o autor ou o admin do grupo pode apagar.');
    }
    await prisma.groupComment.delete({ where: { id: commentId } });
  }

  async setResolved(userId: string, groupId: string, commentId: string, resolved: boolean): Promise<void> {
    await assertGroupMember(groupId, userId);
    const root = await this.findRoot(groupId, commentId);
    if (root.userId !== userId) throw new AppError(403, 'FORBIDDEN', 'Só quem postou a dúvida marca como resolvida.');
    await prisma.groupComment.update({ where: { id: root.id }, data: { resolved } });
  }

  // Quem postou a dúvida marca a resposta que esclareceu; quem respondeu ganha pontos no grupo (uma vez por resposta).
  async markHelpful(userId: string, groupId: string, replyId: string): Promise<void> {
    await assertGroupMember(groupId, userId);
    const reply = await prisma.groupComment.findFirst({ where: { id: replyId, groupId, parentId: { not: null } } });
    if (!reply?.parentId) throw new AppError(404, 'COMMENT_NOT_FOUND', 'Resposta não encontrada.');
    const root = await this.findRoot(groupId, reply.parentId);
    if (root.userId !== userId) throw new AppError(403, 'FORBIDDEN', 'Só quem postou a dúvida marca a resposta que esclareceu.');
    if (reply.userId === userId) throw new AppError(400, 'SELF_HELPFUL', 'Você não pode marcar a própria resposta.');

    const { count } = await prisma.groupComment.updateMany({
      where: { id: reply.id, parentId: { not: null }, helpful: false },
      data: { helpful: true },
    });
    if (count === 0) return;

    await prisma.$transaction([
      prisma.groupComment.update({ where: { id: root.id }, data: { resolved: true } }),
    ]);
    const xp = await xpService.award(reply.userId, 'DOUBT', reply.id, DOUBT_CLEARED_XP);
    if (xp.granted > 0) {
      await prisma.groupActivity.create({
        data: { groupId, userId: reply.userId, type: 'DOUBT_CLEARED', points: xp.granted, description: 'Esclareceu a dúvida de um colega' },
      });
    }
  }

  private async findRoot(groupId: string, id: string): Promise<GroupComment> {
    const root = await prisma.groupComment.findFirst({ where: { id, groupId, parentId: null } });
    if (!root) throw new AppError(404, 'COMMENT_NOT_FOUND', 'Conversa não encontrada.');
    return root;
  }
}
