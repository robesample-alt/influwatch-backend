// ============================================================
// FUNDUREX — INFLUWATCH PHASE 2
// Service — Transcription
//
// Wraps OpenAI Whisper API (model: whisper-1).
// Accepts a local file path, returns the full transcript string.
// Throws on API error or missing key — caller handles the response.
// ============================================================

import OpenAI from 'openai';
import fs     from 'fs';
import path   from 'path';
import os     from 'os';

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error('OPENAI_API_KEY is not configured in environment');
    _client = new OpenAI({ apiKey: key });
  }
  return _client;
}

/**
 * Transcribe a local video or audio file using OpenAI Whisper (whisper-1).
 * Returns the full transcript as a trimmed plain-text string.
 * Throws on API failure or if the key is missing.
 */
export async function transcribeFile(filePath: string): Promise<string> {
  const client   = getClient();
  const stream   = fs.createReadStream(filePath);

  const response = await client.audio.transcriptions.create({
    file:  stream,
    model: 'whisper-1',
  });

  return response.text.trim();
}

/**
 * Download a video/audio URL to a temp file, transcribe it via Whisper,
 * then clean up. Returns the transcript string.
 * Returns null (does not throw) if the download or transcription fails.
 */
export async function transcribeUrl(url: string): Promise<string | null> {
  const tmpDir  = os.tmpdir();
  const tmpFile = path.join(tmpDir, `iw-transcribe-${Date.now()}.mp4`);

  try {
    // Download the media file
    const res = await fetch(url);
    if (!res.ok || !res.body) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(tmpFile, buffer);

    // Transcribe
    const transcript = await transcribeFile(tmpFile);
    return transcript;
  } catch {
    return null;
  } finally {
    // Clean up temp file
    try { fs.unlinkSync(tmpFile); } catch {}
  }
}
