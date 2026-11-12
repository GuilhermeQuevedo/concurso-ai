import type { Difficulty, RoomMode } from '@prisma/client';

import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';
import { NotificationRepository } from '../repositories/notification.repository.js';
import {
  COUNTDOWN_MS,
  OWN_PACE_WINDOW_MS,
  liveEndsAt,
  liveTiming,
  pointsFor,
} from '../utils/room-timing.js';

import { questionIdsOf, syncRoom } from './group-room-state.service.js';
import { assertGroupMember } from './group-share.service.js';

export interface NewRoom {
  title: string;
  mode: RoomMode;
  count: number;
  secondsPerQuestion: number;
  subjectId?: string;
  difficulty?: Difficulty;
}

export interface RoomSummary {
  id: string;
  title: string;
  mode: RoomMode;
  status: string;
  total: number;
  players: number;
  endsAt: Date | null;
  createdAt: Date;
}

const LIST_LIMIT = 15;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
  }
  return copy;
}

// Salas de questões do grupo: ao vivo (todos juntos, tempo por pergunta) ou no próprio ritmo (janela de 24 h).
export class GroupRoomService {
  constructor(private readonly notifications = new NotificationRepository()) {}

  async create(userId: string, groupId: string, input: NewRoom): Promise<{ id: string }> {
    await assertGroupMember(groupId, userId);
    const pool = await prisma.question.findMany({
      where: { subjectId: input.subjectId, difficulty: input.difficulty },
      select: { id: true },
      take: 500,
    });
    if (pool.length < input.count) {
      throw new AppError(
        400,
        'NOT_ENOUGH_QUESTIONS',
        `Não há questões suficientes com esses filtros (disponíveis: ${pool.length}, solicitadas: ${input.count}). Gere mais questões ou mude a disciplina.`,
      );
    }
    const questionIds = shuffle(pool).slice(0, input.count).map((q) => q.id);

    const now = Date.now();
    const ownPace = input.mode === 'OWN_PACE';
    const room = await prisma.groupRoom.create({
      data: {
        groupId,
        hostId: userId,
        title: input.title,
        mode: input.mode,
        questionIds,
        secondsPerQuestion: input.secondsPerQuestion,
        status: ownPace ? 'RUNNING' : 'LOBBY',
        startsAt: ownPace ? new Date(now) : null,
        endsAt: ownPace ? new Date(now + OWN_PACE_WINDOW_MS) : null,
        players: { create: { userId } },
      },
      select: { id: true, title: true, group: { select: { name: true } } },
    });
    await this.announce(userId, groupId, room.group.name, room.title);
    return { id: room.id };
  }

