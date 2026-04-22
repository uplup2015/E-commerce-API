import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { requireAdmin } from '../middlewares/requireAdmin';
import {
  createCategoryHandler,
  getCategoriesHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
} from '../controllers/category.controller';

const router = Router();

router.get('/', getCategoriesHandler);
router.post('/', authenticate, requireAdmin, createCategoryHandler);
router.patch('/:id', authenticate, requireAdmin, updateCategoryHandler);
router.delete('/:id', authenticate, requireAdmin, deleteCategoryHandler);

export default router;
