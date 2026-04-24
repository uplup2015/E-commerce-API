import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { requireAdmin } from '../middlewares/requireAdmin';
import {
  createOrderHandler,
  getOrdersHandler,
  getOrderByIdHandler,
  updateOrderStatusHandler,
} from '../controllers/order.controller';

const router = Router();

router.use(authenticate);

router.post('/', createOrderHandler);
router.get('/', getOrdersHandler);
router.get('/:id', getOrderByIdHandler);
router.patch('/:id/status', requireAdmin, updateOrderStatusHandler);

export default router;
