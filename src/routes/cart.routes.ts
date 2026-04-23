import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import {
  getCartHandler,
  addItemHandler,
  updateItemHandler,
  removeItemHandler,
} from '../controllers/cart.controller';

const router = Router();

router.use(authenticate);

router.get('/', getCartHandler);
router.post('/items', addItemHandler);
router.patch('/items/:productId', updateItemHandler);
router.delete('/items/:productId', removeItemHandler);

export default router;
