import { ApiError } from '../../utils/ApiError';
import * as cartRepository from './cart.repository';

export async function getCart(userId: number) {
  return cartRepository.getOrCreateCart(userId);
}

export async function addItem(userId: number, productId: number, quantity: number) {
  const product = await cartRepository.findProductById(productId);
  if (!product) throw ApiError.notFound('Product not found');

  const cart = await cartRepository.getOrCreateCart(userId);

  const existingItem = cart.items.find((item) => item.productId === productId);
  const newQuantity = (existingItem?.quantity ?? 0) + quantity;

  if (newQuantity > product.stock) {
    throw ApiError.badRequest(`Only ${product.stock} units available in stock`);
  }

  await cartRepository.upsertCartItem(cart.id, productId, quantity, newQuantity);

  return cartRepository.getOrCreateCart(userId);
}

export async function updateItem(userId: number, productId: number, quantity: number) {
  const cart = await cartRepository.findCartByUserId(userId);
  if (!cart) throw ApiError.notFound('Cart not found');

  const item = await cartRepository.findCartItem(cart.id, productId);
  if (!item) throw ApiError.notFound('Item not found in cart');

  const product = await cartRepository.findProductById(productId);
  if (!product) throw ApiError.notFound('Product not found');

  if (quantity > product.stock) {
    throw ApiError.badRequest(`Only ${product.stock} units available in stock`);
  }

  await cartRepository.updateCartItem(cart.id, productId, quantity);

  return cartRepository.getOrCreateCart(userId);
}

export async function removeItem(userId: number, productId: number) {
  const cart = await cartRepository.findCartByUserId(userId);
  if (!cart) throw ApiError.notFound('Cart not found');

  const item = await cartRepository.findCartItem(cart.id, productId);
  if (!item) throw ApiError.notFound('Item not found in cart');

  await cartRepository.deleteCartItem(cart.id, productId);

  return cartRepository.getOrCreateCart(userId);
}
