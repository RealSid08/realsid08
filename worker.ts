import { getGithubPayload, GithubLookupError } from './lib/github';
import { transcribeAudio, TranscriptionError } from './lib/transcribe';

type Env = {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  OPENAI_API_KEY?: string;
  /** Where the chat assistant runs. Code mode needs Node, so it lives on Vercel rather than in this Worker. */
  AGENT_ORIGIN?: string;
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

    if (url.pathname === '/api/transcribe') {
      if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
      if (!env.OPENAI_API_KEY) return json({ error: 'Dictation unavailable' }, 500);
      if (Number(request.headers.get('content-length')) > 11 * 1024 * 1024) return json({ error: 'Recording too large' }, 413);
      try {
        const text = await transcribeAudio(env.OPENAI_API_KEY, await request.formData());
        return json({ text });
      } catch (error) {
        if (error instanceof TranscriptionError) return json({ error: error.message }, error.status);
        console.error('Dictation error:', error instanceof Error ? error.message : 'unknown');
        return json({ error: 'Dictation unavailable' }, 502);
      }
    }

    if (url.pathname === '/api/chat') {
      if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
      if (!env.AGENT_ORIGIN) return json({ error: 'Chat unavailable' }, 500);
      if (Number(request.headers.get('content-length')) > 512 * 1024) return json({ error: 'Conversation too long' }, 413);
      try {
        // Stream the assistant's reply straight through.
        const upstream = await fetch(new URL('/api/chat', env.AGENT_ORIGIN), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: request.body,
        });
        const headers = new Headers(upstream.headers);
        headers.set('Cache-Control', 'no-store');
        return new Response(upstream.body, { status: upstream.status, headers });
      } catch (error) {
        console.error('Chat proxy error:', error instanceof Error ? error.message : 'unknown');
        return json({ error: 'Chat unavailable' }, 502);
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
