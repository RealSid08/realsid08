import { getPublicRepo, isAllowedAccount, listPublicRepos } from '../lib/github';

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

  const account = first(req.query?.account) ?? 'RealSid08';
  const repo = first(req.query?.repo);

  if (!isAllowedAccount(account)) {
    return res.status(400).json({ error: 'Account not allowed', allowed: ['RealSid08', 'OpenRenderKit'] });
  }

  try {
    const payload = repo ? await getPublicRepo(account, repo) : await listPublicRepos(account);
    res.setHeader?.('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1800');
    return res.status(200).json(payload);
  } catch (error) {
    console.error('GitHub context error:', error instanceof Error ? error.message : 'unknown');
    return res.status(502).json({ error: 'GitHub unavailable' });
  }
}
