import { NextFunction, Request, Response } from 'express';
import * as categoryService from '../services/category.service';
import { createCategorySchema, updateCategorySchema } from '../validators/category.validator';
import { ApiError } from '../utils/ApiError';

export async function createCategoryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { error, value } = createCategorySchema.validate(req.body);
    if (error) throw ApiError.badRequest(error.message);

    const category = await categoryService.createCategory(value.name);
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
}

export async function getCategoriesHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await categoryService.getCategories();
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

export async function updateCategoryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw ApiError.badRequest('Invalid category id');

    const { error, value } = updateCategorySchema.validate(req.body);
    if (error) throw ApiError.badRequest(error.message);

    const category = await categoryService.updateCategory(id, value.name);
    res.json(category);
  } catch (err) {
    next(err);
  }
}

export async function deleteCategoryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw ApiError.badRequest('Invalid category id');

    await categoryService.deleteCategory(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
