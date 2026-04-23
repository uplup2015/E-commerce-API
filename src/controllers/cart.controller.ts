import { NextFunction, Request, Response } from 'express';
import * as cartService from '../services/cart.service';
import { addItemSchema, updateItemSchema } from '../validators/cart.validator';
import { ApiError } from '../utils/ApiError';

export async function getCartHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const cart = await cartService.getCart(req.user!.id);
    res.json(cart);
  } catch (err) {
    next(err);
  }
}

export async function addItemHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { error, value } = addItemSchema.validate(req.body);
    if (error) throw ApiError.badRequest(error.message);

    const cart = await cartService.addItem(req.user!.id, value.productId, value.quantity);
    res.status(201).json(cart);
  } catch (err) {
    next(err);
  }
}

export async function updateItemHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const productId = parseInt(req.params.productId);
    if (isNaN(productId)) throw ApiError.badRequest('Invalid product id');

    const { error, value } = updateItemSchema.validate(req.body);
    if (error) throw ApiError.badRequest(error.message);

    const cart = await cartService.updateItem(req.user!.id, productId, value.quantity);
    res.json(cart);
  } catch (err) {
    next(err);
  }
}

export async function removeItemHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const productId = parseInt(req.params.productId);
    if (isNaN(productId)) throw ApiError.badRequest('Invalid product id');

    const cart = await cartService.removeItem(req.user!.id, productId);
    res.json(cart);
  } catch (err) {
    next(err);
  }
}
