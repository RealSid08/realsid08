/**
 * Public GitHub context. Only allowlisted accounts, only non-private
 * repositories, cached so a visitor's question never hammers the API.
 */

export const ALLOWED_ACCOUNTS = ['RealSid08', 'OpenRenderKit'] as const;
export type AllowedAccount = (typeof ALLOWED_ACCOUNTS)[number];

const TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; value: unknown }>();
const REPO_NAME = /^[A-Za-z0-9._-]{1,100}$/;
const MAX_FILE_BYTES = 64_000;
const MAX_TEXT_CHARS = 20_000;

export class GithubLookupError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export type PublicRepo = {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  pushedAt: string;
  url: string;
  topics: string[];
};

export type RepoList = {
  account: string;
  fetchedAt: string;
  repos: PublicRepo[];
};

export type RepoDetail = {
  account: string;
  fetchedAt: string;
  repo: PublicRepo & { homepage: string | null; openIssues: number; defaultBranch: string; languages: string[] };
};

type RawRepo = {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  pushed_at: string;
  html_url: string;
  private: boolean;
  fork: boolean;
  archived: boolean;
  topics?: string[];
  homepage?: string | null;
  open_issues_count?: number;
  default_branch?: string;
};

export const isAllowedAccount = (account: string): account is AllowedAccount =>
  ALLOWED_ACCOUNTS.some((allowed) => allowed.toLowerCase() === account.toLowerCase());

const validRepo = (repo: string) => REPO_NAME.test(repo) && repo !== '.' && repo !== '..';
const validPath = (path: string) => path === '' || (path.length <= 300 && !path.startsWith('/') &&
  path.split('/').every((part) => part.length > 0 && part !== '.' && part !== '..' && !part.includes('\\')));
const githubJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, { headers: requestHeaders() });
  if (response.status === 404) throw new GithubLookupError('Public GitHub resource not found', 404);
  if (!response.ok) throw new Error(`GitHub responded ${response.status}`);
  return response.json() as Promise<T>;
};

