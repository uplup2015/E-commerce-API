import { Router } from 'express';
import { registerHandler, loginHandler, refreshHandler } from '../controllers/auth.controller';

const router = Router();

router.post('/register', registerHandler);
router.post('/login', loginHandler);
router.post('/refresh', refreshHandler);

export default router;
