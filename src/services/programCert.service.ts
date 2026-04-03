// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — ProgramCertification
//
// listProgramCerts(tenantId)       — list all, newest first, with principal
// createProgramCert(tenantId, input) — create new certification
// ============================================================

import { withTenantContext } from '../utils/tenantContext';

const principalSelect = {
  id:            true,
  displayName:   true,
  email:         true,
  role:          true,
  seriesLicense: true,
} as const;

// ─────────────────────────────────────────
// LIST
// ─────────────────────────────────────────

/**
 * List all annual program certifications, newest first.
 * Includes signing principal details.
 */
export async function listProgramCerts(tenantId: string) {
  return withTenantContext({ tenantId }, async (tx) => {
    return tx.programCertification.findMany({
      where:   { tenantId },
      include: { principal: { select: principalSelect } },
      orderBy: { certifiedAt: 'desc' },
    });
  });
}

// ─────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────

export interface CreateProgramCertInput {
  principalId:               string;
  certificationYear:         number;
  rulesCertified:            string;
  supervisorySystemAdequate: boolean;
  findings?:                 string | null;
  certificationNote?:        string | null;
}

/**
 * Create a new annual supervisory program certification.
 * Returns the created record with principal details.
 */
export async function createProgramCert(tenantId: string, input: CreateProgramCertInput) {
  return withTenantContext({ tenantId }, async (tx) => {
    return tx.programCertification.create({
      data: {
        tenantId,
        principalId:               input.principalId,
        certificationYear:         input.certificationYear,
        rulesCertified:            input.rulesCertified,
        supervisorySystemAdequate: input.supervisorySystemAdequate,
        findings:                  input.findings          ?? null,
        certificationNote:         input.certificationNote ?? null,
      },
      include: { principal: { select: principalSelect } },
    });
  });
}
