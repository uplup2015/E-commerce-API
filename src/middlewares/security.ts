import helmet from 'helmet';
import rateLimit, { Options } from 'express-rate-limit';
import { env } from '../config/env';

const isTest = env.nodeEnv === 'test';

export const securityHeaders = helmet();

export function createApiRateLimiter(options: Partial<Options> = {}) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: isTest ? 1000 : 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later' },
    ...options,
  });
}

export function createAuthRateLimiter(options: Partial<Options> = {}) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: isTest ? 1000 : 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { message: 'Too many authentication attempts, please try again later' },
    ...options,
  });
}

export const apiRateLimiter = createApiRateLimiter();
export const authRateLimiter = createAuthRateLimiter();
