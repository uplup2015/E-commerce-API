import { describe, expect, it } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { createAuthRateLimiter } from '../middlewares/security';
import app from '../app';

describe('security middleware', () => {
  it('sets common security headers', async () => {
    const response = await request(app).get('/health').expect(200);

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  it('rate limits repeated failed auth-style requests', async () => {
    const testApp = express();

    testApp.use(
      createAuthRateLimiter({
        windowMs: 60 * 1000,
        limit: 2,
        skipSuccessfulRequests: false,
      }),
    );
    testApp.post('/login', (_req, res) => {
      res.status(401).json({ message: 'Invalid credentials' });
    });

    await request(testApp).post('/login').expect(401);
    await request(testApp).post('/login').expect(401);

    const response = await request(testApp).post('/login').expect(429);

    expect(response.body).toEqual({
      message: 'Too many authentication attempts, please try again later',
    });
    expect(response.headers['ratelimit']).toBeDefined();
  });
});
