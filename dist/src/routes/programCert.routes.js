"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Routes — Annual Supervisory Program Certifications
//
// GET  /api/influwatch/program-certifications — list all
// POST /api/influwatch/program-certifications — create new
// ============================================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const ProgramCertService = __importStar(require("../services/programCert.service"));
const requireRole_1 = require("../middleware/requireRole");
const router = (0, express_1.Router)();
// ─────────────────────────────────────────
// GET /program-certifications
//
// List all annual program certifications, newest first.
// ─────────────────────────────────────────
router.get('/', async (req, res, next) => {
    try {
        const certs = await ProgramCertService.listProgramCerts();
        return res.status(200).json({ count: certs.length, certs });
    }
    catch (err) {
        next(err);
    }
});
// ─────────────────────────────────────────
// POST /program-certifications
//
// Create a new annual program certification.
// Required: principalId, certificationYear, rulesCertified,
//           supervisorySystemAdequate
// ─────────────────────────────────────────
router.post('/', (0, requireRole_1.requireRole)(client_1.InternalActorRole.REGISTERED_PRINCIPAL, client_1.InternalActorRole.TENANT_ADMIN), async (req, res, next) => {
    try {
        const { certificationYear, rulesCertified, supervisorySystemAdequate, findings, certificationNote, } = req.body;
        const principalId = req.user.id;
        if (!certificationYear)
            return res.status(400).json({ error: 'certificationYear is required' });
        if (!rulesCertified)
            return res.status(400).json({ error: 'rulesCertified is required' });
        if (supervisorySystemAdequate === undefined || supervisorySystemAdequate === null)
            return res.status(400).json({ error: 'supervisorySystemAdequate is required' });
        const year = Number(certificationYear);
        if (!Number.isInteger(year) || year < 2000 || year > 2100)
            return res.status(400).json({ error: 'certificationYear must be a valid 4-digit year' });
        const cert = await ProgramCertService.createProgramCert({
            principalId,
            certificationYear: year,
            rulesCertified,
            supervisorySystemAdequate: Boolean(supervisorySystemAdequate),
            findings: findings ?? null,
            certificationNote: certificationNote ?? null,
        });
        return res.status(201).json(cert);
    }
    catch (err) {
        // FK violation — principalId does not exist
        if (err?.code === 'P2003') {
            return res.status(404).json({ error: 'Principal not found', principalId: req.user?.id });
        }
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=programCert.routes.js.map