// ============================================================
// FUNDUREX — INFLUWATCH PHASE 1
// Middleware — Rate limiting
// ============================================================

import rateLimit from 'express-rate-limit';

// Strict limiter for login — prevents brute-force attacks
export const loginLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15 minutes
  max:              10,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { error: 'Too many login attempts. Please try again in 15 minutes.' },
  skipSuccessfulRequests: false,
});

// General limiter for sensitive write endpoints
export const writeLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             100,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Too many requests. Please slow down.' },
});
