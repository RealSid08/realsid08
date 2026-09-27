import { SYSTEM_INSTRUCTION_LIVE } from './constants';
import { createPortfolioChatResponse, isUiMessageArray } from './lib/portfolioChat';
import { getGithubPayload, GithubLookupError } from './lib/github';
import { createRealtimeClientSecret } from './lib/openaiRealtime';

type Env = {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  OPENAI_API_KEY?: string;
};

const json = (body: unknown, status = 200, headers?: HeadersInit) =>
  Response.json(body, { status, headers });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/github') {
      if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
      try {
        const payload = await getGithubPayload(url.searchParams);
        return json(payload, 200, { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800' });
      } catch (error) {
        if (error instanceof GithubLookupError) return json({ error: error.message }, error.status);
        console.error('GitHub context error:', error instanceof Error ? error.message : 'unknown');
        return json({ error: 'GitHub unavailable' }, 502);
      }
    }

    if (url.pathname === '/api/token') {
      if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
      if (!env.OPENAI_API_KEY) return json({ error: 'Voice session unavailable' }, 500);
      try {
        const value = await createRealtimeClientSecret(env.OPENAI_API_KEY, SYSTEM_INSTRUCTION_LIVE);
        return json({ value });
      } catch (error) {
        console.error('Voice Hub token error:', error instanceof Error ? error.message : 'unknown');
        return json({ error: 'Voice session unavailable' }, 500);
      }
    }

    if (url.pathname === '/api/chat') {
      if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
      if (!env.OPENAI_API_KEY) return json({ error: 'Chat unavailable' }, 500);
      try {
        const body: unknown = await request.json();
        const messages = typeof body === 'object' && body !== null && 'messages' in body
          ? (body as { messages: unknown }).messages
          : undefined;
        if (!isUiMessageArray(messages)) return json({ error: 'Invalid messages' }, 400);
        return createPortfolioChatResponse({ apiKey: env.OPENAI_API_KEY, messages });
      } catch (error) {
        console.error('Chat API error:', error instanceof Error ? error.message : 'unknown');
        return json({ error: 'Chat unavailable' }, 500);
      }
    }

    if (url.pathname.startsWith('/api/')) return json({ error: 'Not found' }, 404);

    const response = await env.ASSETS.fetch(request);
    if (url.pathname === '/Sidhaarth_Krishnan_Resume.pdf' && response.ok) {
      const headers = new Headers(response.headers);
      headers.set('Content-Type', 'application/pdf');
      headers.set('Content-Disposition', 'attachment; filename="Sidhaarth_Krishnan_Resume.pdf"');
      return new Response(response.body, { status: response.status, headers });
    }
    return response;
  },
};
