"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Service — PromoterContract
//
// listContracts(ambassadorId?) — all contracts, optional filter
// getContract(id)              — single contract with ambassador
// createContract(input)        — create new contract
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listContracts = listContracts;
exports.getContract = getContract;
exports.createContract = createContract;
const prisma_1 = __importDefault(require("../utils/prisma"));
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
async function listContracts(ambassadorId) {
    return prisma_1.default.promoterContract.findMany({
        where: ambassadorId ? { ambassadorId } : undefined,
        include: { ambassador: { select: ambassadorSelect } },
        orderBy: { createdAt: 'desc' },
    });
}
// ─────────────────────────────────────────
// GET BY ID
// ─────────────────────────────────────────
/**
 * Return a single contract by its cuid primary key.
 * Returns null if not found.
 */
async function getContract(id) {
    return prisma_1.default.promoterContract.findUnique({
        where: { id },
        include: { ambassador: { select: ambassadorSelect } },
    });
}
/**
 * Create a new promoter contract.
 * Returns the created record with ambassador details.
 */
async function createContract(input) {
    return prisma_1.default.promoterContract.create({
        data: {
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
}
//# sourceMappingURL=contract.service.js.map