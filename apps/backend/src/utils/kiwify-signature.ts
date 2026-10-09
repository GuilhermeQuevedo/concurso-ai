import crypto from 'node:crypto';

export function verifyKiwifySignature(rawBody: Buffer, signature: string | undefined, token: string): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac('sha1', token).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
