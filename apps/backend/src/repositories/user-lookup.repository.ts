import { prisma } from '../database/prisma.js';

const pair = (a: string, b: string) => (a < b ? { userLowId: a, userHighId: b } : { userLowId: b, userHighId: a });

// Quem digita "@nick" ou o código de 8 caracteres de um amigo cai na mesma busca.
export async function findUserIdByIdentifier(identifier: string): Promise<{ id: string } | null> {
  const clean = identifier.trim().replace(/^@/, '');
  if (!clean) return null;
  const byCode = await prisma.user.findUnique({ where: { friendCode: clean.toUpperCase() }, select: { id: true } });
  if (byCode) return byCode;
  return prisma.user.findUnique({ where: { nickname: clean }, select: { id: true } });
}

export async function areFriends(a: string, b: string): Promise<boolean> {
  const row = await prisma.friendship.findUnique({ where: { userLowId_userHighId: pair(a, b) }, select: { status: true } });
  return row?.status === 'ACCEPTED';
}
