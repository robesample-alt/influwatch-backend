// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1 / PHASE 2
// Server entry point
// ============================================================

import 'dotenv/config';
import express   from 'express';
import cors      from 'cors';
import path      from 'path';
import pinoHttp  from 'pino-http';
import logger    from './utils/logger';
import { loginLimiter, writeLimiter } from './middleware/rateLimiter';

import influWatchRouter    from './routes/index';
import ambassadorRouter    from './routes/ambassador.router';
import internalActorRouter from './routes/internalActor.router';
import authRouter          from './routes/auth.router';
import attestationRouter   from './routes/attestation.routes';
import tenantConfigRouter  from './routes/tenantConfig.routes';
import contractRouter      from './routes/contract.routes';
import legalHoldRouter     from './routes/legalHold.routes';
import programCertRouter   from './routes/programCert.routes';
import evidenceExportRouter from './routes/evidenceExport.routes';
import tailPeriodRouter     from './routes/tailPeriod.routes';
import preApprovalRouter    from './routes/preApproval.routes';
import ingestRouter                  from './routes/ingest.routes';
import compensationStructureRouter   from './routes/compensationStructure.routes';
import affiliateLinksRouter          from './routes/affiliateLinks.routes';
import { authenticate }    from './middleware/authenticate';
import { errorHandler }    from './middleware/errorHandler';

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3001,http://localhost:5173,http://127.0.0.1:5500')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, server-to-server) or
    // null origin (file:// pages in development)
    if (!origin || origin === 'null') return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(pinoHttp({ logger }));
app.use(express.json({ limit: '2mb' }));

// ── Static: uploaded video files ─────────
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads';
app.use('/uploads', express.static(path.resolve(UPLOAD_DIR)));

// ── Health ────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', module: 'influwatch', phase: 1 })
);

// ── Auth (open — no token required) ──────
app.use('/api/influwatch/auth', loginLimiter, authRouter);

// ── Protected Routes ──────────────────────
// All routes below require a valid JWT bearer token.
app.use('/api/influwatch/content-records', authenticate, influWatchRouter);
app.use('/api/influwatch/ambassadors',     authenticate, ambassadorRouter);
app.use('/api/influwatch/internal-actors', authenticate, internalActorRouter);
app.use('/api/influwatch/certifications',          authenticate, writeLimiter, attestationRouter);
app.use('/api/influwatch/config',                  authenticate, tenantConfigRouter);
app.use('/api/influwatch/contracts',               authenticate, writeLimiter, contractRouter);
app.use('/api/influwatch/legal-holds',             authenticate, writeLimiter, legalHoldRouter);
app.use('/api/influwatch/program-certifications',  authenticate, writeLimiter, programCertRouter);
app.use('/api/influwatch/exports',                 authenticate, writeLimiter, evidenceExportRouter);
app.use('/api/influwatch/tail-periods',            authenticate, tailPeriodRouter);
app.use('/api/influwatch/pre-approvals',           authenticate, writeLimiter, preApprovalRouter);
app.use('/api/influwatch/ingest',                 authenticate, ingestRouter);
app.use('/api/influwatch/compensation-structures', authenticate, writeLimiter, compensationStructureRouter);
app.use('/api/influwatch/affiliate-links',         authenticate, writeLimiter, affiliateLinksRouter);

// ── Error handler (must be last) ──────────
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`FNDR InfluWatch Phase 1 — Listening on http://localhost:${PORT}`);
    logger.info(`Health: http://localhost:${PORT}/health`);
  });
}

export default app;
