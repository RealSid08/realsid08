/**
 * Checks the seams that are hard to see in a browser: that the server tells the
 * model about the same page tools the page can actually run, and that the
 * GitHub context only ever returns public, allowlisted work.
 *
 * Run with: npm run verify:agent
 */
import assert from 'node:assert/strict';
import { createUIMessageStream, readUIMessageStream, type UIMessage } from 'ai';
import { pipeJsonRender } from '@json-render/core';
import { JSONUIProvider, Renderer } from '@json-render/react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildPortfolioTools } from '../lib/portfolioChat';
import { PortfolioLink } from '../components/agent/PortfolioLink';
import { asOfLabel, portfolioEvidenceRegistry } from '../components/agent/PortfolioEvidence';
import { pageIntentsFromMessages } from '../services/agent/pageIntent';
import { TOOLS, toolByName } from '../services/agent/registry';
import { EXPERIENCES, PROJECTS, SKILLS } from '../constants';
import { ProjectExhibits } from '../components/ProjectExhibits';
import { Experience } from '../components/Experience';
import { NODE_POS } from '../components/SkillsMap';
import { formatWorkByTech } from '../services/localKnowledge';
import { SLASH_COMMANDS, matchCommands, parseSlash } from '../services/agent/commands';
import { CARD_IDS, isTargetId } from '../lib/portfolioIds';
import { transcribeAudio, TranscriptionError } from '../lib/transcribe';

const REQUIRED_TOOLS = [
  'get_state',
  'navigate_to',
  'highlight',
  'focus_mode',
  'walkthrough',
  'filter_work',
  'sort_work',
  'expand_card',
  'set_visibility',
  'set_theme',
  'reset_view',
];

const results: string[] = [];
const check = (label: string, fn: () => void) => {
  fn();
  results.push(`ok  ${label}`);
};
const checkAsync = async (label: string, fn: () => Promise<void>) => {
  await fn();
  results.push(`ok  ${label}`);
};

const link = (href: string, text = 'Label') => renderToStaticMarkup(createElement(PortfolioLink, { href, children: text }));

check('chat links render source icons and reject unsafe destinations', () => {
  const github = link('https://github.com/RealSid08/realsid08', 'Source');
  assert.match(github, /target="_blank"/);
  assert.match(github, /noopener noreferrer/);
  assert.match(github, /<svg/);
  assert.match(link('https://www.linkedin.com/in/someone'), /<svg/);
  assert.match(link('https://example.com/docs'), /<img[^>]+favicons\?domain=example\.com/);
  assert.ok(!link('javascript:alert(1)').includes('<a'));
  assert.ok(!link('//example.com').includes('<a'));
  assert.ok(!link('data:text/html,hi').includes('<a'));
});

check('page-id links drive the page and unknown ids stay plain text', () => {
  const page = link('#project-foodly', 'Foodly');
  assert.match(page, /href="#project-foodly"/);
  assert.ok(!page.includes('target="_blank"'), 'page links stay on the page');
  assert.ok(!link('#not-a-real-card').includes('<a'), 'unknown targets must not render a link');
  CARD_IDS.forEach((id) => assert.ok(isTargetId(id), `${id} should be a valid target`));
});

check('bare GitHub URLs get compact labels', () => {
  const text = (html: string) => html.replace(/<[^>]+>/g, '');
  const bare = (url: string) => text(link(url, url));
  assert.equal(bare('https://github.com/OpenRenderKit/ParkAlong/pull/12'), 'OpenRenderKit/ParkAlong#12');
  assert.equal(bare('https://github.com/RealSid08/realsid08'), 'RealSid08/realsid08');
  assert.equal(bare('https://github.com/RealSid08/realsid08/blob/main/lib/github.ts'), 'realsid08/lib/github.ts');
  assert.equal(text(link('https://github.com/RealSid08/realsid08', 'Custom text')), 'Custom text', 'explicit link text is kept');
});

