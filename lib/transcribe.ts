const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg']);

export class TranscriptionError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function transcribeAudio(apiKey: string, form: FormData): Promise<string> {
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_AUDIO_BYTES || !ALLOWED_TYPES.has(file.type)) {
    throw new TranscriptionError('Unsupported or oversized audio recording', 400);
  }

  const body = new FormData();
  body.set('model', 'gpt-transcribe');
  body.set('file', file, file.name || 'dictation.webm');
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body,
  });
  if (!response.ok) throw new Error(`OpenAI transcription responded ${response.status}`);
  const result = await response.json() as { text?: unknown };
  if (typeof result.text !== 'string' || !result.text.trim()) throw new Error('Transcription was empty');
  return result.text.trim().slice(0, 5000);
}
