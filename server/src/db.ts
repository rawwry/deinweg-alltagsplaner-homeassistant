import { PrismaClient } from '@prisma/client';
import { getDatabaseUrl } from './config/paths.js';

// Set DATABASE_URL if not set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = getDatabaseUrl();
}

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
});