check('a sourced evidence board renders within its json-render providers', () => {
  const spec = {
    root: 'board',
    elements: {
      board: { type: 'EvidenceBoard', props: { title: 'Public work', asOf: '2026-09-27' }, children: ['source'] },
      source: { type: 'SourceLink', props: { label: 'Repository', url: 'https://github.com/RealSid08/realsid08' } },
    },
  };
  const board = createElement(Renderer, { spec, registry: portfolioEvidenceRegistry });
  const html = renderToStaticMarkup(createElement(JSONUIProvider, { registry: portfolioEvidenceRegistry, initialState: {}, children: board }));
  assert.match(html, /Public work/);
  assert.match(html.replace(/<[^>]+>/g, ''), /Repository/);
  assert.match(html, /https:\/\/github.com\/RealSid08\/realsid08/);
});

check('every catalog component renders from streamed, partial and complete props', () => {
  const render = (spec: unknown) =>
    renderToStaticMarkup(createElement(JSONUIProvider, {
      registry: portfolioEvidenceRegistry,
      initialState: {},
      children: createElement(Renderer, { spec: spec as never, registry: portfolioEvidenceRegistry }),
    }));
  const spec = {
    root: 'stack',
    elements: {
      stack: { type: 'Stack', props: {}, children: ['card', 'compare', 'timeline', 'repos', 'button'] },
      card: { type: 'WorkCard', props: { target: 'project-foodly', title: 'Foodly', meta: 'Project · 2025', summary: 'Ordering app.', stack: ['React'] }, children: ['metrics'] },
      metrics: { type: 'MetricRow', props: {}, children: ['metric'] },
      metric: { type: 'Metric', props: { value: '600', label: 'users' } },
      compare: { type: 'Compare', props: { columns: [{ title: 'Foodly', target: 'project-foodly' }, { title: 'ParkAlong', target: 'project-parkalong' }], rows: [{ label: 'Type', values: ['App', 'App'] }, { label: 'Year', values: ['2025', '2026'] }] } },
      timeline: { type: 'Timeline', props: { items: [{ period: '2026', title: 'Besmak', note: 'Current', target: 'exp-besmak' }, { period: '2025', title: 'Foodly', note: 'Shipped', target: null }] } },
      repos: { type: 'RepoList', props: { asOf: '2026-09-29 12:00 UTC', repos: [{ name: 'OpenRenderKit/ParkAlong', url: 'https://github.com/OpenRenderKit/ParkAlong', description: 'Parking app', language: 'TypeScript', updated: '2026-09-01' }] } },
      button: { type: 'PageButton', props: { label: 'Show Foodly', action: 'show', value: 'project-foodly' } },
    },
  };
  const html = render(spec);
  ['Foodly', 'ParkAlong', 'Besmak', '600', 'Show Foodly', 'OpenRenderKit/ParkAlong'].forEach((text) => assert.ok(html.includes(text), `expected "${text}" in the rendered cards`));
  // While streaming, array props can be missing entirely.
  const partial = { root: 'c', elements: { c: { type: 'Compare', props: {} }, t: { type: 'Timeline', props: {} }, r: { type: 'RepoList', props: {} } } };
  assert.doesNotThrow(() => render(partial));
  assert.doesNotThrow(() => render({ root: 'r', elements: { r: partial.elements.r } }));
  assert.doesNotThrow(() => render({ root: 't', elements: { t: partial.elements.t } }));
});

check('fetch times are shown for people, not as raw ISO strings', () => {
  assert.equal(asOfLabel('2026-09-29T09:51:30.502Z'), 'Sep 29, 2026, 09:51 UTC');
  assert.equal(asOfLabel('2026-09-29 12:00 UTC'), '2026-09-29 12:00 UTC', 'other formats pass through');
});

check('portfolio data is consistent: unique ids, every skill cluster has a graph node', () => {
  const ids = [...EXPERIENCES.map((exp) => `exp-${exp.id}`), ...PROJECTS.map((project) => `project-${project.id}`)];
  assert.equal(new Set(ids).size, ids.length, 'card ids must be unique');
  assert.deepEqual(SKILLS.map((cluster) => cluster.id).sort(), Object.keys(NODE_POS).sort(), 'SKILLS and the SkillsMap nodes must match');
  PROJECTS.filter((project) => project.type === 'open-source').forEach((project) =>
    assert.ok(project.githubUrl?.startsWith('https://github.com/'), `${project.id} needs a public repo link`));
});

