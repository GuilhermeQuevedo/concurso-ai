import type { IExamBoardRepository } from '../interfaces/exam-board.interfaces.js';
import { AppError } from '../middlewares/error-handler.js';
import { slugify } from '../utils/slugify.js';

export class ExamBoardService {
  constructor(private readonly repository: IExamBoardRepository) {}

  async getAll() {
    return this.repository.findAll();
  }

  async getById(id: string) {
    const board = await this.repository.findById(id);
    if (!board) {
      throw new AppError(404, 'EXAM_BOARD_NOT_FOUND', 'Banca não encontrada');
    }
    return board;
  }

  async create(data: { name: string }) {
    const slug = slugify(data.name);
    const existing = await this.repository.findBySlug(slug);
    if (existing) {
      throw new AppError(409, 'EXAM_BOARD_EXISTS', 'Banca já existe');
    }
    return this.repository.create({ name: data.name, slug });
  }

  async update(id: string, data: { name?: string }) {
    await this.getById(id);

    const updateData: { name?: string; slug?: string } = {};
    if (data.name) {
      updateData.name = data.name;
      updateData.slug = slugify(data.name);
      const existing = await this.repository.findBySlug(updateData.slug);
      if (existing && existing.id !== id) {
        throw new AppError(409, 'EXAM_BOARD_EXISTS', 'Banca com este nome já existe');
      }
    }

    return this.repository.update(id, updateData);
  }

  async delete(id: string) {
    await this.getById(id);
    await this.repository.delete(id);
  }
}
