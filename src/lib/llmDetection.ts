// ============================================================
// FUNDUREX — INFLUWATCH
// LLM Detection Service
//
// Contextual compliance detection via the Anthropic Claude API.
// Complements the phrase-match engine in ruleRegistry.ts with
// semantic findings — solicitation intent, inadequate disclosure,
// performance claims, urgency tactics, unbalanced risk framing —
// that plain phrase lists can't reliably catch.
//
// Design invariants:
//   1. Fail-open. If the API key is missing, Anthropic is down,
//      the request times out, or the response is malformed, this
//      service returns [] and logs. It NEVER throws. Ingestion
//      must not block on LLM availability.
//   2. Deterministic. temperature=0 so the same content produces
//      the same findings for audit reproducibility.
//   3. Constrained output. Only rule codes LLM-001..LLM-005 are
//      accepted from the model; anything else is dropped.
//   4. Severity clamped. Per-rule ceilings in constants prevent
//      the model from inflating severity beyond what the rule
//      category can regulatorily support.
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import type { Severity } from '@prisma/client';

import logger from '../utils/logger';
import {
  LLM_RULE_CODE_SET,
  LLM_RULE_CODE_NAME,
  clampLlmSeverity,
  describePosture,
  type LlmRuleCode,
} from './llmDetection.constants';

// ── Model config ──────────────────────────────────────────────

const MODEL_ID       = 'claude-sonnet-4-5-20250929';
const MAX_TOKENS     = 1000;
const TEMPERATURE    = 0;
const REQUEST_TIMEOUT_MS = 10_000;

// ── Client ────────────────────────────────────────────────────

let _client: Anthropic | null = null;
let _clientInitFailed = false;

function getClient(): Anthropic | null {
  if (_clientInitFailed) return null;
  if (_client) return _client;

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    logger.warn('LLM detection disabled — ANTHROPIC_API_KEY is not configured');
    _clientInitFailed = true;
    return null;
  }

  try {
    _client = new Anthropic({ apiKey: key, timeout: REQUEST_TIMEOUT_MS });
    return _client;
  } catch (err: any) {
    logger.error({ err: err?.message }, 'Failed to initialize Anthropic client — LLM detection disabled');
    _clientInitFailed = true;
    return null;
  }
}

// ── Public types ──────────────────────────────────────────────

export interface LlmDetectionInput {
  bodyText:           string;
  transcriptText?:    string | null;
  supervisionPosture: string;
  compensationForm:   string;
  isTransactionBased: boolean;
  isSecurityLinked:   boolean;
}

export interface LlmFinding {
  ruleCode:      LlmRuleCode;
  ruleName:      string;
  severity:      Severity;
  matchedPhrase: string;
  explanation:   string;
}

export interface LlmDetectionResult {
  findings:    LlmFinding[];
  rawResponse: string | null;
  latencyMs:   number;
  modelId:     string;
  error?:      string;
}

// ── Prompt construction ───────────────────────────────────────

function buildSystemPrompt(postureDescription: string): string {
  return [
    'You are a FINRA compliance analyst reviewing content from a compensated external promoter.',
    `The promoter\'s compensation structure is: ${postureDescription}`,
    '',
    'Review the following content and identify any of the following concerns:',
    '(a) Solicitation language — actively directing someone toward a specific investment transaction',
    '(b) Missing or inadequate compensation disclosure',
    '(c) Performance claims or guarantees',
    '(d) Urgency or pressure tactics designed to induce immediate action',
    '(e) Misleading or unbalanced statements about risk or returns',
    '',
    'For each finding return a JSON object with these fields:',
    '  ruleCode:      one of "LLM-001" (solicitation), "LLM-002" (missing disclosure), "LLM-003" (performance claims), "LLM-004" (urgency/pressure), "LLM-005" (misleading risk/return)',
    '  severity:      one of "CRITICAL", "HIGH", "MEDIUM", "LOW"',
    '  matchedPhrase: the exact language from the content that triggered the finding (verbatim, max 200 chars)',
    '  explanation:   one sentence in plain English that a Chief Compliance Officer can read directly, explaining why this is a concern given the compensation structure above',
    '',
    'Output format: Return ONLY a JSON array of findings. If there are no violations return an empty JSON array [].',
    'Do not include any text before or after the JSON. Do not wrap the JSON in markdown code fences. Do not include explanations, preambles, or conclusions outside the JSON.',
    '',
    'Important rules:',
    '- Only use ruleCode values LLM-001 through LLM-005. Do not invent new rule codes.',
    '- The matchedPhrase must be a verbatim substring of the content — do not paraphrase.',
    '- If the content does not reference a specific investment product or financial service, return an empty array.',
    '- An absent compensation disclosure is itself an LLM-002 finding, even when the content seems benign, if the compensation posture above indicates disclosure is required.',
  ].join('\n');
}

function buildUserContent(bodyText: string, transcriptText?: string | null): string {
  const parts: string[] = [];
  if (bodyText && bodyText.trim().length > 0) {
    parts.push('--- CONTENT BODY ---');
    parts.push(bodyText.trim());
  }
  if (transcriptText && transcriptText.trim().length > 0 && transcriptText.trim() !== (bodyText || '').trim()) {
    parts.push('');
    parts.push('--- TRANSCRIPT (from audio/video) ---');
    parts.push(transcriptText.trim());
  }
  if (parts.length === 0) {
    return '(No content body or transcript provided.)';
  }
  return parts.join('\n');
}

