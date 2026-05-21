import prisma from '../../config/prisma';

interface CreateUserData {
  name: string;
  email: string;
  password: string;
}

interface CreateRefreshTokenData {
  id: string;
  tokenHash: string;
  userId: number;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
}

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export function findUserById(id: number) {
  return prisma.user.findUnique({ where: { id } });
}

export function findPublicUserById(id: number) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true },
  });
}

export function createUser(data: CreateUserData) {
  return prisma.user.create({
    data,
    select: { id: true, name: true, email: true, role: true },
  });
}

export function findRefreshTokenById(id: string) {
  return prisma.refreshToken.findUnique({ where: { id } });
}

export function createRefreshToken(data: CreateRefreshTokenData) {
  return prisma.refreshToken.create({ data });
}

export function markRefreshTokenAsReplaced(id: string, replacedByTokenId: string) {
  return prisma.refreshToken.update({
    where: { id },
    data: {
      revokedAt: new Date(),
      replacedByTokenId,
    },
  });
}

export function revokeRefreshToken(id: string) {
  return prisma.refreshToken.updateMany({
    where: { id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export function revokeAllUserRefreshTokens(userId: number) {
  return prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
