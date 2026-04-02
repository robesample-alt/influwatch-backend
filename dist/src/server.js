"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1 / PHASE 2
// Server entry point
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const pino_http_1 = __importDefault(require("pino-http"));
const logger_1 = __importDefault(require("./utils/logger"));
const rateLimiter_1 = require("./middleware/rateLimiter");
const index_1 = __importDefault(require("./routes/index"));
const ambassador_router_1 = __importDefault(require("./routes/ambassador.router"));
const internalActor_router_1 = __importDefault(require("./routes/internalActor.router"));
const auth_router_1 = __importDefault(require("./routes/auth.router"));
const attestation_routes_1 = __importDefault(require("./routes/attestation.routes"));
const tenantConfig_routes_1 = __importDefault(require("./routes/tenantConfig.routes"));
const contract_routes_1 = __importDefault(require("./routes/contract.routes"));
const legalHold_routes_1 = __importDefault(require("./routes/legalHold.routes"));
const programCert_routes_1 = __importDefault(require("./routes/programCert.routes"));
const evidenceExport_routes_1 = __importDefault(require("./routes/evidenceExport.routes"));
const tailPeriod_routes_1 = __importDefault(require("./routes/tailPeriod.routes"));
const preApproval_routes_1 = __importDefault(require("./routes/preApproval.routes"));
const ingest_routes_1 = __importDefault(require("./routes/ingest.routes"));
const compensationStructure_routes_1 = __importDefault(require("./routes/compensationStructure.routes"));
const affiliateLinks_routes_1 = __importDefault(require("./routes/affiliateLinks.routes"));
const authenticate_1 = require("./middleware/authenticate");
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// ── Middleware ────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3001,http://localhost:5173,http://127.0.0.1:5500')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (curl, server-to-server) or
        // null origin (file:// pages in development)
        if (!origin || origin === 'null')
            return callback(null, true);
        if (allowedOrigins.includes(origin))
            return callback(null, true);
        callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
}));
app.use((0, pino_http_1.default)({ logger: logger_1.default }));
app.use(express_1.default.json({ limit: '2mb' }));
// ── Static: uploaded video files ─────────
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads';
app.use('/uploads', express_1.default.static(path_1.default.resolve(UPLOAD_DIR)));
// ── Health ────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', module: 'influwatch', phase: 1 }));
// ── Auth (open — no token required) ──────
app.use('/api/influwatch/auth', rateLimiter_1.loginLimiter, auth_router_1.default);
// ── Protected Routes ──────────────────────
// All routes below require a valid JWT bearer token.
app.use('/api/influwatch/content-records', authenticate_1.authenticate, index_1.default);
app.use('/api/influwatch/ambassadors', authenticate_1.authenticate, ambassador_router_1.default);
app.use('/api/influwatch/internal-actors', authenticate_1.authenticate, internalActor_router_1.default);
app.use('/api/influwatch/certifications', authenticate_1.authenticate, rateLimiter_1.writeLimiter, attestation_routes_1.default);
app.use('/api/influwatch/config', authenticate_1.authenticate, tenantConfig_routes_1.default);
app.use('/api/influwatch/contracts', authenticate_1.authenticate, rateLimiter_1.writeLimiter, contract_routes_1.default);
app.use('/api/influwatch/legal-holds', authenticate_1.authenticate, rateLimiter_1.writeLimiter, legalHold_routes_1.default);
app.use('/api/influwatch/program-certifications', authenticate_1.authenticate, rateLimiter_1.writeLimiter, programCert_routes_1.default);
app.use('/api/influwatch/exports', authenticate_1.authenticate, rateLimiter_1.writeLimiter, evidenceExport_routes_1.default);
app.use('/api/influwatch/tail-periods', authenticate_1.authenticate, tailPeriod_routes_1.default);
app.use('/api/influwatch/pre-approvals', authenticate_1.authenticate, rateLimiter_1.writeLimiter, preApproval_routes_1.default);
app.use('/api/influwatch/ingest', authenticate_1.authenticate, ingest_routes_1.default);
app.use('/api/influwatch/compensation-structures', authenticate_1.authenticate, rateLimiter_1.writeLimiter, compensationStructure_routes_1.default);
app.use('/api/influwatch/affiliate-links', authenticate_1.authenticate, rateLimiter_1.writeLimiter, affiliateLinks_routes_1.default);
// ── Error handler (must be last) ──────────
app.use(errorHandler_1.errorHandler);
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        logger_1.default.info(`FNDR InfluWatch Phase 1 — Listening on http://localhost:${PORT}`);
        logger_1.default.info(`Health: http://localhost:${PORT}/health`);
    });
}
exports.default = app;
//# sourceMappingURL=server.js.map