const requestHeaders = () => {
  const token = process.env.GITHUB_TOKEN;
  return {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'realsid08-portfolio',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const cached = async <T>(key: string, load: () => Promise<T>): Promise<T> => {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as T;
  const value = await load();
  cache.set(key, { at: Date.now(), value });
  return value;
};

const toPublicRepo = (raw: RawRepo): PublicRepo => ({
  name: raw.name,
  description: raw.description,
  language: raw.language,
  stars: raw.stargazers_count,
  pushedAt: raw.pushed_at,
  url: raw.html_url,
  topics: raw.topics ?? [],
});

/** Forks and archived repos are dropped; private repos are dropped in code. */
const isPublicWork = (raw: RawRepo) => raw.private === false && raw.fork === false && raw.archived === false;

export const listPublicRepos = async (account: AllowedAccount): Promise<RepoList> =>
  cached(`repos:${account}`, async () => {
    const response = await fetch(`https://api.github.com/users/${account}/repos?per_page=100&sort=pushed`, {
      headers: requestHeaders(),
    });
    if (!response.ok) throw new Error(`GitHub responded ${response.status}`);
    const raw = (await response.json()) as RawRepo[];
    return {
      account,
      fetchedAt: new Date().toISOString(),
      repos: raw.filter(isPublicWork).map(toPublicRepo),
    };
  });

export const getPublicRepo = async (account: AllowedAccount, repo: string): Promise<RepoDetail> =>
  cached(`repo:${account}:${repo}`, async () => {
    if (!validRepo(repo)) throw new GithubLookupError('Invalid repository name', 400);
    const response = await fetch(`https://api.github.com/repos/${account}/${repo}`, {
      headers: requestHeaders(),
    });
    if (!response.ok) throw new Error(`GitHub responded ${response.status}`);
    const raw = (await response.json()) as RawRepo;
    if (!isPublicWork(raw)) throw new GithubLookupError('Repository is not available', 404);

    const languages = await fetch(`https://api.github.com/repos/${account}/${repo}/languages`, {
      headers: requestHeaders(),
    })
      .then((result) => (result.ok ? (result.json() as Promise<Record<string, number>>) : {}))
      .catch(() => ({}));

    return {
      account,
      fetchedAt: new Date().toISOString(),
      repo: {
        ...toPublicRepo(raw),
        homepage: raw.homepage ?? null,
        openIssues: raw.open_issues_count ?? 0,
        defaultBranch: raw.default_branch ?? 'main',
        languages: Object.keys(languages ?? {}).slice(0, 6),
      },
    };
  });

type RawEntry = { type: string; name: string; path: string; size?: number; html_url: string | null; encoding?: string; content?: string };
type RawIssue = { number: number; title: string; body: string | null; state: string; html_url: string; updated_at: string; comments?: number; pull_request?: unknown };
type RawPull = RawIssue & { merged_at?: string | null };
const excerpt = (value: string | null | undefined, limit = 4000) => {
  const text = value ?? '';
  return text.length > limit ? `${text.slice(0, limit)}\n[truncated]` : text;
};

export type GithubView = 'code' | 'issues' | 'pulls';

export type SearchKind = 'pulls' | 'issues' | 'code';
const SEARCH_KINDS: readonly SearchKind[] = ['pulls', 'issues', 'code'];
const MAX_QUERY_CHARS = 100;
const SEARCH_AUTHOR = ALLOWED_ACCOUNTS[0];

type RawSearchIssue = RawIssue & { repository_url: string; pull_request?: { merged_at?: string | null }; user?: { login: string } };
type RawSearchCode = { name: string; path: string; html_url: string; repository: { full_name: string; private: boolean; fork: boolean } };

/**
 * Free text only. Qualifiers (`repo:`, `user:`, `is:`...) are stripped so a query
 * cannot widen the search past the fixed scope built in searchGithub.
 */
const searchTerms = (query: string) =>
  query.replace(/[A-Za-z-]+:("[^"]*"|\S*)/g, ' ').replace(/[^\w\s.\-"']/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_QUERY_CHARS);

export const searchGithub = async (kind: SearchKind, query: string, state = 'all') => {
  const terms = searchTerms(query);
  if (!SEARCH_KINDS.includes(kind)) throw new GithubLookupError('Invalid search kind', 400);
  if (!['open', 'closed', 'all'].includes(state)) throw new GithubLookupError('Invalid state', 400);
  if (kind === 'code' && !terms) throw new GithubLookupError('Code search needs search terms', 400);
  return cached(`search:${kind}:${state}:${terms}`, async () => {
    const fetchedAt = new Date().toISOString();
    if (kind === 'code') {
      if (!process.env.GITHUB_TOKEN) throw new GithubLookupError('Code search is unavailable right now', 503);
      const perAccount = await Promise.all(ALLOWED_ACCOUNTS.map((account) =>
        githubJson<{ items: RawSearchCode[] }>(`https://api.github.com/search/code?per_page=10&q=${encodeURIComponent(`${terms} user:${account}`)}`)));
      const results = perAccount.flatMap((page) => page.items)
        .filter((item) => !item.repository.private && !item.repository.fork)
        .slice(0, 15)
        .map((item) => ({ repo: item.repository.full_name, path: item.path, url: item.html_url }));
      return { kind, query: terms, fetchedAt, scope: ALLOWED_ACCOUNTS.join(' and '), results };
    }
    const qualifiers = [`author:${SEARCH_AUTHOR}`, 'is:public', kind === 'pulls' ? 'is:pr' : 'is:issue', ...(state === 'all' ? [] : [`is:${state}`])];
    const page = await githubJson<{ total_count: number; items: RawSearchIssue[] }>(
      `https://api.github.com/search/issues?per_page=20&sort=updated&order=desc&q=${encodeURIComponent([terms, ...qualifiers].join(' '))}`);
    const results = page.items.map((item) => ({
      repo: item.repository_url.replace('https://api.github.com/repos/', ''),
      number: item.number,
      title: item.title,
      state: item.pull_request?.merged_at ? 'merged' : item.state,
      updatedAt: item.updated_at,
      url: item.html_url,
      body: excerpt(item.body, 300),
    }));
    return { kind, query: terms, fetchedAt, scope: `public ${kind === 'pulls' ? 'pull requests' : 'issues'} authored by ${SEARCH_AUTHOR} on any repository`, total: page.total_count, results };
  });
};

export const getGithubPayload = async (params: URLSearchParams) => {
  if (params.get('view') === 'search') {
    return searchGithub(params.get('kind') as SearchKind, params.get('q') ?? '', params.get('state') ?? 'all');
  }
  const account = params.get('account') ?? 'RealSid08';
  if (!isAllowedAccount(account)) throw new GithubLookupError('Account not allowed', 400);
  const repo = params.get('repo');
  const view = params.get('view');
  if (!view && !repo) return listPublicRepos(account);
  if (!repo) throw new GithubLookupError('Repository required', 400);
  if (!validRepo(repo)) throw new GithubLookupError('Invalid repository name', 400);
  if (!view) return getPublicRepo(account, repo);
  if (!['code', 'issues', 'pulls'].includes(view)) throw new GithubLookupError('Invalid view', 400);
  const path = params.get('path') ?? '';
  const numberText = params.get('number');
  const state = params.get('state') ?? 'all';
  if (view === 'code') {
    if (numberText || params.has('state') || !validPath(path)) throw new GithubLookupError('Invalid code request', 400);
  } else if (path || !['open', 'closed', 'all'].includes(state) || (numberText !== null && !/^[1-9]\d{0,8}$/.test(numberText))) {
    throw new GithubLookupError('Invalid issue or pull request request', 400);
  }
  await getPublicRepo(account, repo); // verify visibility before every deeper read
  const base = `https://api.github.com/repos/${account}/${repo}`;
  const key = `${view}:${account}:${repo}:${path}:${numberText ?? ''}:${state}`;
  return cached(key, async () => {
    const fetchedAt = new Date().toISOString();
    if (view === 'code') {
      const suffix = path ? `/${path.split('/').map(encodeURIComponent).join('/')}` : '';
      const raw = await githubJson<RawEntry | RawEntry[]>(`${base}/contents${suffix}`);
      if (Array.isArray(raw)) return { account, repo, view, path, fetchedAt, entries: raw.slice(0, 100).map(({ type, name, path, size, html_url }) => ({ type, name, path, size, url: html_url })) };
      if (raw.type !== 'file' || raw.encoding !== 'base64' || !raw.content || (raw.size ?? 0) > MAX_FILE_BYTES) {
        throw new GithubLookupError('File is binary, unsupported, or too large', 400);
      }
      const bytes = Uint8Array.from(atob(raw.content.replace(/\s/g, '')), (char) => char.charCodeAt(0));
      const content = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      if (/\x00/.test(content)) throw new GithubLookupError('Binary file cannot be read', 400);
      return { account, repo, view, path: raw.path, fetchedAt, url: raw.html_url, size: raw.size, content: excerpt(content, MAX_TEXT_CHARS) };
    }
    if (view === 'issues') {
      const raw = numberText
        ? await githubJson<RawIssue>(`${base}/issues/${numberText}`)
        : await githubJson<RawIssue[]>(`${base}/issues?state=${state}&sort=updated&direction=desc&per_page=100`);
      if (Array.isArray(raw)) return { account, repo, view, state, fetchedAt, issues: raw.filter((item) => !item.pull_request).slice(0, 20).map((item) => ({ number: item.number, title: item.title, state: item.state, updatedAt: item.updated_at, url: item.html_url, body: excerpt(item.body, 500) })) };
      if (raw.pull_request) throw new GithubLookupError('That number is a pull request', 404);
      const comments = raw.comments ? await githubJson<Array<{ body: string; html_url: string }>>(`${base}/issues/${numberText}/comments?per_page=10`) : [];
      return { account, repo, view, fetchedAt, issue: { number: raw.number, title: raw.title, state: raw.state, updatedAt: raw.updated_at, url: raw.html_url, body: excerpt(raw.body), comments: comments.slice(0, 10).map((item) => ({ body: excerpt(item.body, 1000), url: item.html_url })) } };
    }
    const raw = numberText
      ? await githubJson<RawPull>(`${base}/pulls/${numberText}`)
      : await githubJson<RawPull[]>(`${base}/pulls?state=${state}&sort=updated&direction=desc&per_page=20`);
    if (Array.isArray(raw)) return { account, repo, view, state, fetchedAt, pulls: raw.map((item) => ({ number: item.number, title: item.title, state: item.state, updatedAt: item.updated_at, url: item.html_url, body: excerpt(item.body, 500) })) };
    const files = await githubJson<Array<{ filename: string; status: string; additions: number; deletions: number; patch?: string }>>(`${base}/pulls/${numberText}/files?per_page=30`);
    return { account, repo, view, fetchedAt, pull: { number: raw.number, title: raw.title, state: raw.state, mergedAt: raw.merged_at ?? null, updatedAt: raw.updated_at, url: raw.html_url, body: excerpt(raw.body), files: files.slice(0, 30).map((file) => ({ path: file.filename, status: file.status, additions: file.additions, deletions: file.deletions, patch: excerpt(file.patch, 1200) })) } };
  });
};

const asOf = (fetchedAt: string) => new Date(fetchedAt).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

export const formatReposForModel = (list: RepoList): string =>
  [
    `Public repositories for ${list.account}, as of ${asOf(list.fetchedAt)} (forks and archived repos excluded, private repos never included):`,
    ...list.repos
      .slice(0, 25)
      .map(
        (repo) =>
          `- **${repo.name}** — ${repo.description ?? 'no description'}${repo.language ? ` · ${repo.language}` : ''} · pushed ${repo.pushedAt.slice(0, 10)}${repo.stars ? ` · ${repo.stars}★` : ''} · ${repo.url}`,
      ),
    `Freshness: this snapshot was fetched at ${asOf(list.fetchedAt)} and is cached for up to 10 minutes.`,
  ].join('\n');

export const formatRepoForModel = (detail: RepoDetail): string =>
  [
    `**${detail.repo.name}** (${detail.account}), as of ${asOf(detail.fetchedAt)}:`,
    `- ${detail.repo.description ?? 'no description'}`,
    `- Language: ${detail.repo.language ?? 'unknown'}${detail.repo.languages.length > 0 ? ` · ${detail.repo.languages.join(', ')}` : ''}`,
    `- Last push: ${detail.repo.pushedAt.slice(0, 10)} · open issues: ${detail.repo.openIssues} · default branch: ${detail.repo.defaultBranch}`,
    detail.repo.homepage ? `- Homepage: ${detail.repo.homepage}` : null,
    `- ${detail.repo.url}`,
    `Freshness: fetched ${asOf(detail.fetchedAt)}, cached for up to 10 minutes.`,
  ]
    .filter(Boolean)
    .join('\n');
