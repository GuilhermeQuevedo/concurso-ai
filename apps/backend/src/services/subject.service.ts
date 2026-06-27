import type { ISubjectRepository } from '../interfaces/subject.interfaces.js';
import { AppError } from '../middlewares/error-handler.js';

export class SubjectService {
  constructor(private readonly repository: ISubjectRepository) {}

  async getAll() {
    return this.repository.findAll();
  }

  async getById(id: string) {
    const subject = await this.repository.findById(id);
    if (!subject) {
      throw new AppError(404, 'SUBJECT_NOT_FOUND', 'Disciplina não encontrada');
    }
    return subject;
  }

  async getByParentId(parentId: string | null) {
    return this.repository.findByParentId(parentId);
  }

  async create(data: { name: string; parentId?: string | null; order?: number }) {
    if (data.parentId) {
      const parent = await this.repository.findById(data.parentId);
      if (!parent) {
        throw new AppError(404, 'PARENT_NOT_FOUND', 'Disciplina pai não encontrada');
      }
    }
    return this.repository.create(data);
  }

  async update(id: string, data: { name?: string; parentId?: string | null; order?: number }) {
    await this.getById(id);

    if (data.parentId) {
      if (data.parentId === id) {
        throw new AppError(400, 'SELF_REFERENCE', 'Disciplina não pode ser pai de si mesma');
      }
      const parent = await this.repository.findById(data.parentId);
      if (!parent) {
        throw new AppError(404, 'PARENT_NOT_FOUND', 'Disciplina pai não encontrada');
      }
    }

    return this.repository.update(id, data);
  }

  async delete(id: string) {
    await this.getById(id);

    const hasChildren = await this.repository.hasChildren(id);
    if (hasChildren) {
      throw new AppError(400, 'HAS_CHILDREN', 'Não é possível excluir disciplina com subdisciplinas');
    }

    await this.repository.delete(id);
  }
}
