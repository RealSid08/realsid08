import { getGithubPayload, GithubLookupError } from '../lib/github.js';

type GithubRequest = {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
};

type GithubResponse = {
  status: (code: number) => GithubResponse;
  json: (body: unknown) => unknown;
  setHeader?: (name: string, value: string) => void;
};

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function handler(req: GithubRequest, res: GithubResponse) {
  if (req.method && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query ?? {})) {
      const one = first(value);
      if (one !== undefined) params.set(key, one);
    }
    const payload = await getGithubPayload(params);
    res.setHeader?.('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1800');
    return res.status(200).json(payload);
  } catch (error) {
    if (error instanceof GithubLookupError) return res.status(error.status).json({ error: error.message });
    console.error('GitHub context error:', error instanceof Error ? error.message : 'unknown');
    return res.status(502).json({ error: 'GitHub unavailable' });
  }
}
