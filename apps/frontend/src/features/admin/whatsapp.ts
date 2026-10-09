import type { Contact } from './services/admin.service';

const DEFAULT_COUNTRY_CODE = '55';

export const WA_TEMPLATE_KEY = 'contacts-wa-template';
export const WA_GROUP_LINK_KEY = 'contacts-wa-group-link';

export const DEFAULT_WA_TEMPLATE = [
  '🎯 *Grupo GRÁTIS de preparação para concursos!*',
  '',
  'Oi! Tô abrindo um grupo no WhatsApp pra quem quer passar em concurso. Lá dentro tem:',
  '',
  '📚 Dicas e materiais de estudo',
  '📝 Questões e redações comentadas',
  '📅 Avisos de editais e prazos importantes',
  '🤖 Acesso ao *Concurso AI* — plataforma com inteligência artificial pra estudar melhor',
  '',
  'Bora entrar? É de graça 👇',
  '{link}',
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

export function applyTemplate(template: string, contact: Contact, groupLink = ''): string {
  const nome = contact.name?.trim() ?? '';
  return template
    .replace(/\{nome\}/g, nome)
    .replace(/\{link\}/g, groupLink.trim())
    .trim();
}

export function buildWhatsAppLink(phone: string | null, message: string): string | null {
  const number = normalizeWhatsAppNumber(phone);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
