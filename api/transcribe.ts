import { transcribeAudio, TranscriptionError } from '../lib/transcribe';
import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }
  if (!process.env.OPENAI_API_KEY) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'Dictation unavailable' }));
  }
  try {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of req) {
      const bytes = Buffer.from(chunk);
      size += bytes.length;
      if (size > 11 * 1024 * 1024) throw new TranscriptionError('Recording too large', 400);
      chunks.push(bytes);
    }
    const request = new Request('http://localhost/api/transcribe', {
      method: 'POST', headers: { 'Content-Type': req.headers['content-type'] ?? '' }, body: Buffer.concat(chunks),
    });
    const text = await transcribeAudio(process.env.OPENAI_API_KEY, await request.formData());
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ text }));
  } catch (error) {
    res.statusCode = error instanceof TranscriptionError ? error.status : 502;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: error instanceof TranscriptionError ? error.message : 'Dictation unavailable' }));
  }
}
