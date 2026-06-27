import type { Subject } from '@prisma/client';

export interface ISubjectRepository {
  findAll(): Promise<Subject[]>;
  findById(id: string): Promise<Subject | null>;
  findByParentId(parentId: string | null): Promise<Subject[]>;
  create(data: { name: string; parentId?: string | null; order?: number }): Promise<Subject>;
  update(id: string, data: { name?: string; parentId?: string | null; order?: number }): Promise<Subject>;
  delete(id: string): Promise<void>;
  hasChildren(id: string): Promise<boolean>;
}