// ── Response parsing ──────────────────────────────────────────

interface RawClaudeFinding {
  ruleCode?:      unknown;
  severity?:      unknown;
  matchedPhrase?: unknown;
  explanation?:   unknown;
}

function parseClaudeResponse(rawText: string): LlmFinding[] {
  // Strip any stray leading/trailing whitespace or code fences the
  // model might have emitted despite being told not to.
  let text = rawText.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  }

  // Extract the first JSON array in the text (defensive — if Claude
  // wraps the array in prose despite instructions, we still recover).
  const firstBracket = text.indexOf('[');
  const lastBracket  = text.lastIndexOf(']');
  if (firstBracket === -1 || lastBracket === -1 || lastBracket < firstBracket) {
    throw new Error('No JSON array found in response');
  }
  text = text.slice(firstBracket, lastBracket + 1);

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err: any) {
    throw new Error(`Failed to parse JSON: ${err.message}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Response is not a JSON array');
  }

  const validSeverities: ReadonlySet<Severity> = new Set(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);
  const findings: LlmFinding[] = [];

  for (const item of parsed as RawClaudeFinding[]) {
    if (!item || typeof item !== 'object') continue;

    const ruleCode      = typeof item.ruleCode === 'string' ? item.ruleCode.toUpperCase().trim() : '';
    const severity      = typeof item.severity === 'string' ? item.severity.toUpperCase().trim() : '';
    const matchedPhrase = typeof item.matchedPhrase === 'string' ? item.matchedPhrase.trim() : '';
    const explanation   = typeof item.explanation === 'string' ? item.explanation.trim() : '';

    // Validate rule code against the locked set
    if (!LLM_RULE_CODE_SET.has(ruleCode)) {
      logger.warn({ ruleCode }, 'LLM detection returned an unknown rule code — dropping finding');
      continue;
    }

    // Validate severity
    if (!validSeverities.has(severity as Severity)) {
      logger.warn({ severity, ruleCode }, 'LLM detection returned an invalid severity — dropping finding');
      continue;
    }

    // Matched phrase + explanation are required
    if (matchedPhrase.length === 0 || explanation.length === 0) {
      logger.warn({ ruleCode }, 'LLM detection returned a finding with empty matchedPhrase or explanation — dropping');
      continue;
    }

    // Clamp severity against the per-rule ceiling
    const clamped = clampLlmSeverity(ruleCode as LlmRuleCode, severity as Severity);

    findings.push({
      ruleCode:      ruleCode as LlmRuleCode,
      ruleName:      LLM_RULE_CODE_NAME[ruleCode as LlmRuleCode],
      severity:      clamped,
      matchedPhrase: matchedPhrase.slice(0, 500),
      explanation:   explanation.slice(0, 500),
    });
  }

  return findings;
}

// ── Public entry point ────────────────────────────────────────

/**
 * Run LLM contextual detection on a piece of content.
 * Fail-open: returns { findings: [], error } on any failure.
 * Never throws.
 */
export async function runLlmDetection(input: LlmDetectionInput): Promise<LlmDetectionResult> {
  const started = Date.now();
  const empty: LlmDetectionResult = {
    findings:    [],
    rawResponse: null,
    latencyMs:   0,
    modelId:     MODEL_ID,
  };

  const client = getClient();
  if (!client) {
    return { ...empty, latencyMs: Date.now() - started, error: 'client-unavailable' };
  }

  const systemPrompt = buildSystemPrompt(describePosture({
    supervisionPosture: input.supervisionPosture,
    compensationForm:   input.compensationForm,
    isTransactionBased: input.isTransactionBased,
    isSecurityLinked:   input.isSecurityLinked,
  }));
  const userContent = buildUserContent(input.bodyText, input.transcriptText);

  try {
    const response = await client.messages.create({
      model:       MODEL_ID,
      max_tokens:  MAX_TOKENS,
      temperature: TEMPERATURE,
      system:      systemPrompt,
      messages:    [{ role: 'user', content: userContent }],
    });

    // Extract text from the response content blocks
    const textBlocks = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text);
    const rawResponse = textBlocks.join('\n').trim();

    if (!rawResponse) {
      return {
        ...empty,
        latencyMs:   Date.now() - started,
        rawResponse: '',
        error:       'empty-response',
      };
    }

    try {
      const findings = parseClaudeResponse(rawResponse);
      return {
        findings,
        rawResponse,
        latencyMs: Date.now() - started,
        modelId:   MODEL_ID,
      };
    } catch (parseErr: any) {
      logger.warn(
        { err: parseErr.message, rawResponseLength: rawResponse.length },
        'LLM detection — failed to parse Claude response',
      );
      return {
        ...empty,
        latencyMs:   Date.now() - started,
        rawResponse,
        error:       `parse-error: ${parseErr.message}`,
      };
    }
  } catch (err: any) {
    logger.warn({ err: err?.message, status: err?.status }, 'LLM detection — Claude API call failed');
    return {
      ...empty,
      latencyMs: Date.now() - started,
      error:     `api-error: ${err?.message || 'unknown'}`,
    };
  }
}
