// ============================================================
// FUNDUREX — INFLUWATCH
// Campaign Conformance — Phase 4
//
// Checks whether a promoter's compensation type is allowed
// by the linked campaign's governance rules. Pure function.
//
// Returns: { mismatch: boolean | null, summary: string | null }
//   - true:  explicit mismatch (comp type not in allowed list)
//   - false: comp type is allowed
//   - null:  not enough data to evaluate (no campaign, no
//            allowedCompensationTypes, no comp type)
// ============================================================

// ── Campaign risk modes ───────────────────────────────────────

export type CampaignRiskMode =
  | 'AWARENESS'
  | 'EDUCATION'
  | 'CONVERSION'
  | 'HIGH_SCRUTINY';

export const VALID_CAMPAIGN_RISK_MODES: ReadonlySet<string> = new Set<CampaignRiskMode>([
  'AWARENESS',
  'EDUCATION',
  'CONVERSION',
  'HIGH_SCRUTINY',
]);

// ── Conformance check ─────────────────────────────────────────

export interface CampaignConformanceInput {
  /** The promoter's canonical compensationType from Phase 1. */
  compensationType: string | null | undefined;
  /** The campaign's allowedCompensationTypes JSON string, or null. */
  allowedCompensationTypesJson: string | null | undefined;
  /** The campaign's risk mode, if set. */
  campaignRiskMode: string | null | undefined;
  /** The campaign name, for summary text. */
  campaignName?: string | null;
}

export interface CampaignConformanceResult {
  mismatch: boolean | null;
  summary:  string | null;
}

/**
 * Check whether a promoter's compensation type conforms to the
 * campaign's allowed types.
 *
 * Returns null mismatch when there isn't enough data to evaluate.
 * Never throws.
 */
export function checkCampaignConformance(
  input: CampaignConformanceInput,
): CampaignConformanceResult {
  const compType = (input.compensationType || '').trim().toUpperCase();
  const allowedJson = (input.allowedCompensationTypesJson || '').trim();

  // No comp type → can't evaluate
  if (!compType) {
    return { mismatch: null, summary: null };
  }

  // No allowed-types list → campaign hasn't configured governance
  if (!allowedJson || allowedJson === '[]') {
    return { mismatch: null, summary: null };
  }

  // Parse the allowed list
  let allowed: string[];
  try {
    const parsed = JSON.parse(allowedJson);
    if (!Array.isArray(parsed)) return { mismatch: null, summary: null };
    allowed = parsed.map((v: unknown) => String(v).trim().toUpperCase());
  } catch {
    return { mismatch: null, summary: null };
  }

  if (allowed.length === 0) {
    return { mismatch: null, summary: null };
  }

  // Check
  const isAllowed = allowed.includes(compType);
  const campaignLabel = input.campaignName || 'linked campaign';
  const riskLabel = input.campaignRiskMode
    ? ` (${input.campaignRiskMode.toLowerCase()} mode)`
    : '';

  if (isAllowed) {
    return {
      mismatch: false,
      summary: `Compensation type ${compType} is within ${campaignLabel}${riskLabel} allowed types.`,
    };
  }

  return {
    mismatch: true,
    summary: `Compensation type ${compType} is NOT in ${campaignLabel}${riskLabel} allowed types [${allowed.join(', ')}]. Campaign compensation drift detected.`,
  };
}
