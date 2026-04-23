import prisma from '../config/prisma';
import { ApiError } from '../utils/ApiError';

const cartInclude = {
  items: {
    include: {
      product: {
        select: { id: true, title: true, price: true, stock: true, images: true },
      },
    },
  },
};

async function getOrCreateCart(userId: number) {
  return prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: cartInclude,
  });
}

export async function getCart(userId: number) {
  return getOrCreateCart(userId);
}

export async function addItem(userId: number, productId: number, quantity: number) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw ApiError.notFound('Product not found');

  const cart = await getOrCreateCart(userId);

  const existingItem = cart.items.find((item) => item.productId === productId);
  const newQuantity = (existingItem?.quantity ?? 0) + quantity;

  if (newQuantity > product.stock) {
    throw ApiError.badRequest(`Only ${product.stock} units available in stock`);
  }

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    create: { cartId: cart.id, productId, quantity },
    update: { quantity: newQuantity },
  });

  return getOrCreateCart(userId);
}

export async function updateItem(userId: number, productId: number, quantity: number) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw ApiError.notFound('Cart not found');

  const item = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });
  if (!item) throw ApiError.notFound('Item not found in cart');

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw ApiError.notFound('Product not found');

  if (quantity > product.stock) {
    throw ApiError.badRequest(`Only ${product.stock} units available in stock`);
  }

  await prisma.cartItem.update({
    where: { cartId_productId: { cartId: cart.id, productId } },
    data: { quantity },
  });

  return getOrCreateCart(userId);
}

export async function removeItem(userId: number, productId: number) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw ApiError.notFound('Cart not found');

  const item = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });
  if (!item) throw ApiError.notFound('Item not found in cart');

  await prisma.cartItem.delete({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  return getOrCreateCart(userId);
}
