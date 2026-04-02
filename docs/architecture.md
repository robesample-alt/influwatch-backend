# InfluWatch Phase 1 — Architecture Summary

## Purpose

InfluWatch is the supervision layer of the Fundurex platform.
Phase 1 builds the content archive foundation — the recordkeeping
substrate that all future review, compliance, and audit capabilities
depend on.

**Recordkeeping first. AI and automation second.**

---

## What Phase 1 Builds

| Capability                        | Status       |
|-----------------------------------|--------------|
| Content record model              | ✅ Built      |
| Ambassador / creator association  | ✅ Built      |
| Campaign association              | ✅ Built      |
| Platform / source tracking        | ✅ Built      |
| URL and media metadata storage    | ✅ Built      |
| Caption / transcript / body text  | ✅ Built      |
| Archive timestamps                | ✅ Built      |
| Archive status field              | ✅ Built      |
| Basic archive retrieval API       | ✅ Built      |
| Immutable audit event log         | ✅ Built      |
| Checksum / dedup / tamper detect  | ✅ Built      |

---

## Data Model Overview

```
AmbassadorProfile
  └── ContentRecord (many)
        ├── Campaign (optional FK)
        ├── ContentMediaAsset (many)
        └── ArchiveEventLog (many — append-only)
```

### Key design decisions

**ContentRecord.checksum**
SHA-256 of `sourceUrl + bodyText`. Computed at ingestion.
Serves two purposes:
1. Deduplication — reject re-archives of the same content
2. Tamper detection — verify record integrity during audit

**ArchiveEventLog — append-only**
No UPDATE or DELETE on this table. Ever.
The event log is the audit trail. Every state change,
review action, and escalation writes a new row.
The `actorId` field is nullable now but will be
populated by auth middleware in Phase 2.

**archiveStatus state machine**

```
CAPTURED → PENDING_REVIEW → REVIEWED → CLOSED
                          ↓
                      ESCALATED → INCIDENT_OPENED → CLOSED
```

**Campaign linkage is nullable**
Content can be archived before it is linked to a campaign.
Review operators can associate records with campaigns post-capture.

---

## API Routes

| Method | Route                                  | Description                          |
|--------|----------------------------------------|--------------------------------------|
| POST   | /api/influwatch/content-records        | Archive a new content record         |
| GET    | /api/influwatch/content-records        | List records with filters            |
| GET    | /api/influwatch/content-records/:id    | Get single record                    |
| PATCH  | /api/influwatch/content-records/:id/status | Update archive status            |
| GET    | /api/influwatch/content-records/:id/events | Get audit event log              |
| POST   | /api/influwatch/content-records/:id/events | Append manual event/note         |
| GET    | /api/influwatch/content-records/:id/assets | Get media assets                 |
| POST   | /api/influwatch/content-records/:id/assets | Attach media asset               |

### Filter params for GET /content-records

| Param           | Type           | Example                  |
|-----------------|----------------|--------------------------|
| ambassadorId    | string         | AMB-001                  |
| campaignId      | string         | CAMP-AGI                 |
| sourcePlatform  | SourcePlatform | INSTAGRAM                |
| archiveStatus   | ArchiveStatus  | PENDING_REVIEW           |
| page            | number         | 1                        |
| pageSize        | number         | 25 (max 100)             |

---

## Folder Structure

```
backend/influwatch/
├── prisma/
│   └── schema.prisma           # All data models
├── src/
│   ├── middleware/
│   │   └── errorHandler.ts     # Unified error responses
│   ├── models/
│   │   └── types.ts            # Shared TypeScript types
│   ├── routes/
│   │   ├── contentRecords.routes.ts   # Route handlers
│   │   └── index.ts            # Router — mounts all routes
│   ├── services/
│   │   ├── contentRecord.service.ts   # Core business logic
│   │   └── ambassador.service.ts      # Ambassador/campaign lookups
│   ├── utils/
│   │   ├── checksum.ts         # SHA-256 for dedup + tamper detect
│   │   ├── prisma.ts           # Prisma client singleton
│   │   └── validation.ts       # Input validation
│   └── server.ts               # Express entry point
├── seed/
│   └── seed.ts                 # Example data matching platform roster
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Copy env file
cp .env.example .env
# Edit DATABASE_URL with your PostgreSQL credentials

# 3. Generate Prisma client
npm run db:generate

# 4. Push schema to database (dev)
npm run db:push

# 5. Seed example data
npm run db:seed

# 6. Start dev server
npm run dev
```

---

## Phase 2 — What Belongs Next

The following capabilities are intentionally excluded from Phase 1.
They depend on the archive foundation built here.

### Phase 2 — Human Review Workflow
- Review queue UI backend
- Reviewer assignment
- Review decision recording (approve / flag / escalate)
- actorId population from authentication middleware
- Full auth/session layer

### Phase 2 — Signal Detection
- Rule-based content scanning (keyword patterns, disclosure checks)
- Automated signal generation from archived content
- Signal severity classification
- Signal-to-ContentRecord linkage

### Phase 3 — Risk Scoring
- Ambassador compliance score computation
- IW Standing field on ambassador profiles
- Feed into DSS `complianceStanding` input signal

### Phase 3 — Incident Management
- Formal incident records linked to ContentRecord
- Incident state machine (open → investigating → resolved)
- Incident export for legal / regulatory use

### Phase 4 — DSS Integration
- IW compliance data feeds `complianceStanding` in DSS_INPUTS
- Ambassador IW standing affects campaign DSS score

### Phase 4 — IVI Feedback Loop
- Post-campaign content performance data
- Ambassador attribution analytics
- Feed into Investor Graph and IVI module

### Not in scope (any phase)
- AI-generated content detection
- Automated content takedown
- Direct platform API ingestion (manual archive only in Phase 1)
