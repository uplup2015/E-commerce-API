import { env } from './config/env';
import app from './app';
import prisma from './config/prisma';

async function main() {
  await prisma.$connect();
  console.log('Database connected');

  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
