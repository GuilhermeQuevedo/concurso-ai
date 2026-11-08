import { api, unwrapData } from '@/services/api';
import type { ApiResponse } from '@concurso-ai/types';

export type RoomMode = 'LIVE' | 'OWN_PACE';
export type RoomStatus = 'LOBBY' | 'RUNNING' | 'FINISHED';
export type RoomPhase = 'LOBBY' | 'COUNTDOWN' | 'ANSWERING' | 'REVEAL' | 'FINISHED';

export interface RoomSummary {
  id: string;
  title: string;
  mode: RoomMode;
  status: RoomStatus;
  total: number;
  players: number;
  endsAt: string | null;
  createdAt: string;
}

export interface RoomPlayer {
  userId: string;
  name: string;
  nickname: string | null;
  score: number;
  correct: number;
  answered: number;
}

export interface RoomQuestion {
  id: string;
  index: number;
  statement: string;
  alternatives: { letter: string; text: string }[];
  myChoice: string | null;
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
  endsAt: string | null;
  isHost: boolean;
  joined: boolean;
  players: RoomPlayer[];
  questions: RoomQuestion[];
}

export interface NewRoomInput {
  title: string;
  mode: RoomMode;
  count: number;
  secondsPerQuestion: number;
  subjectId?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
}

export const roomService = {
  async list(groupId: string): Promise<RoomSummary[]> {
    const response = await api.get<ApiResponse<RoomSummary[]>>(`/groups/${groupId}/rooms`);
    return unwrapData(response);
  },

  async create(groupId: string, input: NewRoomInput): Promise<{ id: string }> {
    const response = await api.post<ApiResponse<{ id: string }>>(`/groups/${groupId}/rooms`, input);
    return unwrapData(response);
  },

  async get(groupId: string, roomId: string): Promise<RoomState> {
    const response = await api.get<ApiResponse<RoomState>>(`/groups/${groupId}/rooms/${roomId}`);
    return unwrapData(response);
  },

  async join(groupId: string, roomId: string): Promise<void> {
    await api.post(`/groups/${groupId}/rooms/${roomId}/join`);
  },

  async start(groupId: string, roomId: string): Promise<void> {
    await api.post(`/groups/${groupId}/rooms/${roomId}/start`);
  },

  async answer(groupId: string, roomId: string, questionId: string, choice: string): Promise<void> {
    await api.post(`/groups/${groupId}/rooms/${roomId}/answer`, { questionId, choice });
  },
};
