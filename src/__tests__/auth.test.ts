import { describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../app';
import prisma from '../config/prisma';
import { getRefreshCookie, getSetCookieText } from './helpers/cookies';
import { testPassword, uniqueId } from './helpers/test-data';

async function deleteUserByEmail(email: string) {
  await prisma.user.deleteMany({ where: { email } });
}

describe('auth integration', () => {
  it('registers a user, returns an access token, and sets an HTTP-only refresh cookie', async () => {
    const email = `auth-test-${uniqueId()}@example.com`;

    try {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Auth Test', email, password: testPassword })
        .expect(201);

      expect(response.body.user).toMatchObject({
        email,
        name: 'Auth Test',
        role: 'CUSTOMER',
      });
      expect(response.body.accessToken).toEqual(expect.any(String));
      expect(response.body.refreshToken).toBeUndefined();

      const setCookie = getSetCookieText(response);
      expect(setCookie).toContain('refreshToken=');
      expect(setCookie).toContain('HttpOnly');
      expect(setCookie).toContain('SameSite=Lax');
    } finally {
      await deleteUserByEmail(email);
    }
  });

  it('logs in and sets a fresh HTTP-only refresh cookie', async () => {
    const email = `auth-test-${uniqueId()}@example.com`;

    try {
      await request(app)
        .post('/api/auth/register')
        .send({ name: 'Auth Test', email, password: testPassword })
        .expect(201);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email, password: testPassword })
        .expect(200);

      expect(response.body.user).toMatchObject({ email, role: 'CUSTOMER' });
      expect(response.body.accessToken).toEqual(expect.any(String));
      expect(response.body.refreshToken).toBeUndefined();
      expect(getSetCookieText(response)).toContain('HttpOnly');
    } finally {
      await deleteUserByEmail(email);
    }
  });

  it('rotates refresh tokens and revokes the previous token', async () => {
    const email = `auth-test-${uniqueId()}@example.com`;

    try {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Auth Test', email, password: testPassword })
        .expect(201);

      const originalCookie = getRefreshCookie(registerResponse);

      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', originalCookie)
        .send({})
        .expect(200);

      const rotatedCookie = getRefreshCookie(refreshResponse);

      expect(refreshResponse.body.accessToken).toEqual(expect.any(String));
      expect(refreshResponse.body.refreshToken).toBeUndefined();
      expect(rotatedCookie).not.toEqual(originalCookie);

      const user = await prisma.user.findUniqueOrThrow({
        where: { email },
        include: { refreshTokens: true },
      });

      expect(user.refreshTokens).toHaveLength(2);
      expect(user.refreshTokens.filter((token) => token.revokedAt === null)).toHaveLength(1);
      expect(user.refreshTokens.filter((token) => token.revokedAt !== null)).toHaveLength(1);
    } finally {
      await deleteUserByEmail(email);
    }
  });

  it('logs out by revoking the refresh token and clearing the cookie', async () => {
    const email = `auth-test-${uniqueId()}@example.com`;

    try {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Auth Test', email, password: testPassword })
        .expect(201);

      const cookie = getRefreshCookie(registerResponse);

      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookie)
        .send({})
        .expect(204);

      const logoutCookie = getSetCookieText(logoutResponse);
      expect(logoutCookie).toContain('refreshToken=');
      expect(logoutCookie).toContain('Expires=Thu, 01 Jan 1970');

      await request(app).post('/api/auth/refresh').set('Cookie', cookie).send({}).expect(401);

      const user = await prisma.user.findUniqueOrThrow({
        where: { email },
        include: { refreshTokens: true },
      });

      expect(user.refreshTokens.every((token) => token.revokedAt !== null)).toBe(true);
    } finally {
      await deleteUserByEmail(email);
    }
  });

  it('detects refresh token reuse and revokes active refresh tokens for the user', async () => {
    const email = `auth-test-${uniqueId()}@example.com`;

    try {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Auth Test', email, password: testPassword })
        .expect(201);

      const originalCookie = getRefreshCookie(registerResponse);

      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', originalCookie)
        .send({})
        .expect(200);

      const rotatedCookie = getRefreshCookie(refreshResponse);

      await request(app).post('/api/auth/refresh').set('Cookie', originalCookie).send({}).expect(401);
      await request(app).post('/api/auth/refresh').set('Cookie', rotatedCookie).send({}).expect(401);

      const user = await prisma.user.findUniqueOrThrow({
        where: { email },
        include: { refreshTokens: true },
      });

      expect(user.refreshTokens.every((token) => token.revokedAt !== null)).toBe(true);
    } finally {
      await deleteUserByEmail(email);
    }
  });
});
