import request from 'supertest';

export function getRefreshCookie(response: request.Response) {
  const refreshCookie = getSetCookieHeader(response).find((cookie) =>
    cookie.startsWith('refreshToken='),
  );

  if (!refreshCookie) throw new Error('Expected refreshToken cookie');
  return refreshCookie.split(';')[0];
}

export function getSetCookieText(response: request.Response) {
  return getSetCookieHeader(response).join('; ');
}

function getSetCookieHeader(response: request.Response) {
  const cookies = response.headers['set-cookie'];
  if (!cookies) return [];
  return Array.isArray(cookies) ? cookies : [cookies];
}
