// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — PromoterContract
//
// listContracts(tenantId, ambassadorId?) — all contracts, optional filter
// getContract(tenantId, id)              — single contract with ambassador
// createContract(tenantId, input)        — create new contract
// ============================================================

import { withTenantContext } from '../utils/tenantContext';

const ambassadorSelect = {
  id:              true,
  displayName:     true,
  handle:          true,
  primaryPlatform: true,
  status:          true,
  riskTier:        true,
} as const;

// ─────────────────────────────────────────
// LIST
// ─────────────────────────────────────────

/**
 * List all promoter contracts, newest first.
 * Optionally filtered to a single ambassador.
 */
export async function listContracts(tenantId: string, ambassadorId?: string) {
  return withTenantContext({ tenantId }, async (tx) => {
    return tx.promoterContract.findMany({
      where:   { tenantId, ...(ambassadorId ? { ambassadorId } : {}) },
      include: { ambassador: { select: ambassadorSelect } },
      orderBy: { createdAt: 'desc' },
    });
  });
}

// ─────────────────────────────────────────
// GET BY ID
// ─────────────────────────────────────────

/**
 * Return a single contract by its cuid primary key.
 * Returns null if not found.
 */
export async function getContract(tenantId: string, id: string) {
  return withTenantContext({ tenantId }, async (tx) => {
    return tx.promoterContract.findFirst({
      where:   { id, tenantId },
      include: { ambassador: { select: ambassadorSelect } },
    });
  });
}

// ─────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────

export interface CreateContractInput {
  ambassadorId:           string;
  agreementType:          string;
  contractId:             string;
  signedDate:             Date;
  effectiveDate:          Date;
  expiryDate?:            Date | null;
  monitoringConsent?:     boolean;
  disclosureAck?:         boolean;
  disclosureRuleEnforced?:boolean;
  compensationCap?:       number | null;
  compensationType?:      string | null;
  compensationRate?:      string | null;
  status?:                string;
  notes?:                 string | null;
}

/**
 * Create a new promoter contract.
 * Returns the created record with ambassador details.
 */
export async function createContract(tenantId: string, input: CreateContractInput) {
  return withTenantContext({ tenantId }, async (tx) => {
    return tx.promoterContract.create({
      data: {
        tenantId,
        ambassadorId:           input.ambassadorId,
        agreementType:          input.agreementType,
        contractId:             input.contractId,
        signedDate:             input.signedDate,
        effectiveDate:          input.effectiveDate,
        expiryDate:             input.expiryDate             ?? null,
        monitoringConsent:      input.monitoringConsent      ?? false,
        disclosureAck:          input.disclosureAck          ?? false,
        disclosureRuleEnforced: input.disclosureRuleEnforced ?? true,
        compensationCap:        input.compensationCap        ?? null,
        compensationType:       input.compensationType       ?? null,
        compensationRate:       input.compensationRate       ?? null,
        status:                 input.status                 ?? 'ACTIVE',
        notes:                  input.notes                  ?? null,
      },
      include: { ambassador: { select: ambassadorSelect } },
    });
  });
}
