import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { AppError } from '../middlewares/error-handler.js';

const CURRENT_VERSION = 'v1';
const IV_LENGTH = 12; // 96 bits standard for AES-GCM
const AUTH_TAG_LENGTH = 16; // 128 bits standard for GCM auth tag

/**
 * Key registry prepared for versioned key rotation.
 * Decryption looks up key by version prefix; encryption always uses CURRENT_VERSION.
 */
const KEY_REGISTRY: Record<string, Buffer> = {
  v1: Buffer.from(env.ENCRYPTION_KEY, 'hex'),
};

/**
 * Checks if a string conforms to the strict versioned encrypted format (v1:<iv_b64>:<tag_b64>:<cipher_b64>).
 */
export function isEncrypted(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  if (!value.startsWith(`${CURRENT_VERSION}:`)) return false;
  const parts = value.split(':');
  if (parts.length !== 4) return false;
  return parts.every((part) => part.length > 0);
}

/**
 * Encrypts plain text using AES-256-GCM with optional Additional Authenticated Data (AAD).
 * Format: v1:<iv_base64>:<auth_tag_base64>:<ciphertext_base64>
 */
export function encryptData(plainText: string, aad?: string): string {
  if (plainText === null || plainText === undefined) {
    throw new AppError(500, 'CRYPTO_ERROR', 'Cannot encrypt null or undefined text');
  }

  const key = KEY_REGISTRY[CURRENT_VERSION];
  if (!key || key.length !== 32) {
    throw new AppError(500, 'CRYPTO_ERROR', `Encryption key for version ${CURRENT_VERSION} is invalid or missing`);
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  if (aad !== undefined && aad !== '') {
    cipher.setAAD(Buffer.from(aad, 'utf8'));
  }

  const cipherBuffer = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${CURRENT_VERSION}:${iv.toString('base64')}:${authTag.toString('base64')}:${cipherBuffer.toString('base64')}`;
}

/**
 * Decrypts a versioned AES-256-GCM payload with optional AAD.
 * Throws AppError if format is invalid, version is unknown, or authentication tag fails.
 * Never returns raw or untrusted text silently.
 */
export function decryptData(payload: string, aad?: string): string {
  if (!payload || typeof payload !== 'string') {
    throw new AppError(500, 'CRYPTO_ERROR', 'Ciphertext payload must be a non-empty string');
  }

  const parts = payload.split(':');
  if (parts.length !== 4) {
    throw new AppError(500, 'CRYPTO_ERROR', 'Invalid ciphertext format. Expected version:iv:tag:ciphertext');
  }

  const [version, ivB64, tagB64, cipherB64] = parts;

  const key = KEY_REGISTRY[version];
  if (!key) {
    throw new AppError(500, 'CRYPTO_ERROR', `Unknown ciphertext key version: ${version}`);
  }

  let iv: Buffer;
  let authTag: Buffer;
  let cipherBuffer: Buffer;

  try {
    iv = Buffer.from(ivB64, 'base64');
    authTag = Buffer.from(tagB64, 'base64');
    cipherBuffer = Buffer.from(cipherB64, 'base64');
  } catch {
    throw new AppError(500, 'CRYPTO_ERROR', 'Malformed base64 component in ciphertext payload');
  }

  if (iv.length !== IV_LENGTH) {
    throw new AppError(500, 'CRYPTO_ERROR', `Invalid IV length: expected ${IV_LENGTH} bytes, got ${iv.length}`);
  }

  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new AppError(500, 'CRYPTO_ERROR', `Invalid auth tag length: expected ${AUTH_TAG_LENGTH} bytes, got ${authTag.length}`);
  }

  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    if (aad !== undefined && aad !== '') {
      decipher.setAAD(Buffer.from(aad, 'utf8'));
    }

    const decrypted = Buffer.concat([
      decipher.update(cipherBuffer),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(500, 'CRYPTO_ERROR', 'Decryption failed: corrupted ciphertext, invalid authentication tag, or AAD mismatch');
  }
}
