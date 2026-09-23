/**
 * Public GitHub context. Only allowlisted accounts, only non-private
 * repositories, cached so a visitor's question never hammers the API.
 */

export const ALLOWED_ACCOUNTS = ['RealSid08', 'OpenRenderKit'] as const;
export type AllowedAccount = (typeof ALLOWED_ACCOUNTS)[number];

const TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; value: unknown }>();

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
const isPublicWork = (raw: RawRepo) => !raw.private && !raw.fork && !raw.archived;

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
    const response = await fetch(`https://api.github.com/repos/${account}/${repo}`, {
      headers: requestHeaders(),
    });
    if (!response.ok) throw new Error(`GitHub responded ${response.status}`);
    const raw = (await response.json()) as RawRepo;
    if (!isPublicWork(raw)) throw new Error('That repository is not public');

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
