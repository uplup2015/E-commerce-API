import { NextFunction, Request, Response } from 'express';
import * as productService from '../services/product.service';
import { createProductSchema, updateProductSchema, productQuerySchema } from '../validators/product.validator';
import { ApiError } from '../utils/ApiError';

export async function createProductHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { error, value } = createProductSchema.validate(req.body);
    if (error) throw ApiError.badRequest(error.message);

    const product = await productService.createProduct(value);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
}

export async function getProductsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { error, value } = productQuerySchema.validate(req.query);
    if (error) throw ApiError.badRequest(error.message);

    const result = await productService.getProducts(value);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getProductByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw ApiError.badRequest('Invalid product id');

    const product = await productService.getProductById(id);
    res.json(product);
  } catch (err) {
    next(err);
  }
}

export async function updateProductHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw ApiError.badRequest('Invalid product id');

    const { error, value } = updateProductSchema.validate(req.body);
    if (error) throw ApiError.badRequest(error.message);

    const product = await productService.updateProduct(id, value);
    res.json(product);
  } catch (err) {
    next(err);
  }
}

export async function deleteProductHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw ApiError.badRequest('Invalid product id');

    await productService.deleteProduct(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
