import { NextFunction, Request, Response } from 'express';
import * as orderService from '../services/order.service';
import { updateStatusSchema } from '../validators/order.validator';
import { ApiError } from '../utils/ApiError';
import { OrderStatus } from '@prisma/client';

export async function createOrderHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await orderService.createOrder(req.user!.id);
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
}

export async function getOrdersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const orders = await orderService.getOrders(req.user!.id, req.user!.role);
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

export async function getOrderByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw ApiError.badRequest('Invalid order id');

    const order = await orderService.getOrderById(id, req.user!.id, req.user!.role);
    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function updateOrderStatusHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) throw ApiError.badRequest('Invalid order id');

    const { error, value } = updateStatusSchema.validate(req.body);
    if (error) throw ApiError.badRequest(error.message);

    const order = await orderService.updateOrderStatus(id, value.status as OrderStatus);
    res.json(order);
  } catch (err) {
    next(err);
  }
}
