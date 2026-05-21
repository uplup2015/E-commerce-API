import { describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../app';
import { createUserToken } from './helpers/auth';
import { cleanupByPrefixes, createCategory, createCatalogProduct } from './helpers/catalog';
import { uniqueId } from './helpers/test-data';

async function cleanupTestData() {
  await cleanupByPrefixes({
    userEmailPrefix: 'product-',
    categoryNamePrefix: 'Product Test',
    productTitlePrefix: 'Test Product',
  });
  await cleanupByPrefixes({ productTitlePrefix: 'Admin Product' });
  await cleanupByPrefixes({ productTitlePrefix: 'Updated Admin Product' });
  await cleanupByPrefixes({ productTitlePrefix: 'Searchable Keyboard' });
  await cleanupByPrefixes({ productTitlePrefix: 'Searchable Mouse' });
}

describe('product integration', () => {
  it('lists products with pagination metadata', async () => {
    await cleanupTestData();

    try {
      await createCatalogProduct('Product Test', 'Test Product', {
        title: `Test Product ${uniqueId()}`,
      });
      await createCatalogProduct('Product Test', 'Test Product', {
        title: `Test Product ${uniqueId()}`,
      });

      const response = await request(app).get('/api/products?page=1&limit=1').expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.meta).toMatchObject({
        page: 1,
        limit: 1,
      });
      expect(response.body.meta.total).toBeGreaterThanOrEqual(2);
      expect(response.body.meta.totalPages).toBeGreaterThanOrEqual(2);
    } finally {
      await cleanupTestData();
    }
  });

  it('filters products by search and category', async () => {
    await cleanupTestData();

    try {
      const keyboardCategory = await createCategory();
      const mouseCategory = await createCategory();

      await createCatalogProduct('Product Test', 'Searchable Keyboard', {
        title: `Searchable Keyboard ${uniqueId()}`,
        categoryId: keyboardCategory.id,
      });
      await createCatalogProduct('Product Test', 'Searchable Mouse', {
        title: `Searchable Mouse ${uniqueId()}`,
        categoryId: mouseCategory.id,
      });

      const response = await request(app)
        .get(`/api/products?search=keyboard&categoryId=${keyboardCategory.id}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(
        response.body.data.every(
          (product: { title: string; categoryId: number }) =>
            product.title.toLowerCase().includes('keyboard') &&
            product.categoryId === keyboardCategory.id,
        ),
      ).toBe(true);
    } finally {
      await cleanupTestData();
    }
  });

  it('allows admins to create, update, and delete products', async () => {
    await cleanupTestData();

    try {
      const category = await createCategory();
      const admin = await createUserToken('ADMIN', 'product');

      const createResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          title: `Admin Product ${uniqueId()}`,
          price: 99.99,
          stock: 15,
          images: ['https://example.com/admin-product.jpg'],
          categoryId: category.id,
        })
        .expect(201);

      expect(createResponse.body.category).toMatchObject({ id: category.id });
      expect(createResponse.body.price).toBe('99.99');

      const productId = createResponse.body.id as number;

      const updateResponse = await request(app)
        .patch(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          title: `Updated Admin Product ${uniqueId()}`,
          stock: 7,
        })
        .expect(200);

      expect(updateResponse.body.stock).toBe(7);
      expect(updateResponse.body.title).toContain('Updated Admin Product');

      await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(204);

      await request(app).get(`/api/products/${productId}`).expect(404);
    } finally {
      await cleanupTestData();
    }
  });

  it('rejects product writes from customers', async () => {
    await cleanupTestData();

    try {
      const category = await createCategory();
      const customer = await createUserToken('CUSTOMER', 'product');

      await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${customer.accessToken}`)
        .send({
          title: `Admin Product ${uniqueId()}`,
          price: 99.99,
          stock: 15,
          images: ['https://example.com/admin-product.jpg'],
          categoryId: category.id,
        })
        .expect(403);
    } finally {
      await cleanupTestData();
    }
  });

  it('rejects product creation for a missing category', async () => {
    await cleanupTestData();

    try {
      const admin = await createUserToken('ADMIN', 'product');

      await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({
          title: `Admin Product ${uniqueId()}`,
          price: 99.99,
          stock: 15,
          images: ['https://example.com/admin-product.jpg'],
          categoryId: 999999999,
        })
        .expect(404);
    } finally {
      await cleanupTestData();
    }
  });
});
