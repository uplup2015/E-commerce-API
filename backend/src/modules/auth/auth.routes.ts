import { Router } from 'express';
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  meHandler,
} from './auth.controller';
import { authRateLimiter } from '../../middlewares/security';
import { authenticate } from '../../middlewares/authenticate';

const router = Router();

router.post('/register', authRateLimiter, registerHandler);
router.post('/login', authRateLimiter, loginHandler);
router.post('/refresh', authRateLimiter, refreshHandler);
router.post('/logout', logoutHandler);
router.get('/me', authenticate, meHandler);

export default router;
