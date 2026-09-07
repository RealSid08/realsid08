import { SYSTEM_INSTRUCTION_LIVE } from '../constants';
import { createRealtimeClientSecret } from '../lib/openaiRealtime';

type TokenRequest = {
  method?: string;
};

type TokenResponse = {
  status: (code: number) => TokenResponse;
  json: (body: unknown) => unknown;
};

export default async function handler(req: TokenRequest, res: TokenResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Voice session unavailable' });
  }

  try {
    const value = await createRealtimeClientSecret(apiKey, SYSTEM_INSTRUCTION_LIVE);
    return res.status(200).json({ value });
  } catch (error) {
    console.error('Token Generation Error:', error instanceof Error ? error.message : 'unknown');
    return res.status(500).json({ error: 'Voice session unavailable' });
  }
}
