export const AREAS = [
  'Assistência Social',
  'Educação',
  'Jurídica',
  'Saúde',
  'Segurança e Trânsito',
  'Tecnologia',
  'Engenharia e Meio Ambiente',
  'Administrativa',
  'Outras',
] as const;

export type Area = (typeof AREAS)[number];

const plain = (text: string): string =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

// Cada regra vale para o cargo (ou, sem cargo, para a disciplina). A ordem importa: a primeira que casar vence.
const RULES: Array<[Area, RegExp]> = [
  ['Assistência Social', /assistente social|servico social|assistencia social|cuidador|visitador|facilitador|instrutor social|instrutor de |acompanhante terapeutico|gerontolog|conselheiro tutelar|atendente social|entrevistador|crianca feliz|\bcras\b|\bcreas\b|cadastro unico|orientador social|educador social|entrevistador social|\bpnas\b|\bsuas\b/],
  ['Jurídica', /advogad|procurador|promotor|\bjuiz|defensor|oficial de justica|assessor juridico|oficial judiciario|notas e de registros|consultor legislativo|tecnico judiciario|analista judiciario|direito|legislacao/],
  ['Educação', /professor|pedagog|educador|orientador educacional|supervisor escolar|diretor escolar|bibliotec|diretor de escola|inspetor de alunos|coordenador pedagogico|educacao/],
  ['Saúde', /enfermag|enfermeir|medic|saude|farmac|fisioterap|odontolog|dentista|psicolog|terapeuta|nutricion|fonoaudiolog|agente comunitario|vigilancia sanitaria|biomedic|\bsus\b/],
  ['Segurança e Trânsito', /guarda|policia|policial|agente de transito|bombeiro|agente penitenciario|vigilante|transito|seguranca/],
  ['Tecnologia', /informatica|programador|analista de sistemas|tecnologia da informacao|desenvolvedor|suporte tecnico|\bti\b/],
  ['Engenharia e Meio Ambiente', /engenheir|arquitet|agronom|geolog|topograf|edificac|meio ambiente|ambiental|geografo|biolog/],
  ['Administrativa', /administrador|administrativ|ciencias contabeis|tesoureiro|oficial de administracao|oficial de apoio|auxiliar|assistente|contador|contabil|tecnico|analista|agente|secretari|fiscal|gestor|escriturario|recepcion|motorista|operador|monitor|coordenador|supervisor|assessor/],
];

export function areaOf(position: string | null, subject: string | null): Area {
  const text = plain(position ?? '') || plain(subject ?? '');
  return RULES.find(([, pattern]) => pattern.test(text))?.[0] ?? 'Outras';
}

const stripOrgan = (text: string, organ: string | null): string | null => {
  const clean = plain(organ ?? '');
  const current = plain(text);
  if (!clean || !current.startsWith(`${clean} - `)) return null;
  return text.slice((organ ?? '').trim().length).replace(/^\s*-\s*/, '');
};

const lastSegment = (text: string): string | null => {
  const parts = text.split(' - ');
  return parts.length >= 2 ? parts[parts.length - 1] : null;
};

// A prova vem como "BANCA - ANO - ÓRGÃO - CARGO". O ano serve de âncora; se o órgão da prova não bate com o campo
// órgão (ex.: "CASAN" x "CASAN-SC"), o cargo é o último trecho.
export function positionOf(exam: string | null, year: number | null, organ: string | null): string | null {
  if (!exam?.trim() || !year) return null;
  const marker = ` - ${year} - `;
  const at = exam.indexOf(marker);
  if (at < 0) return null;
  const rest = exam.slice(at + marker.length).trim();
  const position = (stripOrgan(rest, organ) ?? lastSegment(rest))?.trim();
  return position ? position.slice(0, 190) : null;
}
