import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';
import { transcribeAudio, TranscriptionError } from './lib/transcribe';
import { isUiMessageArray, streamPortfolioChat } from './lib/portfolioChat';
import { getGithubPayload, GithubLookupError } from './lib/github';

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw) as unknown);
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function openaiLocalApi(apiKey: string | undefined) {
  const handler = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const path = req.url?.split('?')[0];

    if (path === '/api/transcribe') {
      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
      }
      if (!apiKey) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Dictation unavailable' }));
        return;
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
        const text = await transcribeAudio(apiKey, await request.formData());
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ text }));
      } catch (error) {
        console.error('Dictation error:', error instanceof Error ? error.message : 'unknown');
        res.statusCode = error instanceof TranscriptionError ? error.status : 502;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: error instanceof TranscriptionError ? error.message : 'Dictation unavailable' }));
      }
      return;
    }

    if (path === '/api/chat') {
      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
      }
      if (!apiKey) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Chat unavailable' }));
        return;
      }
      try {
        const body = await readJsonBody(req);
        const messages = typeof body === 'object' && body !== null && 'messages' in body
          ? (body as { messages: unknown }).messages
          : undefined;
        if (!isUiMessageArray(messages)) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Invalid messages' }));
          return;
        }
        await streamPortfolioChat({ apiKey, messages, response: res });
      } catch (error) {
        console.error('Chat API error:', error instanceof Error ? error.message : 'unknown');
        if (!res.writableEnded) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Chat unavailable' }));
        }
      }
      return;
    }

    if (path === '/api/github') {
      const url = new URL(req.url ?? '/', 'http://localhost');
      void getGithubPayload(url.searchParams)
        .then((payload) => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(payload));
        })
        .catch((error: unknown) => {
          if (error instanceof GithubLookupError) {
            res.statusCode = error.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: error.message }));
            return;
          }
          console.error('GitHub context error:', error instanceof Error ? error.message : 'unknown');
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'GitHub unavailable' }));
        });
      return;
    }

    next();
  };

  return {
    name: 'openai-local-api',
    configureServer(server: { middlewares: { use: (fn: typeof handler) => void } }) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server: { middlewares: { use: (fn: typeof handler) => void } }) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (env.OPENAI_API_KEY) {
    process.env.OPENAI_API_KEY = env.OPENAI_API_KEY;
    console.info('OpenAI: OPENAI_API_KEY loaded for /api/transcribe and /api/chat');
  } else {
    console.warn('OpenAI: OPENAI_API_KEY missing — set it in .env.local');
  }

  return {
    plugins: [react(), openaiLocalApi(env.OPENAI_API_KEY)],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    server: {
      host: true,
    },
  };
});
