import { streamPortfolioChat, isUiMessageArray } from '../lib/portfolioChat';

type ChatRequest = {
  method?: string;
  body?: {
    messages?: unknown;
  };
};

type NodeLikeResponse = {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  end: (chunk?: string) => void;
  writableEnded?: boolean;
};

export default async function handler(req: ChatRequest, res: NodeLikeResponse) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Chat unavailable' }));
    return;
  }

  const messages = req.body?.messages;
  if (!isUiMessageArray(messages)) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Invalid messages' }));
    return;
  }

  try {
    await streamPortfolioChat({
      apiKey,
      messages,
      response: res as unknown as import('http').ServerResponse,
    });
  } catch (error) {
    console.error('Chat API Error:', error instanceof Error ? error.message : 'unknown');
    if (!res.writableEnded) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Chat unavailable' }));
    }
  }
}
