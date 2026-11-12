const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'refreshtoken',
  'accesstoken',
  'googleaccesstoken',
  'googlerefreshtoken',
  'authorization',
  'clientsecret',
  'apikey',
  'secret',
  'encryptionkey',
  'jwtsecret',
]);

const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const BEARER_REGEX = /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi;
const BASIC_AUTH_REGEX = /Basic\s+[A-Za-z0-9+/]+=*/gi;

/**
 * Sanitiza strings substituindo e-mails e tokens de autorização por marcadores protegidos.
 */
export function redactPii(input: string): string {
  if (!input || typeof input !== 'string') return input;

  return input
    .replace(BEARER_REGEX, 'Bearer [REDACTED]')
    .replace(BASIC_AUTH_REGEX, 'Basic [REDACTED]')
    .replace(EMAIL_REGEX, (email) => {
      const [local, domain] = email.split('@');
      if (local.length <= 2) return `${local[0]}*@${domain}`;
      return `${local[0]}***${local[local.length - 1]}@${domain}`;
    });
}

/**
 * Percorre recursivamente objetos e sanitiza chaves sensíveis e valores contendo PII.
 */
export function redactObject<T>(obj: T, depth = 0): T {
  if (depth > 5) return '[MaxDepth]' as unknown as T;
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return redactPii(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactObject(item, depth + 1)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const copy: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.has(lowerKey)) {
        copy[key] = '[REDACTED]';
      } else {
        copy[key] = redactObject(value, depth + 1);
      }
    }
    return copy as T;
  }

  return obj;
}

function formatLogArguments(args: unknown[]): unknown[] {
  return args.map((arg) => {
    if (typeof arg === 'string') {
      return redactPii(arg);
    }
    if (arg instanceof Error) {
      const sanitized = new Error(redactPii(arg.message));
      sanitized.name = arg.name;
      if (arg.stack) {
        sanitized.stack = redactPii(arg.stack);
      }
      return sanitized;
    }
    if (typeof arg === 'object' && arg !== null) {
      return redactObject(arg);
    }
    return arg;
  });
}

/**
 * Logger central do sistema com redaction automática de PII (Art. 46 LGPD).
 */
export const logger = {
  info(...args: unknown[]): void {
    console.log(...formatLogArguments(args));
  },
  warn(...args: unknown[]): void {
    console.warn(...formatLogArguments(args));
  },
  error(...args: unknown[]): void {
    console.error(...formatLogArguments(args));
  },
  debug(...args: unknown[]): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(...formatLogArguments(args));
    }
  },
};
