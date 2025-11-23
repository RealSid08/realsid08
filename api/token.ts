import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use VITE_API_KEY if available (local) or GEMINI_API_KEY (server env)
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API Key not configured' });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Create ephemeral token
    // Default expiration is 30 minutes for the token itself
    // and 1 minute to start a new session.
    const token = await (ai as any).authTokens.create({
      config: {
        httpOptions: { apiVersion: 'v1alpha' }
      }
    });

    return res.status(200).json({ token: token.name });
  } catch (error: any) {
    console.error('Token Generation Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
