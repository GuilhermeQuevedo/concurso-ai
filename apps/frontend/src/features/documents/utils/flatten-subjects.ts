import type { SubjectDTO } from '@/features/content/services/content.service';

export interface FlatSubject extends SubjectDTO {
  prefix: string;
}

// Achata a árvore de disciplinas, prefixando os filhos com "— " para exibir hierarquia em listas simples.
export function flattenSubjects(subjects: SubjectDTO[], prefix = ''): FlatSubject[] {
  const result: FlatSubject[] = [];
  for (const subject of subjects) {
    result.push({ ...subject, prefix });
    if (subject.children && subject.children.length > 0) {
      result.push(...flattenSubjects(subject.children, `${prefix}— `));
    }
  }
  return result;
}
