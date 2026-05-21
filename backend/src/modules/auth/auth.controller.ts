import { NextFunction, Request, Response } from 'express';
import type { CookieOptions } from 'express';
import * as authService from './auth.service';
import { env } from '../../config/env';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} from './auth.validator';
import { ApiError } from '../../utils/ApiError';
import { parseDurationMs } from '../../utils/duration';

const REFRESH_TOKEN_COOKIE = 'refreshToken';

export async function registerHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) throw ApiError.badRequest(error.message);

    const result = await authService.register(
      value.name,
      value.email,
      value.password,
      getTokenMetadata(req),
    );
    setRefreshTokenCookie(res, result.refreshToken);
    res.status(201).json(toAuthResponse(result));
  } catch (err) {
    next(err);
  }
}

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) throw ApiError.badRequest(error.message);

    const result = await authService.login(value.email, value.password, getTokenMetadata(req));
    setRefreshTokenCookie(res, result.refreshToken);
    res.json(toAuthResponse(result));
  } catch (err) {
    next(err);
  }
}

export async function refreshHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { error, value } = refreshSchema.validate(req.body);
    if (error) throw ApiError.badRequest(error.message);

    const refreshToken = getRefreshToken(req, value.refreshToken);
    const tokens = await authService.refresh(refreshToken, getTokenMetadata(req));

    setRefreshTokenCookie(res, tokens.refreshToken);
    res.json({ accessToken: tokens.accessToken });
  } catch (err) {
    next(err);
  }
}

export async function meHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getCurrentUser(req.user!.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

function getTokenMetadata(req: Request) {
  return {
    userAgent: req.get('user-agent'),
    ipAddress: req.ip,
  };
}

function getRefreshToken(req: Request, bodyToken?: string) {
  const refreshToken = bodyToken ?? req.cookies?.[REFRESH_TOKEN_COOKIE];
  if (!refreshToken) throw ApiError.badRequest('Refresh token is required');
  return refreshToken;
}

function setRefreshTokenCookie(res: Response, refreshToken: string) {
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...refreshTokenCookieOptions(),
    maxAge: parseDurationMs(env.jwt.refreshExpiresIn),
  });
}

function clearRefreshTokenCookie(res: Response) {
  res.clearCookie(REFRESH_TOKEN_COOKIE, refreshTokenCookieOptions());
}

function refreshTokenCookieOptions(): CookieOptions {
  const isProduction = env.nodeEnv === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/api/auth',
  };
}

function toAuthResponse<T extends { refreshToken: string }>(result: T) {
  const { refreshToken: _refreshToken, ...response } = result;
  return response;
}

export async function logoutHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { error, value } = logoutSchema.validate(req.body);
    if (error) throw ApiError.badRequest(error.message);

    const refreshToken = getRefreshToken(req, value.refreshToken);

    await authService.logout(refreshToken);
    clearRefreshTokenCookie(res);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
