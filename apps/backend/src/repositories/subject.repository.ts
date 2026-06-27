import { prisma } from '../database/prisma.js';
import type { ISubjectRepository } from '../interfaces/subject.interfaces.js';

export class SubjectRepository implements ISubjectRepository {
  async findAll() {
    return prisma.subject.findMany({
      include: { children: { orderBy: { order: 'asc' } } },
      where: { parentId: null },
      orderBy: { order: 'asc' },
    });
  }

  async findById(id: string) {
    return prisma.subject.findUnique({
      where: { id },
      include: { children: { orderBy: { order: 'asc' } }, parent: true },
    });
  }

  async findByParentId(parentId: string | null) {
    return prisma.subject.findMany({
      where: { parentId },
      orderBy: { order: 'asc' },
    });
  }

  async create(data: { name: string; parentId?: string | null; order?: number }) {
    return prisma.subject.create({ data });
  }

  async update(id: string, data: { name?: string; parentId?: string | null; order?: number }) {
    return prisma.subject.update({ where: { id }, data });
  }

  async delete(id: string) {
    await prisma.subject.delete({ where: { id } });
  }

  async hasChildren(id: string) {
    const count = await prisma.subject.count({ where: { parentId: id } });
    return count > 0;
  }
}
