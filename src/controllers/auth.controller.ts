import { NextFunction, Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { registerSchema, loginSchema, refreshSchema } from '../validators/auth.validator';
import { ApiError } from '../utils/ApiError';

export async function registerHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) throw ApiError.badRequest(error.message);

    const result = await authService.register(value.name, value.email, value.password);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) throw ApiError.badRequest(error.message);

    const result = await authService.login(value.email, value.password);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function refreshHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { error, value } = refreshSchema.validate(req.body);
    if (error) throw ApiError.badRequest(error.message);

    const tokens = await authService.refresh(value.refreshToken);
    res.json(tokens);
  } catch (err) {
    next(err);
  }
}
