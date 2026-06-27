import type { ExamBoard } from '@prisma/client';

export interface IExamBoardRepository {
  findAll(): Promise<ExamBoard[]>;
  findById(id: string): Promise<ExamBoard | null>;
  findBySlug(slug: string): Promise<ExamBoard | null>;
  create(data: { name: string; slug: string }): Promise<ExamBoard>;
  update(id: string, data: { name?: string; slug?: string }): Promise<ExamBoard>;
  delete(id: string): Promise<void>;
}
