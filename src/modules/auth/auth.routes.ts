import { Router } from 'express';
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
} from './auth.controller';
import { authRateLimiter } from '../../middlewares/security';

const router = Router();

router.post('/register', authRateLimiter, registerHandler);
router.post('/login', authRateLimiter, loginHandler);
router.post('/refresh', authRateLimiter, refreshHandler);
router.post('/logout', logoutHandler);

export default router;