check('every card the page tools can target carries the data they filter and sort on', () => {
  const html = renderToStaticMarkup(createElement('div', null, createElement(Experience), createElement(ProjectExhibits)));
  const tags = html.match(/<div[^>]*\bid="(?:exp|project)-[^"]+"[^>]*>/g) ?? [];
  assert.equal(tags.length, EXPERIENCES.length + PROJECTS.filter((project) => project.type !== 'live-demo').length, 'one element per card id');
  tags.forEach((tag) => {
    assert.match(tag, /data-tech="[^"]+"/, `${tag.slice(0, 60)} needs data-tech`);
    assert.match(tag, /data-title="[^"]+"/, `${tag.slice(0, 60)} needs data-title`);
  });
});

check('tech lookups name every role and project that uses the tech, with card ids', () => {
  const convex = formatWorkByTech('convex');
  ['Besmak Components', 'Kenspire Advisors', 'Foodly'].forEach((name) => assert.ok(convex.includes(name), `Convex should include ${name}`));
  ['exp-besmak', 'exp-kenspire', 'project-foodly'].forEach((id) => assert.ok(convex.includes(id) && isTargetId(id), `${id} should be a real card id`));
  assert.ok(!convex.includes('HiDa'), 'unrelated roles are not listed');
  assert.match(formatWorkByTech('cobol'), /Nothing in his roles/);
  assert.match(formatWorkByTech('  '), /Give a technology/);
});

check('slash commands only run registered tools with valid targets', () => {
  const ids = SLASH_COMMANDS.map((command) => command.id);
  assert.equal(new Set(ids).size, ids.length, 'command ids must be unique');
  SLASH_COMMANDS.forEach((command) => {
    assert.ok(command.steps || command.prompt || command.local, `/${command.id} does nothing`);
    if (command.arg) assert.ok(command.prompt || command.steps, `/${command.id} takes an argument`);
    const steps = command.steps?.(command.arg ? 'convex' : '') ?? [];
    steps.forEach((step) => {
      assert.ok(toolByName(step.tool), `/${command.id} runs unknown tool ${step.tool}`);
      const target = (step.args.section ?? step.args.target) as string | undefined;
      if (target) assert.ok(isTargetId(target), `/${command.id} points at unknown target ${target}`);
    });
    if (command.prompt) assert.ok(command.prompt('convex').length > 10, `/${command.id} needs a prompt`);
  });
});

check('slash parsing and matching support arguments and prefixes', () => {
  assert.deepEqual(parseSlash('/filter convex'), { name: 'filter', arg: 'convex', hasSpace: true });
  assert.equal(parseSlash('hello'), null);
  assert.equal(matchCommands('/').length, SLASH_COMMANDS.length);
  assert.deepEqual(matchCommands('/proj').map((command) => command.id).slice(0, 1), ['projects']);
  assert.deepEqual(matchCommands('/filter convex').map((command) => command.id), ['filter']);
  assert.equal(matchCommands('/zzzz').length, 0);
});

await checkAsync('inline json-render separates evidence patches from streamed prose', async () => {
  const chunks = [
    { type: 'text-start' as const, id: 'answer' },
    { type: 'text-delta' as const, id: 'answer', delta: 'A sourced comparison.\n{"op":"add","path":"/root","value":"board"}\n' },
    { type: 'text-end' as const, id: 'answer' },
  ];
  const input = new ReadableStream({ start(controller) { chunks.forEach((chunk) => controller.enqueue(chunk)); controller.close(); } });
  const output = [];
  const reader = pipeJsonRender(input).getReader();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    output.push(value);
  }
  assert.equal(output.filter((part) => part.type === 'data-spec').length, 1);
  assert.equal(output.filter((part) => part.type === 'text-delta').map((part) => part.delta).join(''), 'A sourced comparison.\n');
});

check('registry exposes every required page tool', () => {
  const names = TOOLS.map((tool) => tool.name);
  REQUIRED_TOOLS.forEach((name) => assert.ok(names.includes(name), `registry is missing ${name}`));
});

check('every registry tool has a description, a schema and a run function', () => {
  TOOLS.forEach((tool) => {
    assert.ok(tool.description.length > 10, `${tool.name} needs a description`);
    assert.equal((tool.inputSchema as { type?: string }).type, 'object', `${tool.name} needs an object schema`);
    assert.equal(typeof tool.run, 'function', `${tool.name} needs a run function`);
  });
});

