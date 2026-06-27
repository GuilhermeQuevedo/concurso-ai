import { SignJWT, jwtVerify } from 'jose';
import { env } from '../config/env.js';
import type { TokenPayload } from '../interfaces/auth.interfaces.js';

const secret = new TextEncoder().encode(env.JWT_SECRET);
const ALGORITHM = 'HS256';

export async function generateAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId, role: payload.role })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, secret);
  return {
    userId: payload.userId as string,
    role: payload.role as string,
  };
}

export function generateRefreshToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
