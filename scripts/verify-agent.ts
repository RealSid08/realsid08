/**
 * Checks the seams that are hard to see in a browser: that the server tells the
 * model about the same page tools the page can actually run, and that the
 * GitHub context only ever returns public, allowlisted work.
 *
 * Run with: npm run verify:agent
 */
import assert from 'node:assert/strict';
import { buildPortfolioTools } from '../lib/portfolioChat';
import { pageIntentsFromMessages } from '../services/agent/pageIntent';
import { paletteEntries, TOOLS, toolByName } from '../services/agent/registry';

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
  assert.ok(Object.keys(serverTools).length >= 16, 'expected the lookups plus the page tools');
});

check('lookups are still offered to the model', () => {
  const serverTools = buildPortfolioTools() as Record<string, unknown>;
  ['lookupRole', 'lookupProject', 'lookupSkills', 'lookupProfile', 'lookupGitHub', 'listWorkstreams'].forEach((name) =>
    assert.ok(name in serverTools, `missing ${name}`),
  );
});

check('the palette only offers real registry tools', () => {
  assert.ok(paletteEntries.length >= 6, 'expected several palette actions');
  paletteEntries.forEach((entry) => assert.ok(toolByName(entry.name), `${entry.name} is not registered`));
});

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
  const { ALLOWED_ACCOUNTS, isAllowedAccount, listPublicRepos } = await import('../lib/github');

  check('only allowlisted accounts pass', () => {
    ALLOWED_ACCOUNTS.forEach((account) => assert.ok(isAllowedAccount(account)));
    assert.ok(!isAllowedAccount('someone-else'));
  });

  check('private, forked and archived repositories never reach the caller', async () => {
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
};

Promise.resolve()
  .then(runGithubChecks)
  .then(runWebMcpChecks)
  .then(() => {
    console.log(results.join('\n'));
    console.log('\nagent verification passed');
  })
  .catch((error) => {
    console.error(results.join('\n'));
    console.error('\nagent verification failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
