import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  const isDev = env.nodeEnv === 'development';
  console.error(err);

  res.status(500).json({
    message: 'Internal server error',
    ...(isDev && { stack: err.stack }),
  });
}
