import type { GroupRoom, RoomMode, RoomStatus } from '@prisma/client';

import { prisma } from '../database/prisma.js';
import { AppError } from '../middlewares/error-handler.js';
import { liveTiming, type RoomPhase } from '../utils/room-timing.js';

import { assertGroupMember } from './group-share.service.js';

const GROUP_POINTS_PER_CORRECT = 2;

export interface RoomPlayerView {
  userId: string;
  name: string;
  nickname: string | null;
  score: number;
  correct: number;
  answered: number;
}

export interface RoomQuestionView {
  id: string;
  index: number;
  statement: string;
  alternatives: { letter: string; text: string }[];
  myChoice: string | null;
  // O gabarito só vem quando a pessoa já pode vê-lo (sala ao vivo: fase de revelação; no próprio ritmo: depois de responder).
  reveal: { correctAnswer: string; explanation: string } | null;
}

export interface RoomState {
  id: string;
  title: string;
  mode: RoomMode;
  status: RoomStatus;
  phase: RoomPhase;
  secondsPerQuestion: number;
  total: number;
  index: number;
  remainingMs: number;
  endsAt: Date | null;
  isHost: boolean;
  joined: boolean;
  players: RoomPlayerView[];
  questions: RoomQuestionView[];
}

export const questionIdsOf = (room: GroupRoom): string[] => (Array.isArray(room.questionIds) ? (room.questionIds as string[]) : []);

// Atualiza o status da sala conforme o relógio e paga os pontos do grupo uma única vez ao terminar.
export async function syncRoom(room: GroupRoom, now = Date.now()): Promise<GroupRoom> {
  if (room.status === 'FINISHED' || !room.startsAt || !room.endsAt) return room;
  const finishedByClock = now >= room.endsAt.getTime();
  const total = questionIdsOf(room).length;
  const live = room.mode === 'LIVE' ? liveTiming(room.startsAt.getTime(), total, room.secondsPerQuestion, now) : null;
  if (!finishedByClock && live?.phase !== 'FINISHED') return room;

  const { count } = await prisma.groupRoom.updateMany({ where: { id: room.id, rewarded: false }, data: { rewarded: true, status: 'FINISHED' } });
  if (count === 1) await rewardPlayers(room);
  return { ...room, status: 'FINISHED', rewarded: true };
}

async function rewardPlayers(room: GroupRoom): Promise<void> {
  const answers = await prisma.groupRoomAnswer.groupBy({
    by: ['userId'],
    where: { roomId: room.id, isCorrect: true },
    _count: { _all: true },
  });
  const data = answers.map((a) => ({
    groupId: room.groupId,
    userId: a.userId,
    type: 'ROOM_FINISHED',
    points: a._count._all * GROUP_POINTS_PER_CORRECT,
    description: `Sala "${room.title}": ${a._count._all} acerto${a._count._all === 1 ? '' : 's'}`,
  }));
  if (data.length > 0) await prisma.groupActivity.createMany({ data });
}

export class GroupRoomStateService {
  async get(userId: string, groupId: string, roomId: string): Promise<RoomState> {
    await assertGroupMember(groupId, userId);
    const found = await prisma.groupRoom.findFirst({ where: { id: roomId, groupId } });
    if (!found) throw new AppError(404, 'ROOM_NOT_FOUND', 'Sala não encontrada.');
    const room = await syncRoom(found);

    const ids = questionIdsOf(room);
    const now = Date.now();
    const total = ids.length;
    const live = room.mode === 'LIVE' && room.startsAt ? liveTiming(room.startsAt.getTime(), total, room.secondsPerQuestion, now) : null;
    const finished = room.status === 'FINISHED';
    const phase: RoomPhase = finished ? 'FINISHED' : room.status === 'LOBBY' ? 'LOBBY' : (live?.phase ?? 'ANSWERING');
    const index = live && !finished ? live.index : 0;

    const [players, answers, questions] = await Promise.all([
      prisma.groupRoomPlayer.findMany({ where: { roomId }, include: { user: { select: { id: true, name: true, nickname: true } } } }),
      prisma.groupRoomAnswer.findMany({ where: { roomId } }),
      prisma.question.findMany({ where: { id: { in: ids } } }),
    ]);

    const byId = new Map(questions.map((q) => [q.id, q]));
    const mine = new Map(answers.filter((a) => a.userId === userId).map((a) => [a.questionId, a.choice]));
    const visible = this.visibleIndexes(room.mode, finished, phase, index, total);

    const views: RoomQuestionView[] = visible.flatMap((i) => {
      const q = byId.get(ids[i] as string);
      if (!q) return [];
      const myChoice = mine.get(q.id) ?? null;
      const canReveal = finished || (room.mode === 'LIVE' ? phase === 'REVEAL' : myChoice !== null);
      return [
        {
          id: q.id,
          index: i,
          statement: q.statement,
          alternatives: q.alternatives as { letter: string; text: string }[],
          myChoice,
          reveal: canReveal ? { correctAnswer: q.correctAnswer, explanation: q.explanation } : null,
        },
      ];
    });

    return {
      id: room.id,
      title: room.title,
      mode: room.mode,
      status: room.status,
      phase,
      secondsPerQuestion: room.secondsPerQuestion,
      total,
      index,
      remainingMs: live && !finished ? live.remainingMs : room.endsAt ? Math.max(0, room.endsAt.getTime() - now) : 0,
      endsAt: room.endsAt,
      isHost: room.hostId === userId,
      joined: players.some((p) => p.userId === userId),
      players: this.leaderboard(players, answers),
      questions: views,
    };
  }

  // Ao vivo, só a pergunta atual (ou todas depois do fim); no próprio ritmo, todas.
  private visibleIndexes(mode: RoomMode, finished: boolean, phase: RoomPhase, index: number, total: number): number[] {
    const all = Array.from({ length: total }, (_, i) => i);
    if (finished || mode === 'OWN_PACE') return all;
    if (phase === 'ANSWERING' || phase === 'REVEAL') return [index];
    return [];
  }

  private leaderboard(
    players: { userId: string; user: { name: string; nickname: string | null } }[],
    answers: { userId: string; isCorrect: boolean; points: number }[],
  ): RoomPlayerView[] {
    return players
      .map((p) => {
        const mine = answers.filter((a) => a.userId === p.userId);
        return {
          userId: p.userId,
          name: p.user.name,
          nickname: p.user.nickname,
          score: mine.reduce((sum, a) => sum + a.points, 0),
          correct: mine.filter((a) => a.isCorrect).length,
          answered: mine.length,
        };
      })
      .sort((a, b) => b.score - a.score || b.correct - a.correct);
  }
}
