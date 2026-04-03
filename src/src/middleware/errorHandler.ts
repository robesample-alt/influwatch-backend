// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Middleware — error handler
//
// Catches all unhandled errors from route handlers.
// Formats Prisma errors into readable API responses.
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Prisma — record not found
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'Record not found',
        code:  err.code,
      });
    }

    // Foreign key constraint (e.g. invalid ambassadorId or campaignId)
    if (err.code === 'P2003') {
      return res.status(400).json({
        error:   'Invalid reference — related record does not exist',
        code:    err.code,
        field:   err.meta?.field_name,
      });
    }

    // Unique constraint violation
    if (err.code === 'P2002') {
      return res.status(409).json({
        error:   'Unique constraint violation',
        code:    err.code,
        fields:  err.meta?.target,
      });
    }

    console.error('[Prisma Error]', err.code, err.message);
    return res.status(500).json({
      error: 'Database error',
      code:  err.code,
    });
  }

  // Prisma — validation error
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      error:   'Invalid data shape — check enum values and required fields',
      details: err.message.split('\n').slice(-3).join(' '),
    });
  }

  // Generic
  if (err instanceof Error) {
    console.error('[Error]', err.message, err.stack);
    return res.status(500).json({ error: err.message });
  }

  return res.status(500).json({ error: 'Unknown server error' });
}
