import prisma from '../../config/prisma';

const cartInclude = {
  items: {
    include: {
      product: {
        select: { id: true, title: true, price: true, stock: true, images: true },
      },
    },
  },
};

export function getOrCreateCart(userId: number) {
  return prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: cartInclude,
  });
}

export function findCartByUserId(userId: number) {
  return prisma.cart.findUnique({ where: { userId } });
}

export function findProductById(id: number) {
  return prisma.product.findUnique({ where: { id } });
}

export function findCartItem(cartId: number, productId: number) {
  return prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId, productId } },
  });
}

export function upsertCartItem(
  cartId: number,
  productId: number,
  quantity: number,
  newQuantity: number,
) {
  return prisma.cartItem.upsert({
    where: { cartId_productId: { cartId, productId } },
    create: { cartId, productId, quantity },
    update: { quantity: newQuantity },
  });
}

export function updateCartItem(cartId: number, productId: number, quantity: number) {
  return prisma.cartItem.update({
    where: { cartId_productId: { cartId, productId } },
    data: { quantity },
  });
}

export function deleteCartItem(cartId: number, productId: number) {
  return prisma.cartItem.delete({
    where: { cartId_productId: { cartId, productId } },
  });
}
