# @robesample-alt/influwatch-core

Proprietary compliance detection logic for the InfluWatch platform — Fundurex Phase 1.

## What this package contains

- **Rule registry** — canonical phrase-to-rule mapping for SEC/FINRA promotional compliance detection (RISK-001, RISK-002, RISK-003, DISC-001, DISC-002)
- **Detection engine** — `detectRuleHits()` and `computeSeverityFromHits()`
- **Escalation engine** — `computeEscalation()` deriving NON_COMPLIANT / REVIEW_REQUIRED / LOG_ONLY status from detection hits

## Access

This package is published to GitHub Packages under `@robesample-alt`.

**Source is not distributed.** Only the compiled `dist/` output is included in the published package.

Access to this package requires authorization. Contact Fundurex LLC for a scoped access token.

## Install

```bash
# Add to your project's .npmrc:
@robesample-alt:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN

npm install @robesample-alt/influwatch-core
```

## Usage

```ts
import { detectRuleHits, computeSeverityFromHits, computeEscalation } from '@robesample-alt/influwatch-core';

const hits       = detectRuleHits(postBodyText);
const severity   = computeSeverityFromHits(hits);
const escalation = computeEscalation(hits);
// escalation.level  → 'HIGH' | 'MEDIUM' | 'LOW'
// escalation.status → 'NON_COMPLIANT' | 'REVIEW_REQUIRED' | 'LOG_ONLY'
```

## License

UNLICENSED — All rights reserved. Fundurex LLC.
