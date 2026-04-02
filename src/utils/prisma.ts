// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Prisma client singleton
//
// Single shared PrismaClient instance.
// In development, prevents hot-reload from opening
// multiple connections.
// ============================================================

import { PrismaClient } from '@prisma/client';

declare global {
  // Allow global var in Node.js
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export default prisma;
