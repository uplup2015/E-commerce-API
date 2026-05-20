import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { parseDurationMs } from '../../utils/duration';
import * as authRepository from './auth.repository';

const SALT_ROUNDS = 10;

interface TokenMetadata {
  userAgent?: string;
  ipAddress?: string;
}

export async function register(
  name: string,
  email: string,
  password: string,
  metadata: TokenMetadata = {},
) {
  const existing = await authRepository.findUserByEmail(email);
  if (existing) throw ApiError.conflict('Email already in use');

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await authRepository.createUser({
    name,
    email,
    password: hashed,
  });

  const { refreshTokenId: _refreshTokenId, ...tokens } = await generateTokens(
    user.id,
    user.role,
    metadata,
  );
  return { user, ...tokens };
}

export async function login(email: string, password: string, metadata: TokenMetadata = {}) {
  const user = await authRepository.findUserByEmail(email);
  if (!user) throw ApiError.unauthorized('Invalid credentials');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw ApiError.unauthorized('Invalid credentials');

  const { refreshTokenId: _refreshTokenId, ...tokens } = await generateTokens(
    user.id,
    user.role,
    metadata,
  );
  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    ...tokens,
  };
}

export async function refresh(refreshToken: string, metadata: TokenMetadata = {}) {
  let payload: { userId: number; tokenId: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const storedToken = await authRepository.findRefreshTokenById(payload.tokenId);

  if (!storedToken || storedToken.tokenHash !== hashToken(refreshToken)) {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  if (storedToken.revokedAt) {
    await authRepository.revokeAllUserRefreshTokens(storedToken.userId);
    throw ApiError.unauthorized('Refresh token reuse detected');
  }

  if (storedToken.expiresAt <= new Date()) {
    await authRepository.revokeRefreshToken(storedToken.id);
    throw ApiError.unauthorized('Expired refresh token');
  }

  const user = await authRepository.findUserById(payload.userId);
  if (!user) throw ApiError.unauthorized('User not found');

  const tokens = await generateTokens(user.id, user.role, metadata);
  await authRepository.markRefreshTokenAsReplaced(storedToken.id, tokens.refreshTokenId);

  const { refreshTokenId: _refreshTokenId, ...rotatedTokens } = tokens;
  return rotatedTokens;
}

export async function logout(refreshToken: string) {
  let payload: { tokenId: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    return;
  }

  await authRepository.revokeRefreshToken(payload.tokenId);
}

async function generateTokens(
  userId: number,
  role: import('@prisma/client').Role,
  metadata: TokenMetadata = {},
) {
  const refreshTokenId = crypto.randomUUID();
  const refreshToken = signRefreshToken({ userId, tokenId: refreshTokenId });

  await authRepository.createRefreshToken({
    id: refreshTokenId,
    tokenHash: hashToken(refreshToken),
    userId,
    userAgent: metadata.userAgent,
    ipAddress: metadata.ipAddress,
    expiresAt: getRefreshTokenExpiresAt(),
  });

  return {
    accessToken: signAccessToken({ userId, role }),
    refreshToken,
    refreshTokenId,
  };
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getRefreshTokenExpiresAt() {
  return new Date(Date.now() + parseDurationMs(env.jwt.refreshExpiresIn));
}
