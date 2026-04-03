"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Route handlers — Internal Actors
//
// Powers the User Management screen.
// GET /internal-actors returns all actors.
// GET /internal-actors/supervisors returns only supervisory-role actors.
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
exports.listInternalActors = listInternalActors;
exports.listSupervisors = listSupervisors;
const InternalActorService = __importStar(require("../services/internalActor.service"));
// ─────────────────────────────────────────
// GET /internal-actors
// List all internal actors. Optional ?role= and ?status= filters.
// Powers the User Management table.
// ─────────────────────────────────────────
async function listInternalActors(req, res, next) {
    try {
        const tenantId = req.user.tenantId;
        const role = req.query.role;
        const status = req.query.status;
        const actors = await InternalActorService.listInternalActors(tenantId, { role, status });
        return res.status(200).json(actors);
    }
    catch (err) {
        next(err);
    }
}
// ─────────────────────────────────────────
// GET /internal-actors/supervisors
// Supervisory-capable actors only (REGISTERED_PRINCIPAL + DESIGNATED_SUPERVISOR, ACTIVE).
// Powers the Register Promoter supervisor dropdown.
// Must be mounted BEFORE /:id to avoid route shadowing.
// ─────────────────────────────────────────
async function listSupervisors(req, res, next) {
    try {
        const tenantId = req.user.tenantId;
        const supervisors = await InternalActorService.listSupervisors(tenantId);
        return res.status(200).json(supervisors);
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=internalActor.routes.js.map