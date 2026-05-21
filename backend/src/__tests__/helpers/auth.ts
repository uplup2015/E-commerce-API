import { Role } from '@prisma/client';
import request from 'supertest';
import app from '../../app';
import prisma from '../../config/prisma';
import { testPassword, uniqueId } from './test-data';

export async function createUserToken(role: Role = 'CUSTOMER', prefix = 'test-user') {
  const email = `${prefix}-${role.toLowerCase()}-${uniqueId()}@example.com`;

  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({ name: `${prefix} ${role}`, email, password: testPassword })
    .expect(201);

  if (role === 'ADMIN') {
    await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email, password: testPassword })
      .expect(200);

    return {
      email,
      accessToken: loginResponse.body.accessToken as string,
    };
  }

  return {
    email,
    accessToken: registerResponse.body.accessToken as string,
  };
}

export function deleteUsersByEmailPrefix(prefix: string) {
  return prisma.user.deleteMany({ where: { email: { startsWith: prefix } } });
}
