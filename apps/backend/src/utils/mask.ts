import crypto from 'node:crypto';
import { env } from '../config/env.js';

/**
 * Mascara endereço de e-mail preservando apenas o caractere inicial e final antes do @.
 * Exemplo: 'narduccigabriel2@gmail.com' -> 'n***2@gmail.com'
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***.***';
  const [local, domain] = email.trim().toLowerCase().split('@');
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

/**
 * Mascara número de telefone preservando DDD/prefixo e os dois últimos dígitos.
 * Exemplo: '11987654321' -> '119*****21'
 */
export function maskPhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return '****';
  const prefix = digits.slice(0, 3);
  const suffix = digits.slice(-2);
  const maskedMiddle = '*'.repeat(digits.length - 5);
  return `${prefix}${maskedMiddle}${suffix}`;
}

/**
 * Mascara o nome civil preservando a inicial de cada termo.
 * Exemplo: 'Gabriel Narducci' -> 'G****** N*******'
 */
export function maskName(name?: string | null): string {
  if (!name) return '***';
  return name
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (word.length <= 1) return word;
      return word[0] + '*'.repeat(word.length - 1);
    })
    .join(' ');
}

/**
 * Gera hash criptográfico irreversível (HMAC-SHA256) do IP do usuário usando a chave do servidor.
 * Atende ao princípio da minimização da LGPD impedindo a guarda do IP em claro.
 */
export function hashIp(ip: string): string {
  if (!ip) return 'unknown_hash';
  const cleanIp = ip.trim().toLowerCase();
  const secret = env.ENCRYPTION_KEY;
  return crypto.createHmac('sha256', secret).update(cleanIp).digest('hex');
}

/**
 * Gera hash criptográfico irreversível (HMAC-SHA256) do e-mail normalizado (lowercase, trim)
 * para verificação e guarda na lista de supressão sem retenção do e-mail em claro.
 */
export function hashEmail(email: string): string {
  if (!email) return 'unknown_email_hash';
  const cleanEmail = email.trim().toLowerCase();
  const secret = env.ENCRYPTION_KEY;
  return crypto.createHmac('sha256', secret).update(cleanEmail).digest('hex');
}
