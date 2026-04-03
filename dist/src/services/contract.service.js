"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — PromoterContract
//
// listContracts(tenantId, ambassadorId?) — all contracts, optional filter
// getContract(tenantId, id)              — single contract with ambassador
// createContract(tenantId, input)        — create new contract
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.listContracts = listContracts;
exports.getContract = getContract;
exports.createContract = createContract;
const tenantContext_1 = require("../utils/tenantContext");
const ambassadorSelect = {
    id: true,
    displayName: true,
    handle: true,
    primaryPlatform: true,
    status: true,
    riskTier: true,
};
// ─────────────────────────────────────────
// LIST
// ─────────────────────────────────────────
/**
 * List all promoter contracts, newest first.
 * Optionally filtered to a single ambassador.
 */
async function listContracts(tenantId, ambassadorId) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        return tx.promoterContract.findMany({
            where: { tenantId, ...(ambassadorId ? { ambassadorId } : {}) },
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
async function getContract(tenantId, id) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        return tx.promoterContract.findFirst({
            where: { id, tenantId },
            include: { ambassador: { select: ambassadorSelect } },
        });
    });
}
/**
 * Create a new promoter contract.
 * Returns the created record with ambassador details.
 */
async function createContract(tenantId, input) {
    return (0, tenantContext_1.withTenantContext)({ tenantId }, async (tx) => {
        return tx.promoterContract.create({
            data: {
                tenantId,
                ambassadorId: input.ambassadorId,
                agreementType: input.agreementType,
                contractId: input.contractId,
                signedDate: input.signedDate,
                effectiveDate: input.effectiveDate,
                expiryDate: input.expiryDate ?? null,
                monitoringConsent: input.monitoringConsent ?? false,
                disclosureAck: input.disclosureAck ?? false,
                disclosureRuleEnforced: input.disclosureRuleEnforced ?? true,
                compensationCap: input.compensationCap ?? null,
                compensationType: input.compensationType ?? null,
                compensationRate: input.compensationRate ?? null,
                status: input.status ?? 'ACTIVE',
                notes: input.notes ?? null,
            },
            include: { ambassador: { select: ambassadorSelect } },
        });
    });
}
//# sourceMappingURL=contract.service.js.map