"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH PHASE 2
// Service — Transcription
//
// Wraps OpenAI Whisper API (model: whisper-1).
// Accepts a local file path, returns the full transcript string.
// Throws on API error or missing key — caller handles the response.
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcribeFile = transcribeFile;
const openai_1 = __importDefault(require("openai"));
const fs_1 = __importDefault(require("fs"));
let _client = null;
function getClient() {
    if (!_client) {
        const key = process.env.OPENAI_API_KEY;
        if (!key)
            throw new Error('OPENAI_API_KEY is not configured in environment');
        _client = new openai_1.default({ apiKey: key });
    }
    return _client;
}
/**
 * Transcribe a local video or audio file using OpenAI Whisper (whisper-1).
 * Returns the full transcript as a trimmed plain-text string.
 * Throws on API failure or if the key is missing.
 */
async function transcribeFile(filePath) {
    const client = getClient();
    const stream = fs_1.default.createReadStream(filePath);
    const response = await client.audio.transcriptions.create({
        file: stream,
        model: 'whisper-1',
    });
    return response.text.trim();
}
//# sourceMappingURL=transcription.service.js.map