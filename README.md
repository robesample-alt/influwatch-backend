# InfluWatch Backend

InfluWatch is a third-party promoter supervision platform built for FINRA/SEC regulated financial firms. It enables compliance teams to monitor, ingest, and review content published by registered promoters (ambassadors), automatically flagging posts that match known risk phrases against a rule registry. The platform maintains an immutable audit trail of all content records, detection hits, and compliance actions taken by internal actors.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript 5 |
| Runtime | Node.js |
| Framework | Express 4 |
| Database | PostgreSQL |
| ORM | Prisma 5 |

---

## Prerequisites

- **Node.js** v18 or higher
- **PostgreSQL** 14 or higher, running locally or accessible via connection string
- **npm** (bundled with Node.js)

---

## Environment Setup

Create a `.env` file in the project root with the following variables:

```env
# Required — PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/influwatch"

# Required — long random string used to sign JWTs
# Must never be committed to the repository
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your-generated-secret-here

# Optional — HTTP port (defaults to 3000)
PORT=3000

# Optional — execution environment
NODE_ENV=development
```

> `DATABASE_URL` and `JWT_SECRET` are both required. `DATABASE_URL` is read by Prisma; `JWT_SECRET` is read by the auth utilities at call time.

---

## Installation

```bash
npm install
```

---

## Database Setup

Migrations are plain SQL files located in `prisma/migrations/`. Apply them with:

```bash
npx prisma migrate deploy
```

> Do **not** use `prisma migrate dev` in this environment. All migrations are hand-written SQL and `migrate dev` will attempt to regenerate them.

After migrations, regenerate the Prisma client:

```bash
npx prisma generate
```

> On Windows, the Prisma query engine DLL is locked while the dev server is running. Stop the server before running `prisma generate`.

Seed the database with sample promoters, content records, and detection records:

```bash
npm run db:seed
```

The seed is idempotent for all content records and detection records (uses `upsert` with deterministic IDs). Re-running is safe.

> **Exception:** the extra audit event rows at the bottom of `seed.ts` use `create` rather than `upsert` — re-running the seed will append duplicate audit event rows. This is a known limitation. If the audit log looks inflated after a re-seed, truncate the `archive_event_logs` table and re-seed once.

---

## Running in Development

```bash
npm run dev
```

This starts the server with `ts-node-dev` and live reload. The server listens on the port defined in `PORT` (default: `3000`).

---

## API Reference

Base URL: `http://localhost:3001/api/influwatch`

| Endpoint Group | Description |
|---|---|
| `GET /health` | Health check — returns `{ status: "ok" }` |
| `/api/influwatch/content-records` | Ingest and retrieve promoter content records |
| `/api/influwatch/ambassadors` | Register and manage promoters (ambassadors) |
| `/api/influwatch/internal-actors` | Manage internal compliance actors (supervisors, reviewers) |

Full route definitions are in `src/routes/`.

---

## Authentication

Authentication uses JWT bearer tokens. Login via `POST /api/influwatch/auth/login` with `{ email, password }` to receive a token. Pass it on subsequent requests as:

```
Authorization: Bearer <token>
```

Tokens expire after 24 hours. The `/health` and `/auth/login` endpoints are open — all other routes require a valid token.

---

## Ambassador vs Promoter Terminology

The backend uses `ambassador` / `ambassadorId` throughout the codebase — in the Prisma schema, service layer, route handlers, and API responses. The frontend UI displays this entity as **Promoter**. This naming divergence is intentional and should **not** be changed. Renaming would require coordinated schema migrations, API contract changes, and frontend updates. Map `ambassador` → `Promoter` only at the UI presentation layer.

---
