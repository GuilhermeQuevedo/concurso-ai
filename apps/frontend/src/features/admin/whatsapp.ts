import type { Contact } from './services/admin.service';

const DEFAULT_COUNTRY_CODE = '55';

export const WA_TEMPLATE_KEY = 'contacts-wa-template';

export const DEFAULT_WA_TEMPLATE =
  'Olá! 👋 Aqui é do *Concurso AI*, uma plataforma de preparação para concursos com ' +
  'inteligência artificial — questões inéditas, correção de redação, flashcards e plano ' +
  'de estudos personalizado. Posso te enviar um acesso para você conhecer? ' +
  'Se não tiver interesse, é só avisar que não envio mais. 🙂';

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
  return template.replace(/\{nome\}/g, nome).replace(/\s+/g, ' ').trim();
}

export function buildWhatsAppLink(phone: string | null, message: string): string | null {
  const number = normalizeWhatsAppNumber(phone);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
