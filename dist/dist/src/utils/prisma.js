"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Prisma client singleton
//
// Single shared PrismaClient instance.
// In development, prevents hot-reload from opening
// multiple connections.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = global.__prisma ??
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'warn', 'error']
            : ['warn', 'error'],
    });
if (process.env.NODE_ENV !== 'production') {
    global.__prisma = prisma;
}
exports.default = prisma;
//# sourceMappingURL=prisma.js.map