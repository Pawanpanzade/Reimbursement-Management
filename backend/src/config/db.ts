import { PrismaClient } from '@prisma/client';

import { env } from './env';

const logLevels: Array<'query' | 'info' | 'warn' | 'error'> =
  env.nodeEnv === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'];

export const prisma = new PrismaClient({
  log: logLevels,
});

export const connectDatabase = async (): Promise<void> => {
  await prisma.$connect();
};

export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
};