check('the model is told about every act tool the page can run', () => {
  const serverTools = buildPortfolioTools() as Record<string, unknown>;
  const actTools = TOOLS.filter((tool) => tool.kind === 'act').map((tool) => tool.name);
  actTools.forEach((name) => {
    assert.ok(name in serverTools, `server tools are missing ${name}`);
    assert.ok(toolByName(name), `${name} is not in the browser registry`);
  });
  assert.ok(Object.keys(serverTools).length >= 17, 'expected the lookups plus the page tools');
});

check('lookups are still offered to the model', () => {
  const serverTools = buildPortfolioTools() as Record<string, unknown>;
  ['lookupRole', 'lookupProject', 'lookupSkills', 'lookupProfile', 'lookupGitHub', 'browseGitHubCode', 'lookupGitHubIssues', 'lookupGitHubPullRequests', 'searchGitHub', 'findWorkByTech', 'listWorkstreams'].forEach((name) =>
    assert.ok(name in serverTools, `missing ${name}`),
  );
});

const runDictationChecks = async () => {
  await checkAsync('dictation only forwards bounded audio and returns text', async () => {
    const originalFetch = globalThis.fetch;
    let seenModel: FormDataEntryValue | null = null;
    let seenAuth: string | null = null;
    globalThis.fetch = (async (_url: string, options?: RequestInit) => {
      seenModel = (options?.body as FormData).get('model');
      seenAuth = new Headers(options?.headers).get('Authorization');
      return { ok: true, json: async () => ({ text: '  Show me ParkAlong  ' }) } as Response;
    }) as typeof fetch;
    try {
      const form = new FormData();
      form.set('file', new File([new Uint8Array([1, 2, 3])], 'speech.webm', { type: 'audio/webm' }));
      assert.equal(await transcribeAudio('test-secret', form), 'Show me ParkAlong');
      assert.equal(seenModel, 'gpt-transcribe');
      assert.equal(seenAuth, 'Bearer test-secret');
      const bad = new FormData();
      bad.set('file', new File(['no'], 'test.txt', { type: 'text/plain' }));
      await assert.rejects(transcribeAudio('test-secret', bad), TranscriptionError);
    } finally { globalThis.fetch = originalFetch; }
  });
};

check('page intents ignore unfinished calls, lookups and replays', () => {
  const messages = [
    {
      id: 'm1',
      role: 'assistant',
      parts: [
        { type: 'text', text: 'Here it is.' },
        { type: 'tool-navigate_to', state: 'output-available', input: { section: 'projects' } },
        { type: 'tool-lookupProject', state: 'output-available', input: { id: 'foodly' } },
        { type: 'tool-highlight', state: 'input-streaming', input: { target: 'project-foodly' } },
        { type: 'tool-get_state', state: 'output-available', input: {} },
      ],
    },
  ] as never;

  const fresh = pageIntentsFromMessages(messages, new Set());
  assert.deepEqual(
    fresh.map((intent) => [intent.name, intent.args]),
    [['navigate_to', { section: 'projects' }]],
  );
  assert.equal(pageIntentsFromMessages(messages, new Set(fresh.map((intent) => intent.id))).length, 0);
});

