"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Middleware — error handler
//
// Catches all unhandled errors from route handlers.
// Formats Prisma errors into readable API responses.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const client_1 = require("@prisma/client");
function errorHandler(err, _req, res, _next) {
    // Prisma — record not found
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2025') {
            return res.status(404).json({
                error: 'Record not found',
                code: err.code,
            });
        }
        // Foreign key constraint (e.g. invalid ambassadorId or campaignId)
        if (err.code === 'P2003') {
            return res.status(400).json({
                error: 'Invalid reference — related record does not exist',
                code: err.code,
                field: err.meta?.field_name,
            });
        }
        // Unique constraint violation
        if (err.code === 'P2002') {
            return res.status(409).json({
                error: 'Unique constraint violation',
                code: err.code,
                fields: err.meta?.target,
            });
        }
        console.error('[Prisma Error]', err.code, err.message);
        return res.status(500).json({
            error: 'Database error',
            code: err.code,
        });
    }
    // Prisma — validation error
    if (err instanceof client_1.Prisma.PrismaClientValidationError) {
        return res.status(400).json({
            error: 'Invalid data shape — check enum values and required fields',
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
//# sourceMappingURL=errorHandler.js.map