import { describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../app';
import prisma from '../config/prisma';
import { createUserToken } from './helpers/auth';
import { cleanupByPrefixes, createCategory } from './helpers/catalog';
import { uniqueId } from './helpers/test-data';

function cleanupTestData() {
  return cleanupByPrefixes({
    userEmailPrefix: 'category-',
    categoryNamePrefix: 'Category Test',
    productTitlePrefix: 'Category Test Product',
  });
}

describe('category integration', () => {
  it('lists categories publicly in ascending name order', async () => {
    await cleanupTestData();

    try {
      await createCategory(`Category Test Zebra ${uniqueId()}`);
      await createCategory(`Category Test Alpha ${uniqueId()}`);

      const response = await request(app).get('/api/categories').expect(200);
      const categoryNames = response.body
        .map((category: { name: string }) => category.name)
        .filter((name: string) => name.startsWith('Category Test'));

      expect(categoryNames).toHaveLength(2);
      expect(categoryNames).toEqual([...categoryNames].sort());
    } finally {
      await cleanupTestData();
    }
  });

  it('allows admins to create, update, and delete categories', async () => {
    await cleanupTestData();

    try {
      const admin = await createUserToken('ADMIN', 'category');

      const createResponse = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: `  Category Test Admin ${uniqueId()}  ` })
        .expect(201);

      expect(createResponse.body.name).toMatch(/^Category Test Admin/);
      expect(createResponse.body.name).not.toMatch(/^ /);
      expect(createResponse.body.name).not.toMatch(/ $/);

      const categoryId = createResponse.body.id as number;

      const updateResponse = await request(app)
        .patch(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: `Category Test Updated ${uniqueId()}` })
        .expect(200);

      expect(updateResponse.body.name).toContain('Category Test Updated');

      await request(app)
        .delete(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(204);
    } finally {
      await cleanupTestData();
    }
  });

  it('rejects category writes from customers', async () => {
    await cleanupTestData();

    try {
      const customer = await createUserToken('CUSTOMER', 'category');

      await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${customer.accessToken}`)
        .send({ name: `Category Test Customer ${uniqueId()}` })
        .expect(403);
    } finally {
      await cleanupTestData();
    }
  });

  it('rejects duplicate category names', async () => {
    await cleanupTestData();

    try {
      const admin = await createUserToken('ADMIN', 'category');
      const categoryName = `Category Test Duplicate ${uniqueId()}`;

      await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: categoryName })
        .expect(201);

      await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .send({ name: categoryName })
        .expect(409);
    } finally {
      await cleanupTestData();
    }
  });

  it('prevents deleting a category that still has products', async () => {
    await cleanupTestData();

    try {
      const admin = await createUserToken('ADMIN', 'category');
      const category = await createCategory();

      await prisma.product.create({
        data: {
          title: `Category Test Product ${uniqueId()}`,
          price: 25,
          stock: 5,
          images: [],
          categoryId: category.id,
        },
      });

      const response = await request(app)
        .delete(`/api/categories/${category.id}`)
        .set('Authorization', `Bearer ${admin.accessToken}`)
        .expect(409);

      expect(response.body.message).toBe('Cannot delete a category that has products');
    } finally {
      await cleanupTestData();
    }
  });
});
