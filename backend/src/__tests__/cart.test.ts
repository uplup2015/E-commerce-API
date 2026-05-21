import { describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../app';
import { createUserToken } from './helpers/auth';
import { cleanupByPrefixes, createCatalogProduct } from './helpers/catalog';

async function cleanupTestData() {
  await cleanupByPrefixes({
    userEmailPrefix: 'cart-',
    categoryNamePrefix: 'Cart Test Category',
    productTitlePrefix: 'Cart Test Product',
  });
}

describe('cart integration', () => {
  it('requires authentication for cart access', async () => {
    await request(app).get('/api/cart').expect(401);
  });

  it('creates an empty cart on demand for an authenticated user', async () => {
    await cleanupTestData();

    try {
      const user = await createUserToken('CUSTOMER', 'cart');

      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      expect(response.body.userId).toEqual(expect.any(Number));
      expect(response.body.items).toEqual([]);
    } finally {
      await cleanupTestData();
    }
  });

  it('adds items and accumulates quantity for an existing cart item', async () => {
    await cleanupTestData();

    try {
      const user = await createUserToken('CUSTOMER', 'cart');
      const { product } = await createCatalogProduct('Cart Test Category', 'Cart Test Product', {
        stock: 10,
        price: 19.99,
        imageUrl: 'https://example.com/cart-product.jpg',
      });

      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ productId: product.id, quantity: 2 })
        .expect(201);

      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ productId: product.id, quantity: 3 })
        .expect(201);

      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0]).toMatchObject({
        productId: product.id,
        quantity: 5,
      });
    } finally {
      await cleanupTestData();
    }
  });

  it('rejects cart quantities above product stock', async () => {
    await cleanupTestData();

    try {
      const user = await createUserToken('CUSTOMER', 'cart');
      const { product } = await createCatalogProduct('Cart Test Category', 'Cart Test Product', {
        stock: 2,
        price: 19.99,
        imageUrl: 'https://example.com/cart-product.jpg',
      });

      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ productId: product.id, quantity: 3 })
        .expect(400);

      expect(response.body.message).toBe('Only 2 units available in stock');
    } finally {
      await cleanupTestData();
    }
  });

  it('updates item quantity and removes items', async () => {
    await cleanupTestData();

    try {
      const user = await createUserToken('CUSTOMER', 'cart');
      const { product } = await createCatalogProduct('Cart Test Category', 'Cart Test Product', {
        stock: 10,
        price: 19.99,
        imageUrl: 'https://example.com/cart-product.jpg',
      });

      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ productId: product.id, quantity: 2 })
        .expect(201);

      const updateResponse = await request(app)
        .patch(`/api/cart/items/${product.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({ quantity: 4 })
        .expect(200);

      expect(updateResponse.body.items[0]).toMatchObject({
        productId: product.id,
        quantity: 4,
      });

      const removeResponse = await request(app)
        .delete(`/api/cart/items/${product.id}`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);

      expect(removeResponse.body.items).toEqual([]);
    } finally {
      await cleanupTestData();
    }
  });
});
