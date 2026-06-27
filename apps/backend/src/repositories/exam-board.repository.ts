import { prisma } from '../database/prisma.js';
import type { IExamBoardRepository } from '../interfaces/exam-board.interfaces.js';

export class ExamBoardRepository implements IExamBoardRepository {
  async findAll() {
    return prisma.examBoard.findMany({ orderBy: { name: 'asc' } });
  }

  async findById(id: string) {
    return prisma.examBoard.findUnique({ where: { id } });
  }

  async findBySlug(slug: string) {
    return prisma.examBoard.findUnique({ where: { slug } });
  }

  async create(data: { name: string; slug: string }) {
    return prisma.examBoard.create({ data });
  }

  async update(id: string, data: { name?: string; slug?: string }) {
    return prisma.examBoard.update({ where: { id }, data });
  }

  async delete(id: string) {
    await prisma.examBoard.delete({ where: { id } });
  }
}