  async list(userId: string, groupId: string): Promise<RoomSummary[]> {
    await assertGroupMember(groupId, userId);
    const rooms = await prisma.groupRoom.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
      take: LIST_LIMIT,
      include: { _count: { select: { players: true } } },
    });
    const synced = await Promise.all(rooms.map((r) => syncRoom(r)));
    return synced.map((r, i) => ({
      id: r.id,
      title: r.title,
      mode: r.mode,
      status: r.status,
      total: questionIdsOf(r).length,
      players: rooms[i]?._count.players ?? 0,
      endsAt: r.endsAt,
      createdAt: r.createdAt,
    }));
  }

  async join(userId: string, groupId: string, roomId: string): Promise<void> {
    await assertGroupMember(groupId, userId);
    const room = await this.find(groupId, roomId);
    if (room.status === 'FINISHED') throw new AppError(409, 'ROOM_FINISHED', 'Esta sala já terminou.');
    if (room.mode === 'LIVE' && room.status !== 'LOBBY') {
      throw new AppError(409, 'ROOM_STARTED', 'A sala ao vivo já começou.');
    }
    await prisma.groupRoomPlayer.upsert({
      where: { roomId_userId: { roomId, userId } },
      create: { roomId, userId },
      update: {},
    });
  }

  async start(userId: string, groupId: string, roomId: string): Promise<void> {
    await assertGroupMember(groupId, userId);
    const room = await this.find(groupId, roomId);
    if (room.hostId !== userId) throw new AppError(403, 'FORBIDDEN', 'Só quem criou a sala pode iniciá-la.');
    if (room.mode !== 'LIVE' || room.status !== 'LOBBY') throw new AppError(409, 'ROOM_NOT_STARTABLE', 'Esta sala não pode ser iniciada.');
    const startsAt = Date.now() + COUNTDOWN_MS;
    const total = questionIdsOf(room).length;
    await prisma.groupRoom.update({
      where: { id: roomId },
      data: {
        status: 'RUNNING',
        startsAt: new Date(startsAt),
        endsAt: new Date(liveEndsAt(startsAt, total, room.secondsPerQuestion)),
      },
    });
  }

  async answer(userId: string, groupId: string, roomId: string, questionId: string, choice: string): Promise<void> {
    await assertGroupMember(groupId, userId);
    const room = await syncRoom(await this.find(groupId, roomId));
    if (room.status !== 'RUNNING' || !room.startsAt) throw new AppError(409, 'ROOM_NOT_RUNNING', 'A sala não está aberta para respostas.');
    const player = await prisma.groupRoomPlayer.findUnique({ where: { roomId_userId: { roomId, userId } } });
    if (!player) throw new AppError(403, 'NOT_IN_ROOM', 'Entre na sala para responder.');

    const ids = questionIdsOf(room);
    const index = ids.indexOf(questionId);
    if (index < 0) throw new AppError(400, 'QUESTION_NOT_IN_ROOM', 'Questão fora desta sala.');

    const now = Date.now();
    let elapsedMs = 0;
    if (room.mode === 'LIVE') {
      const timing = liveTiming(room.startsAt.getTime(), ids.length, room.secondsPerQuestion, now);
      if (timing.phase !== 'ANSWERING' || timing.index !== index) {
        throw new AppError(409, 'OUT_OF_TIME', 'O tempo desta pergunta acabou.');
      }
      elapsedMs = now - timing.questionStartedAt;
    }

    const question = await prisma.question.findUnique({ where: { id: questionId }, select: { correctAnswer: true } });
    if (!question) throw new AppError(404, 'QUESTION_NOT_FOUND', 'Questão não encontrada.');
    const isCorrect = question.correctAnswer.trim().toUpperCase() === choice.trim().toUpperCase();

    try {
      await prisma.groupRoomAnswer.create({
        data: {
          roomId,
          userId,
          questionId,
          choice: choice.trim().toUpperCase(),
          isCorrect,
          ms: elapsedMs,
          points: pointsFor(isCorrect, room.mode, elapsedMs, room.secondsPerQuestion),
        },
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') throw new AppError(409, 'ALREADY_ANSWERED', 'Você já respondeu esta questão.');
      throw error;
    }
  }

  private async find(groupId: string, roomId: string) {
    const room = await prisma.groupRoom.findFirst({ where: { id: roomId, groupId } });
    if (!room) throw new AppError(404, 'ROOM_NOT_FOUND', 'Sala não encontrada.');
    return room;
  }

  private async announce(hostId: string, groupId: string, groupName: string, title: string): Promise<void> {
    const [host, members] = await Promise.all([
      prisma.user.findUnique({ where: { id: hostId }, select: { name: true, nickname: true } }),
      prisma.groupMember.findMany({ where: { groupId, userId: { not: hostId } }, select: { userId: true } }),
    ]);
    const who = host?.nickname ? `@${host.nickname}` : (host?.name ?? 'Alguém');
    await Promise.all(
      members.map((m) =>
        this.notifications.create({
          userId: m.userId,
          type: 'ROOM_OPEN',
          message: `${who} abriu a sala "${title}" no grupo "${groupName}".`,
          payload: { groupId },
        }),
      ),
    );
  }
}
