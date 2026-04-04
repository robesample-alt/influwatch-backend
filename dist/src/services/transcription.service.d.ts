/**
 * Transcribe a local video or audio file using OpenAI Whisper (whisper-1).
 * Returns the full transcript as a trimmed plain-text string.
 * Throws on API failure or if the key is missing.
 */
export declare function transcribeFile(filePath: string): Promise<string>;
/**
 * Download a video/audio URL to a temp file, transcribe it via Whisper,
 * then clean up. Returns the transcript string.
 * Returns null (does not throw) if the download or transcription fails.
 */
export declare function transcribeUrl(url: string): Promise<string | null>;
//# sourceMappingURL=transcription.service.d.ts.map