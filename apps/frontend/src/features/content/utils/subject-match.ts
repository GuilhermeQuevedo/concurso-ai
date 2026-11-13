import type { SubjectDTO } from '@/features/content/services/content.service';

export interface FlatSubject extends SubjectDTO {
  prefix: string;
}

export function flattenSubjects(subjects: SubjectDTO[], prefix = ''): FlatSubject[] {
  const out: FlatSubject[] = [];
  for (const subject of subjects) {
    out.push({ ...subject, prefix });
    if (subject.children?.length) out.push(...flattenSubjects(subject.children, `${prefix}— `));
  }
  return out;
}

const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();

export function findSubjectByName(subjects: SubjectDTO[], name?: string): FlatSubject | undefined {
  if (!name) return undefined;
  const target = normalize(name);
  const flat = flattenSubjects(subjects);
  return flat.find((s) => normalize(s.name) === target) ?? flat.find((s) => normalize(s.name).includes(target) || target.includes(normalize(s.name)));
}
