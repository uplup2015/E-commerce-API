import { OrderStatus, Role } from '@prisma/client';
import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';

const orderInclude = {
  items: {
    include: {
      product: { select: { id: true, title: true } },
    },
  },
};

export async function createOrder(userId: number) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } } },
  });

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

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId,
        total,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          })),
        },
      },
      include: orderInclude,
    });

    for (const item of cart.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return order;
  });
}

export async function getOrders(userId: number, role: Role) {
  const where = role === 'ADMIN' ? {} : { userId };

  return prisma.order.findMany({
    where,
    include: orderInclude,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getOrderById(orderId: number, userId: number, role: Role) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: orderInclude,
  });

  if (!order) throw ApiError.notFound('Order not found');
  if (role !== 'ADMIN' && order.userId !== userId) {
    throw ApiError.forbidden('Access denied');
  }

  return order;
}

export async function updateOrderStatus(orderId: number, status: OrderStatus) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw ApiError.notFound('Order not found');

  return prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: orderInclude,
  });
}
