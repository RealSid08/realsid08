import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';
import { SYSTEM_INSTRUCTION_LIVE } from './constants';
import { createRealtimeClientSecret } from './lib/openaiRealtime';
import { isUiMessageArray, streamPortfolioChat } from './lib/portfolioChat';

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

    if (path === '/api/token') {
      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
      }
      if (!apiKey) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Voice session unavailable' }));
        return;
      }
      try {
        const value = await createRealtimeClientSecret(apiKey, SYSTEM_INSTRUCTION_LIVE);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ value }));
      } catch (error) {
        console.error('Voice Hub token error:', error instanceof Error ? error.message : 'unknown');
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Voice session unavailable' }));
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
    console.info('OpenAI: OPENAI_API_KEY loaded for /api/token and /api/chat');
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
