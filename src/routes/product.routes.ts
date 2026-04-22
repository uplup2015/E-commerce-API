import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { requireAdmin } from '../middlewares/requireAdmin';
import {
  createProductHandler,
  getProductsHandler,
  getProductByIdHandler,
  updateProductHandler,
  deleteProductHandler,
} from '../controllers/product.controller';

const router = Router();

router.get('/', getProductsHandler);
router.get('/:id', getProductByIdHandler);
router.post('/', authenticate, requireAdmin, createProductHandler);
router.patch('/:id', authenticate, requireAdmin, updateProductHandler);
router.delete('/:id', authenticate, requireAdmin, deleteProductHandler);

export default router;
