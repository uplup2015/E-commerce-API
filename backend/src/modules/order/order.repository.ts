import { OrderStatus, Prisma, Role } from '@prisma/client';
import prisma from '../../config/prisma';

const orderInclude = {
  items: {
    include: {
      product: { select: { id: true, title: true } },
    },
  },
};

type CartWithProducts = Prisma.CartGetPayload<{
  include: { items: { include: { product: true } } };
}>;

export function findCartWithProducts(userId: number) {
  return prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } } },
  });
}

export function createOrderFromCart(userId: number, cart: CartWithProducts, total: number) {
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

export function findOrders(userId: number, role: Role) {
  const where = role === 'ADMIN' ? {} : { userId };

  return prisma.order.findMany({
    where,
    include: orderInclude,
    orderBy: { createdAt: 'desc' },
  });
}

export function findOrderById(orderId: number) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: orderInclude,
  });
}

export function updateOrderStatus(orderId: number, status: OrderStatus) {
  return prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: orderInclude,
  });
}
