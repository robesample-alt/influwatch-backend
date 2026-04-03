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
import { tenantGuard }     from './middleware/tenantGuard';
import { errorHandler }    from './middleware/errorHandler';
import { verifyRls }       from './utils/rlsCheck';

const app  = express();
const PORT = process.env.PORT || 3001;

// Trust proxy — required behind Render/Vercel/Cloudflare reverse proxies.
// Without this, express-rate-limit throws ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
app.set('trust proxy', 1);

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
// All routes below require a valid JWT bearer token + tenant context.
// tenantGuard sets app.tenant_id in PostgreSQL for RLS enforcement.
app.use('/api/influwatch/content-records', authenticate, tenantGuard, influWatchRouter);
app.use('/api/influwatch/ambassadors',     authenticate, tenantGuard, ambassadorRouter);
app.use('/api/influwatch/internal-actors', authenticate, tenantGuard, internalActorRouter);
app.use('/api/influwatch/certifications',          authenticate, tenantGuard, writeLimiter, attestationRouter);
app.use('/api/influwatch/config',                  authenticate, tenantGuard, tenantConfigRouter);
app.use('/api/influwatch/contracts',               authenticate, tenantGuard, writeLimiter, contractRouter);
app.use('/api/influwatch/legal-holds',             authenticate, tenantGuard, writeLimiter, legalHoldRouter);
app.use('/api/influwatch/program-certifications',  authenticate, tenantGuard, writeLimiter, programCertRouter);
app.use('/api/influwatch/exports',                 authenticate, tenantGuard, writeLimiter, evidenceExportRouter);
app.use('/api/influwatch/tail-periods',            authenticate, tenantGuard, tailPeriodRouter);
app.use('/api/influwatch/pre-approvals',           authenticate, tenantGuard, writeLimiter, preApprovalRouter);
app.use('/api/influwatch/ingest',                 authenticate, tenantGuard, ingestRouter);
app.use('/api/influwatch/compensation-structures', authenticate, tenantGuard, writeLimiter, compensationStructureRouter);
app.use('/api/influwatch/affiliate-links',         authenticate, tenantGuard, writeLimiter, affiliateLinksRouter);

// ── Error handler (must be last) ──────────
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  (async () => {
    // Verify RLS is enabled on all tenant-scoped tables before accepting traffic.
    // Fails fast with a fatal error if any table is missing RLS.
    if (process.env.SKIP_RLS_CHECK !== 'true') {
      await verifyRls();
    }

    app.listen(PORT, () => {
      logger.info(`FNDR InfluWatch Phase 1 — Listening on http://localhost:${PORT}`);
      logger.info(`Health: http://localhost:${PORT}/health`);
    });
  })().catch((err) => {
    logger.fatal(err, 'Failed to start server');
    process.exit(1);
  });
}

export default app;
