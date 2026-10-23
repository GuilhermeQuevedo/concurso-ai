import bcrypt from 'bcrypt';
import { env } from '../config/env.js';

// Dummy hash pré-computado para mitigar ataques de timing (quando e-mail não existe no banco)
const DUMMY_HASH = '$2b$12$e8YkZ8Q8k3c8M0W1n2m4o.O1p2q3r4s5t6u7v8w9x0y1z2a3b4c5d';

interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
  blockedUntil: number | null;
}

const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos de janela
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutos de bloqueio temporário

export class BruteForceGuard {
  private static readonly attempts = new Map<string, AttemptRecord>();

  private static cleanupOldRecords(): void {
    const now = Date.now();
    for (const [key, record] of this.attempts.entries()) {
      if (
        (!record.blockedUntil || record.blockedUntil < now) &&
        now - record.firstAttemptAt > ATTEMPT_WINDOW_MS
      ) {
        this.attempts.delete(key);
      }
    }
  }

  static checkBlocked(identifier: string): { isBlocked: boolean; retryAfterSeconds: number } {
    this.cleanupOldRecords();
    const key = identifier.toLowerCase().trim();
    const record = this.attempts.get(key);

    if (!record || !record.blockedUntil) {
      return { isBlocked: false, retryAfterSeconds: 0 };
    }

    const now = Date.now();
    if (record.blockedUntil > now) {
      const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
      return { isBlocked: true, retryAfterSeconds };
    }

    // Período de bloqueio expirou: remove registro
    this.attempts.delete(key);
    return { isBlocked: false, retryAfterSeconds: 0 };
  }

  static recordFailedAttempt(identifier: string): { isNowBlocked: boolean; remainingAttempts: number; retryAfterSeconds: number } {
    const key = identifier.toLowerCase().trim();
    const now = Date.now();
    const record = this.attempts.get(key) ?? {
      count: 0,
      firstAttemptAt: now,
      blockedUntil: null,
    };

    // Se a janela expirou e não estava bloqueado, reseta
    if (!record.blockedUntil && now - record.firstAttemptAt > ATTEMPT_WINDOW_MS) {
      record.count = 0;
      record.firstAttemptAt = now;
    }

    record.count += 1;

    if (record.count >= MAX_FAILED_ATTEMPTS) {
      record.blockedUntil = now + BLOCK_DURATION_MS;
      this.attempts.set(key, record);
      return {
        isNowBlocked: true,
        remainingAttempts: 0,
        retryAfterSeconds: Math.ceil(BLOCK_DURATION_MS / 1000),
      };
    }

    this.attempts.set(key, record);
    return {
      isNowBlocked: false,
      remainingAttempts: MAX_FAILED_ATTEMPTS - record.count,
      retryAfterSeconds: 0,
    };
  }

  static recordSuccess(identifier: string): void {
    const key = identifier.toLowerCase().trim();
    this.attempts.delete(key);
  }
}

/**
 * Whitelist restrita e explícita dos 3 administradores mestres autorizados
 * Sem qualquer correspondência difusa ou flexibilidade: apenas correspondência exata.
 */
export const MASTER_ADMIN_EMAILS = Object.freeze([
  'narduccigabriel2@gmail.com',
  'dev@teste.com',
  'guilhermecquevedo@gmail.com',
]);

export function isPermanentAdminEmail(email: string): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();

  // 1. Verificação estrita de igualdade na lista imutável
  if (MASTER_ADMIN_EMAILS.includes(normalized)) {
    return true;
  }

  // 2. E-mails adicionais explicitamente definidos em ADMIN_EMAILS no .env
  const configAdmins = (env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.toLowerCase().trim())
    .filter(Boolean);

  return configAdmins.includes(normalized);
}

// Alias estrito para compatibilidade reversa
export const isVipEmail = isPermanentAdminEmail;

export async function dummyPasswordCheck(password: string): Promise<void> {
  // Executa um hash simulado para igualar o tempo de resposta e evitar enumeração de contas por timing attack
  await bcrypt.compare(password, DUMMY_HASH);
}
