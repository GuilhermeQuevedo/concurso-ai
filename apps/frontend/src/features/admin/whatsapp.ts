import type { Contact } from './services/admin.service';

const DEFAULT_COUNTRY_CODE = '55';

export const WA_TEMPLATE_KEY = 'contacts-wa-template';

export const DEFAULT_WA_TEMPLATE = [
  '🚀 *Passar em concurso ficou mais inteligente!*',
  '',
  'Oi! Já conhece o *Concurso AI*? É uma plataforma feita 100% para concurseiros, com inteligência artificial trabalhando a seu favor:',
  '',
  '✅ Questões inéditas no estilo da sua banca',
  '📝 Correção de redação detalhada em minutos',
  '🧠 Flashcards com revisão espaçada pra não esquecer',
  '📅 Plano de estudos personalizado pro seu edital',
  '📊 Estatísticas que mostram exatamente onde focar',
  '',
  'Quer testar e ver como acelera a sua aprovação? Te mando o acesso agora. 😉',
  '',
  '(Se não quiser receber, responda *SAIR* que não envio mais.)',
].join('\n');

export function normalizeWhatsAppNumber(phone: string | null): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  if (!digits.startsWith(DEFAULT_COUNTRY_CODE) && digits.length <= 11) {
    digits = DEFAULT_COUNTRY_CODE + digits;
  }
  return digits;
}

export function applyTemplate(template: string, contact: Contact): string {
  const nome = contact.name?.trim() ?? '';
  return template.replace(/\{nome\}/g, nome).trim();
}

export function buildWhatsAppLink(phone: string | null, message: string): string | null {
  const number = normalizeWhatsAppNumber(phone);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
