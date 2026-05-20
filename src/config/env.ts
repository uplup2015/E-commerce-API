import 'dotenv/config';

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

const nodeEnv = process.env.NODE_ENV ?? 'development';
const corsOrigin = process.env.CORS_ORIGIN;

if (nodeEnv === 'production' && !corsOrigin) {
  throw new Error('Missing required environment variable: CORS_ORIGIN');
}

export const env = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv,
  databaseUrl: requireEnv('DATABASE_URL'),
  corsOrigin,
  jwt: {
    accessSecret: requireEnv('JWT_ACCESS_SECRET'),
    refreshSecret: requireEnv('JWT_REFRESH_SECRET'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
} as const;
