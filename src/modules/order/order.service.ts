import { OrderStatus, Role } from '@prisma/client';
import { ApiError } from '../../utils/ApiError';
import * as orderRepository from './order.repository';

export async function createOrder(userId: number) {
  const cart = await orderRepository.findCartWithProducts(userId);

  if (!cart || cart.items.length === 0) {
    throw ApiError.badRequest('Cart is empty');
  }

  for (const item of cart.items) {
    if (item.quantity > item.product.stock) {
      throw ApiError.badRequest(
        `Insufficient stock for "${item.product.title}". Only ${item.product.stock} available`,
      );
    }
  }

  const total = cart.items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );

  return orderRepository.createOrderFromCart(userId, cart, total);
}

export async function getOrders(userId: number, role: Role) {
  return orderRepository.findOrders(userId, role);
}

export async function getOrderById(orderId: number, userId: number, role: Role) {
  const order = await orderRepository.findOrderById(orderId);

  if (!order) throw ApiError.notFound('Order not found');
  if (role !== 'ADMIN' && order.userId !== userId) {
    throw ApiError.forbidden('Access denied');
  }

  return order;
}

export async function updateOrderStatus(orderId: number, status: OrderStatus) {
  const order = await orderRepository.findOrderById(orderId);
  if (!order) throw ApiError.notFound('Order not found');

  return orderRepository.updateOrderStatus(orderId, status);
}
