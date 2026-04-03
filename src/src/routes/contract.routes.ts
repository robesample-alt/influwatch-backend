// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Routes — Promoter Contracts & Agreements
//
// GET  /api/influwatch/contracts      — list all contracts
// GET  /api/influwatch/contracts/:id  — single contract
// POST /api/influwatch/contracts      — create new contract
// ============================================================

import { Router, Request, Response, NextFunction } from 'express';
import { InternalActorRole } from '@prisma/client';
import * as ContractService from '../services/contract.service';
import { requireRole } from '../middleware/requireRole';

const router = Router();

// ─────────────────────────────────────────
// GET /contracts
//
// List all promoter contracts, newest first.
// Optional: ?ambassadorId=<id> filters to one promoter.
// ─────────────────────────────────────────

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    const ambassadorId = req.query.ambassadorId as string | undefined;
    const contracts    = await ContractService.listContracts(tenantId, ambassadorId);
    return res.status(200).json({ count: contracts.length, contracts });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// GET /contracts/:id
//
// Retrieve a single contract by primary key.
// ─────────────────────────────────────────

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    const contract = await ContractService.getContract(tenantId, req.params.id);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found', id: req.params.id });
    }
    return res.status(200).json(contract);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// POST /contracts
//
// Create a new promoter contract.
// Required: ambassadorId, agreementType, contractId,
//           signedDate, effectiveDate
// ─────────────────────────────────────────

router.post('/', requireRole(InternalActorRole.REGISTERED_PRINCIPAL, InternalActorRole.DESIGNATED_SUPERVISOR, InternalActorRole.COMPLIANCE_OFFICER, InternalActorRole.TENANT_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      ambassadorId,
      agreementType,
      contractId,
      signedDate,
      effectiveDate,
      expiryDate,
      monitoringConsent,
      disclosureAck,
      disclosureRuleEnforced,
      compensationCap,
      compensationType,
      compensationRate,
      status,
      notes,
    } = req.body;

    const tenantId = req.user!.tenantId;

    if (!ambassadorId)  return res.status(400).json({ error: 'ambassadorId is required' });
    if (!agreementType) return res.status(400).json({ error: 'agreementType is required' });
    if (!contractId)    return res.status(400).json({ error: 'contractId is required' });
    if (!signedDate)    return res.status(400).json({ error: 'signedDate is required' });
    if (!effectiveDate) return res.status(400).json({ error: 'effectiveDate is required' });

    const contract = await ContractService.createContract(tenantId, {
      ambassadorId,
      agreementType,
      contractId,
      signedDate:    new Date(signedDate),
      effectiveDate: new Date(effectiveDate),
      expiryDate:    expiryDate ? new Date(expiryDate) : null,
      monitoringConsent,
      disclosureAck,
      disclosureRuleEnforced,
      compensationCap:    compensationCap  != null ? Number(compensationCap)  : null,
      compensationType,
      compensationRate,
      status,
      notes,
    });

    return res.status(201).json(contract);
  } catch (err: any) {
    // Unique constraint on contractId
    if (err?.code === 'P2002') {
      return res.status(409).json({ error: 'A contract with this contractId already exists' });
    }
    next(err);
  }
});

export default router;
