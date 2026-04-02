// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Utils — Structured logger (pino)
//
// In development: pretty-prints to console.
// In production:  outputs newline-delimited JSON.
// ============================================================

import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  ...(isDev ? {
    transport: {
      target:  'pino-pretty',
      options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
    },
  } : {}),
});

export default logger;
