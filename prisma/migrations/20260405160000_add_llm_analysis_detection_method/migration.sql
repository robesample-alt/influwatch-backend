-- AlterEnum
-- Adds LLM_ANALYSIS to the DetectionMethod enum so DetectionRecords
-- produced by the Anthropic Claude contextual detection service can be
-- stored with an accurate method attribution. Phrase-match,
-- disclosure-check, and pattern-match detections are unchanged.
ALTER TYPE "DetectionMethod" ADD VALUE 'LLM_ANALYSIS';
