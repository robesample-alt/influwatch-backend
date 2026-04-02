// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Route handlers — Authentication
//
// POST /api/influwatch/auth/login
// Returns a signed JWT for a valid internal actor.
// ============================================================

import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../utils/prisma';
import { signToken } from '../utils/auth';

// ─────────────────────────────────────────
// POST /auth/login
// ─────────────────────────────────────────

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const actor = await prisma.internalActor.findUnique({
    where:  { email },
    select: { id: true, displayName: true, email: true, role: true, status: true, passwordHash: true },
  });

  if (!actor || !actor.passwordHash) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const passwordValid = await bcrypt.compare(password, actor.passwordHash);
  if (!passwordValid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = signToken({ id: actor.id, role: actor.role, email: actor.email });

  res.status(200).json({
    token,
    actor: {
      id:          actor.id,
      displayName: actor.displayName,
      email:       actor.email,
      role:        actor.role,
    },
  });
}
