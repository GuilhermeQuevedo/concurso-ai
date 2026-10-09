export interface ParsedContact {
  name: string | null;
  phone: string | null;
  email: string | null;
}

const MAX_CONTACTS = 5000;
const EMAIL_RE = /[^\s,;]+@[^\s,;]+\.[^\s,;]+/;
const LETTER_RE = /[a-zA-ZÀ-ÿ]/;

function splitLine(line: string): string[] {
  if (line.includes('\t')) return line.split('\t');
  if (line.includes(';')) return line.split(';');
  if (line.includes(',')) return line.split(',');
  return line.split(/\s{2,}/);
}

function normalizePhone(value: string): string | null {
  const cleaned = value.replace(/[^\d+]/g, '');
  const digits = cleaned.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15 ? cleaned : null;
}

function digitCount(value: string): number {
  return value.replace(/\D/g, '').length;
}

function isHeaderLine(line: string): boolean {
  const l = line.toLowerCase();
  const hasData = EMAIL_RE.test(line) || /\d{8,}/.test(line.replace(/\D/g, ''));
  if (hasData) return false;
  return ['nome', 'telefone', 'email', 'e-mail', 'whatsapp', 'ddd', 'phone', 'name'].some((h) =>
    l.includes(h),
  );
}

function extractFromLine(parts: string[]): ParsedContact | null {
  let email: string | null = null;
  let phone: string | null = null;
  const nameParts: string[] = [];

  for (const part of parts) {
    if (!email && EMAIL_RE.test(part)) {
      email = (part.match(EMAIL_RE)?.[0] ?? part).toLowerCase();
      continue;
    }
    const maybePhone = !LETTER_RE.test(part) ? normalizePhone(part) : null;
    if (maybePhone) {
      if (!phone || digitCount(maybePhone) > digitCount(phone)) phone = maybePhone;
      continue;
    }
    if (LETTER_RE.test(part)) nameParts.push(part);
  }

  const name = nameParts.join(' ').trim() || null;
  if (!name && !phone && !email) return null;
  return { name, phone, email };
}

export function parseContacts(raw: string): ParsedContact[] {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const result: ParsedContact[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    if (result.length >= MAX_CONTACTS) break;
    if (isHeaderLine(line)) continue;

    const parts = splitLine(line).map((p) => p.trim()).filter(Boolean);
    const contact = extractFromLine(parts);
    if (!contact) continue;

    const key = (contact.phone ? contact.phone.replace(/\D/g, '') : '') || contact.email || '';
    if (key) {
      if (seen.has(key)) continue;
      seen.add(key);
    }
    result.push(contact);
  }

  return result;
}
