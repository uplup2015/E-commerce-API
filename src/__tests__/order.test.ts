import { describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../app';
import prisma from '../config/prisma';
import { createUserToken } from './helpers/auth';
import { cleanupByPrefixes, createCatalogProduct } from './helpers/catalog';

async function addToCart(accessToken: string, productId: number, quantity: number) {
  await request(app)
    .post('/api/cart/items')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ productId, quantity })
    .expect(201);
}

async function cleanupTestData() {
  await cleanupByPrefixes({
    userEmailPrefix: 'order-',
    categoryNamePrefix: 'Order Test Category',
    productTitlePrefix: 'Order Test Product',
  });
}

describe('order integration', () => {
  it('creates an order from the current cart, decrements stock, and clears the cart', async () => {
    await cleanupTestData();

    try {
      const user = await createUserToken('CUSTOMER', 'order');
      const { product } = await createCatalogProduct('Order Test Category', 'Order Test Product', {
        price: 30,
        stock: 8,
        imageUrl: 'https://example.com/order-product.jpg',
      });

      await addToCart(user.accessToken, product.id, 3);

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(201);

      expect(response.body.status).toBe('PENDING');
      expect(response.body.total).toBe('90');
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0]).toMatchObject({
        productId: product.id,
        quantity: 3,
        price: '30',
      });

      const updatedProduct = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      expect(updatedProduct.stock).toBe(5);

      const cart = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);
      expect(cart.body.items).toEqual([]);
    } finally {
      await cleanupTestData();
    }
  });

  it('rejects checkout when the cart is empty', async () => {
    await cleanupTestData();

    try {
      const user = await createUserToken('CUSTOMER', 'order');

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(400);

      expect(response.body.message).toBe('Cart is empty');
    } finally {
      await cleanupTestData();
    }
  });

  it('returns own orders for customers and all orders for admins', async () => {
    await cleanupTestData();

    try {
      const firstUser = await createUserToken('CUSTOMER', 'order');
      const secondUser = await createUserToken('CUSTOMER', 'order');
      const admin = await createUserToken('ADMIN', 'order');
      const firstProduct = await createCatalogProduct('Order Test Category', 'Order Test Product', {
        price: 30,
        stock: 5,
        imageUrl: 'https://example.com/order-product.jpg',
      });
      const secondProduct = await createCatalogProduct('Order Test Category', 'Order Test Product', {
        price: 30,
        stock: 5,
        imageUrl: 'https://example.com/order-product.jpg',
      });

      await addToCart(firstUser.accessToken, firstProduct.product.id, 1);
      await addToCart(secondUser.accessToken, secondProduct.product.id, 1);

      const firstOrder = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${firstUser.accessToken}`)
        .expect(201);
      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${secondUser.accessToken}`)
        .expect(201);

      const customerOrders = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${firstUser.accessToken}`)
        .expect(200);

      expect(customerOrders.body.map((order: { id: number }) => order.id)).toContain(
        firstOrder.body.id,
      );
      expect(
        customerOrders.body.every((order: { userId: number }) => order.userId === firstOrder.body.userId),
      ).toBe(true);

      const adminOrders = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(200);

      const adminOrderIds = adminOrders.body.map((order: { id: number }) => order.id);
      expect(adminOrderIds).toEqual(expect.arrayContaining([firstOrder.body.id]));
      expect(adminOrders.body.length).toBeGreaterThanOrEqual(2);
    } finally {
      await cleanupTestData();
    }
  });

  it('prevents customers from reading other users orders', async () => {
    await cleanupTestData();

    try {
      const owner = await createUserToken('CUSTOMER', 'order');
      const otherUser = await createUserToken('CUSTOMER', 'order');
      const { product } = await createCatalogProduct('Order Test Category', 'Order Test Product', {
        price: 30,
        stock: 5,
        imageUrl: 'https://example.com/order-product.jpg',
      });

      await addToCart(owner.accessToken, product.id, 1);
      const order = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${owner.accessToken}`)
        .expect(201);

      await request(app)
        .get(`/api/orders/${order.body.id}`)
        .set('Authorization', `Bearer ${otherUser.accessToken}`)
        .expect(403);
    } finally {
      await cleanupTestData();
    }
  });

  it('allows admins to update order status', async () => {
    await cleanupTestData();

    try {
      const user = await createUserToken('CUSTOMER', 'order');
      const admin = await createUserToken('ADMIN', 'order');
      const { product } = await createCatalogProduct('Order Test Category', 'Order Test Product', {
        price: 30,
        stock: 5,
        imageUrl: 'https://example.com/order-product.jpg',
      });

      await addToCart(user.accessToken, product.id, 1);
      const order = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(201);

      const response = await request(app)
        .patch(`/api/orders/${order.body.id}/status`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ status: 'CONFIRMED' })
        .expect(200);

      expect(response.body.status).toBe('CONFIRMED');
    } finally {
      await cleanupTestData();
    }
  });
});
