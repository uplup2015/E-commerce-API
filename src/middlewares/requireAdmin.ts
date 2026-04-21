import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== 'ADMIN') {
    return next(ApiError.forbidden('Admin access required'));
  }
  next();
}