const runGithubChecks = async () => {
  const { ALLOWED_ACCOUNTS, getGithubPayload, isAllowedAccount, listPublicRepos } = await import('../lib/github');

  check('only allowlisted accounts pass', () => {
    ALLOWED_ACCOUNTS.forEach((account) => assert.ok(isAllowedAccount(account)));
    assert.ok(!isAllowedAccount('someone-else'));
  });

  await checkAsync('private, forked and archived repositories never reach the caller', async () => {
    const originalFetch = globalThis.fetch;
    const repo = (overrides: Record<string, unknown>) => ({
      name: 'repo',
      description: null,
      language: 'TypeScript',
      stargazers_count: 0,
      pushed_at: '2026-01-01T00:00:00Z',
      html_url: 'https://github.com/x/y',
      private: false,
      fork: false,
      archived: false,
      ...overrides,
    });

    let seenAuth: string | undefined;
    globalThis.fetch = (async (_url: string, init?: RequestInit) => {
      seenAuth = (init?.headers as Record<string, string> | undefined)?.Authorization;
      return {
        ok: true,
        json: async () => [
          repo({ name: 'public-work' }),
          repo({ name: 'secret', private: true }),
          repo({ name: 'a-fork', fork: true }),
          repo({ name: 'old', archived: true }),
        ],
      } as unknown as Response;
    }) as typeof fetch;

    try {
      const list = await listPublicRepos('RealSid08');
      assert.deepEqual(list.repos.map((item) => item.name), ['public-work']);
      assert.ok(list.fetchedAt, 'expected an as-of timestamp');
      assert.equal(seenAuth, undefined, 'no token configured, so no Authorization header');
      assert.ok(
        list.repos.every((item) => !('private' in item)),
        'public payloads must not carry private flags',
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await checkAsync('a configured token is sent, and never logged in the payload', async () => {
    const originalFetch = globalThis.fetch;
    const originalToken = process.env.GITHUB_TOKEN;
    process.env.GITHUB_TOKEN = 'test-token-value';
    let seenAuth: string | undefined;

    globalThis.fetch = (async (_url: string, init?: RequestInit) => {
      seenAuth = (init?.headers as Record<string, string> | undefined)?.Authorization;
      return { ok: true, json: async () => [] } as unknown as Response;
    }) as typeof fetch;

    try {
      const list = await listPublicRepos('OpenRenderKit');
      assert.equal(seenAuth, 'Bearer test-token-value');
      assert.ok(!JSON.stringify(list).includes('test-token-value'), 'the token must never reach the caller');
    } finally {
      globalThis.fetch = originalFetch;
      if (originalToken === undefined) delete process.env.GITHUB_TOKEN;
      else process.env.GITHUB_TOKEN = originalToken;
    }
  });

  await checkAsync('code, issues and PRs read bounded public data only', async () => {
    const originalFetch = globalThis.fetch;
    const calls: string[] = [];
    const response = (value: unknown) => ({ ok: true, status: 200, json: async () => value }) as Response;
    globalThis.fetch = (async (input: string) => {
      const url = String(input);
      calls.push(url);
      if (url.endsWith('/repos/RealSid08/verification-private')) return response({ private: true, fork: false, archived: false });
      if (url.endsWith('/repos/RealSid08/verification-public')) return response({
        name: 'verification-public', description: null, language: 'TypeScript', stargazers_count: 0,
        pushed_at: '2026-01-01T00:00:00Z', html_url: 'https://github.com/RealSid08/verification-public',
        private: false, fork: false, archived: false, default_branch: 'main',
      });
      if (url.endsWith('/languages')) return response({ TypeScript: 100 });
      if (url.endsWith('/contents/src/index.ts')) return response({ type: 'file', path: 'src/index.ts', size: 30, encoding: 'base64', content: btoa('export const answer = 42;'), html_url: 'https://github.com/RealSid08/verification-public/blob/main/src/index.ts' });
      if (url.includes('/issues?')) return response([{ number: 1, title: 'Bug', body: 'Fix this', state: 'open', updated_at: '2026-01-01', html_url: 'https://github.com/example/issues/1' }, { number: 2, title: 'PR', pull_request: {}, state: 'open' }]);
      if (url.endsWith('/pulls/2')) return response({ number: 2, title: 'Fix', body: 'Changed code', state: 'closed', updated_at: '2026-01-01', html_url: 'https://github.com/example/pull/2' });
      if (url.includes('/pulls/2/files')) return response([{ filename: 'src/index.ts', status: 'modified', additions: 1, deletions: 1, patch: '@@ -1 +1 @@' }]);
      throw new Error(`Unexpected request: ${url}`);
    }) as typeof fetch;
    try {
      await assert.rejects(getGithubPayload(new URLSearchParams({ account: 'someone-else', repo: 'verification-public', view: 'code' })), /Account not allowed/);
      await assert.rejects(getGithubPayload(new URLSearchParams({ account: 'RealSid08', repo: 'verification-public', view: 'code', path: '../secret' })), /Invalid code request/);
      const beforePrivate = calls.length;
      await assert.rejects(getGithubPayload(new URLSearchParams({ account: 'RealSid08', repo: 'verification-private', view: 'code' })), /Repository is not available/);
      assert.equal(calls.length, beforePrivate + 1, 'private repo must stop before fetching contents');
      const code = await getGithubPayload(new URLSearchParams({ account: 'RealSid08', repo: 'verification-public', view: 'code', path: 'src/index.ts' }));
      assert.match(JSON.stringify(code), /answer = 42/);
      const issues = await getGithubPayload(new URLSearchParams({ account: 'RealSid08', repo: 'verification-public', view: 'issues' }));
      assert.equal((issues as { issues: unknown[] }).issues.length, 1, 'PRs must not appear as issues');
      const pull = await getGithubPayload(new URLSearchParams({ account: 'RealSid08', repo: 'verification-public', view: 'pulls', number: '2' }));
      assert.match(JSON.stringify(pull), /src\/index.ts/);
    } finally { globalThis.fetch = originalFetch; }
  });
};

const runGithubSearchChecks = async () => {
  const { searchGithub } = await import('../lib/github');

  await checkAsync('GitHub search is pinned to public work by the allowlisted author', async () => {
    const originalFetch = globalThis.fetch;
    const originalToken = process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_TOKEN;
    const urls: string[] = [];
    globalThis.fetch = (async (input: string) => {
      urls.push(decodeURIComponent(String(input)));
      return { ok: true, status: 200, json: async () => ({ total_count: 1, items: [{
        number: 7, title: 'Fix parser', body: 'x'.repeat(900), state: 'closed', updated_at: '2026-01-01', html_url: 'https://github.com/other/lib/pull/7',
        repository_url: 'https://api.github.com/repos/other/lib', pull_request: { merged_at: '2026-01-02' },
      }] }) } as Response;
    }) as typeof fetch;
    try {
      const found = await searchGithub('pulls', 'parser author:someone-else repo:private/thing user:x', 'closed') as unknown as { results: Array<{ repo: string; state: string; body: string }> };
      const query = urls[0];
      assert.match(query, /author:RealSid08/);
      assert.match(query, /is:public/);
      assert.match(query, /is:pr/);
      assert.match(query, /is:closed/);
      assert.ok(!/someone-else|private\/thing|user:x/.test(query), `caller qualifiers must be stripped: ${query}`);
      assert.deepEqual([found.results[0].repo, found.results[0].state], ['other/lib', 'merged']);
      assert.ok(found.results[0].body.length < 400, 'bodies are excerpted');
      await assert.rejects(searchGithub('code', ''), /needs search terms/);
      await assert.rejects(searchGithub('code', 'useState'), /unavailable/, 'code search needs a token');
      await assert.rejects(searchGithub('nope' as never, 'x'), /Invalid search kind/);
    } finally {
      globalThis.fetch = originalFetch;
      if (originalToken !== undefined) process.env.GITHUB_TOKEN = originalToken;
    }
  });

  await checkAsync('code search covers only the two accounts and drops private or forked hits', async () => {
    const originalFetch = globalThis.fetch;
    const originalToken = process.env.GITHUB_TOKEN;
    process.env.GITHUB_TOKEN = 'test-token-value';
    const urls: string[] = [];
    const hit = (full: string, extra: Record<string, unknown> = {}) => ({ name: 'a.ts', path: 'src/a.ts', html_url: `https://github.com/${full}/blob/main/src/a.ts`, repository: { full_name: full, private: false, fork: false, ...extra } });
    globalThis.fetch = (async (input: string) => {
      const url = decodeURIComponent(String(input));
      urls.push(url);
      return { ok: true, status: 200, json: async () => ({ items: [hit(url.includes('user:RealSid08') ? 'RealSid08/site' : 'OpenRenderKit/kit'), hit('RealSid08/secret', { private: true }), hit('RealSid08/forked', { fork: true })] }) } as Response;
    }) as typeof fetch;
    try {
      const found = await searchGithub('code', 'router org:evil') as unknown as { results: Array<{ repo: string }> };
      assert.equal(urls.length, 2);
      assert.ok(urls.some((url) => url.includes('user:RealSid08')) && urls.some((url) => url.includes('user:OpenRenderKit')));
      assert.ok(urls.every((url) => !url.includes('org:evil')));
      assert.deepEqual(found.results.map((item) => item.repo).sort(), ['OpenRenderKit/kit', 'RealSid08/site']);
    } finally {
      globalThis.fetch = originalFetch;
      if (originalToken === undefined) delete process.env.GITHUB_TOKEN;
      else process.env.GITHUB_TOKEN = originalToken;
    }
  });
};

const runWebMcpChecks = async () => {
  const { registerAgentTools } = await import('../services/agent/webmcp');

  check('when the browser has WebMCP, every registry tool is registered natively', async () => {
    const registered: string[] = [];
    const signals: AbortSignal[] = [];

    (globalThis as unknown as { document?: unknown }).document = {
      modelContext: {
        registerTool: async (descriptor: { name: string }, options?: { signal?: AbortSignal }) => {
          registered.push(descriptor.name);
          if (options?.signal) signals.push(options.signal);
        },
      },
    };

    try {
      const result = await registerAgentTools();
      assert.equal(result.usedPolyfill, false, 'should not need the polyfill when the API exists');
      assert.equal(result.registered, TOOLS.length);
      assert.deepEqual(registered.slice().sort(), TOOLS.map((tool) => tool.name).sort());

      result.unregister();
      assert.ok(signals.length === TOOLS.length, 'each registration gets its own signal');
      assert.ok(
        signals.every((signal) => signal.aborted),
        'unregistering aborts every registration',
      );
    } finally {
      delete (globalThis as unknown as { document?: unknown }).document;
    }
  });

  check('external agents are rate limited', async () => {
    const descriptors: Array<{ name: string; execute: (args?: Record<string, unknown>) => Promise<unknown> }> = [];

    (globalThis as unknown as { document?: unknown }).document = {
      modelContext: {
        registerTool: async (descriptor: { name: string; execute: (args?: Record<string, unknown>) => Promise<unknown> }) => {
          descriptors.push(descriptor);
        },
      },
    };

    try {
      await registerAgentTools();
      const tool = descriptors.find((descriptor) => descriptor.name === 'get_state');
      assert.ok(tool, 'expected get_state to be registered');

      for (let call = 0; call < 30; call += 1) {
        await tool!.execute({});
      }
      const overflow = await tool!.execute({});
      assert.equal(
        overflow,
        'Too many page actions in a short window. Wait a moment and try again.',
        'the 31st call inside a minute should be refused',
      );
    } finally {
      delete (globalThis as unknown as { document?: unknown }).document;
    }
  });
};

const runStreamChecks = async () => {
  type ServerTool = { execute?: (input: unknown, options: unknown) => Promise<unknown> };
  const serverTools = buildPortfolioTools() as unknown as Record<string, ServerTool>;

  await checkAsync('the server page tool answers the model when it is called', async () => {
    const output = await serverTools.navigate_to?.execute?.(
      { section: 'projects' },
      { toolCallId: 'call-1', messages: [] },
    );
    assert.equal(output, 'Queued on the page.');
  });

  await checkAsync('a streamed tool call becomes a page intent the bar can run', async () => {
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        writer.write({ type: 'start' });
        writer.write({ type: 'text-start', id: 'text-1' });
        writer.write({ type: 'text-delta', id: 'text-1', delta: 'Here it is.' });
        writer.write({ type: 'text-end', id: 'text-1' });
        writer.write({
          type: 'tool-input-available',
          toolCallId: 'call-1',
          toolName: 'navigate_to',
          input: { section: 'projects' },
        });
        writer.write({ type: 'tool-output-available', toolCallId: 'call-1', output: 'Queued on the page.' });
        writer.write({ type: 'finish' });
      },
    });

    // The client keeps the newest snapshot of each streamed message.
    const latest = new Map<string, UIMessage>();
    for await (const message of readUIMessageStream({ stream })) {
      latest.set(message.id, message);
    }
    const messages = [...latest.values()];

    const partTypes = messages.flatMap((message) => (message.parts ?? []).map((part) => part.type));
    assert.ok(
      partTypes.includes('tool-navigate_to'),
      `expected a tool-navigate_to part, saw ${partTypes.join(', ')}`,
    );

    const intents = pageIntentsFromMessages(messages, new Set());
    assert.deepEqual(
      intents.map((intent) => [intent.name, intent.args]),
      [['navigate_to', { section: 'projects' }]],
    );
  });
};

Promise.resolve()
  .then(runGithubChecks)
  .then(runGithubSearchChecks)
  .then(runWebMcpChecks)
  .then(runDictationChecks)
  .then(runStreamChecks)
  .then(() => {
    console.log(results.join('\n'));
    console.log('\nagent verification passed');
  })
  .catch((error) => {
    console.error(results.join('\n'));
    console.error('\nagent verification failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
