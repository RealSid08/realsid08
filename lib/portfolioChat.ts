import { createOpenAI } from '@ai-sdk/openai';
import { experimental_codeModeTool as codeModeTool } from '@ai-sdk/code-mode';
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  isStepCount,
  pipeUIMessageStreamToResponse,
  smoothStream,
  streamText,
  tool,
  toolSearch,
  type UIMessage,
} from 'ai';
import type { ServerResponse } from 'http';
import { z } from 'zod';
import { pipeJsonRender } from '@json-render/core';
import { PROFILE } from '../constants.js';
import { formatProfile, formatProject, formatRole, formatSkills, formatWorkByTech, formatWorkIndex } from '../services/localKnowledge.js';
import { CHAT_MODEL_ID } from './chatModel.js';
import { uiSpecPrompt } from './portfolioUiCatalog.js';
import { CARD_IDS, SECTION_IDS, TARGET_IDS } from './portfolioIds.js';
import { formatRepoForModel, formatReposForModel, getGithubPayload, getPublicRepo, isAllowedAccount, listPublicRepos, searchGithub } from './github.js';

const PROFILE_LINKS = [
  `Résumé (PDF): ${PROFILE.resumeUrl}`,
  `GitHub: ${PROFILE.github}`,
  'GitHub organisation for his open source: https://github.com/OpenRenderKit',
  `LinkedIn: ${PROFILE.linkedin}`,
  `Email: mailto:${PROFILE.email}`,
].join('\n');

const CHAT_SYSTEM = `You are the assistant inside Sidhaarth Krishnan's portfolio, a notebook visitors flip through on his site.
The people asking are mostly recruiters, hiring managers and engineers deciding whether he is worth a conversation.

Who he is, so the answers carry the right picture: he solves problems for companies and for his own life by building
software, he is genuinely passionate about building things that matter, and he cares most that what he builds gets used.
He is a strong software engineer who uses coding agents heavily to move faster. He is not an "AI tools" person; never
describe him that way.

How to answer
- Answer the question in your first sentence, then back it with specific evidence: what he built, the hard part, a number.
- 40 to 120 words unless the visitor asks for depth. Plain prose; a short list only for three or more parallel items.
- Sound like a sharp colleague who knows his work: warm, direct, concrete. No hype words, no filler, no emojis,
  no "Great question", no recap of the question. Do not end with a question or an offer of more help.
- Call him Sidhaarth or "he". Never use em dashes; use commas, colons or full stops.
- Be candid. If asked about weaknesses or risks, give a real answer from the facts: he is early in his career and has
  worked mostly in small teams and on contracts; the research is a pilot with small samples. Say plainly what the
  portfolio does not show rather than guessing.
- Never state or discuss visa or work-rights status; say he can be reached by email for that.
- You only discuss Sidhaarth and his work. For anything else (weather, news, general coding help, other people), say in
  one short sentence that you are here for his work, and do not search for it.

Getting facts
- State only facts you have read from a tool in this conversation. Never invent metrics, dates, employers, links or opinions.
- Look things up with the \`code\` tool: write a short program that calls \`tools.*\`, runs independent calls together
  with Promise.all, and returns only the parts you need. The latest "Code mode capability update" message lists the
  tools available right now.
- tools.listWork, tools.lookupRole, tools.lookupProject and tools.findWorkByTech are always there; call several in one
  program when you need them. Everything else (his skills, profile and contact details, public GitHub repos, code,
  issues and pull requests) loads on demand: call tools.search({ query }) inside code, then use what it found in your
  next code call.
- Current work comes first: Kenspire and Besmak (client platforms in production), then his own projects Foodly,
  Switchyard, ParkAlong and ServoGrid, then the research pilot and smaller tools.
- GitHub covers the public RealSid08 and OpenRenderKit accounts only; mention the "as of" time and never imply private access.
- web_search is only for context about his work that the portfolio lacks (a company he worked for, a library he used).
  Link exactly the URL it returns, and never claim he wrote something a search merely mentions.
- Contact questions: give his email address as the link text, mention LinkedIn or the résumé if useful, and turn_to contact.

Showing things in the notebook
- The notebook moves with the conversation, which is the best part of this site. When your answer centres on one role,
  project or section, call turn_to with its page id and circle: true. Page ids appear in lookup results as "page id ...".
- Never narrate page moves in your answer ("I've turned to...", "I've opened..."); the panel already shows them.
- For "where has he used X", call findWorkByTech, then mark_work with X. mark_work turns to the contents page and ticks
  every entry itself, so do not also call turn_to.
- Use tour, focus, set_theme and reset_view only when the visitor asks. At most two page actions per answer.

Links (the panel renders these as rich, clickable references)
- Link a role or project on its first mention to its page id, e.g. [Foodly](#project-foodly), [Besmak](#exp-besmak).
  Sections: ${SECTION_IDS.map((id) => `#${id}`).join(', ')}. Clicking turns the notebook there; hovering highlights it.
- His profiles, which you can link without a lookup:
${PROFILE_LINKS}
  Link these when they are the visitor's next step (email or résumé for hiring, GitHub for code), not by habit.
- Link text is always the thing's name, never "here" or a bare URL. Never invent a URL or a page id.
- Never write citation markers or source tags in the text; links are the citations.
  Page ids: ${CARD_IDS.join(', ')}.

Rich answers
Below the prose you can add UI components when they carry the answer better than text; keep the prose to one to three
sentences when you do. One or two roles or projects: a WorkCard each. Comparing two or three: Compare. A career
overview: Timeline, newest first. Public repositories: RepoList. A useful next step in the notebook: one or two
PageButtons. Simple factual answers (contact, location, availability) stay as text. Every value must come from a tool result.

${uiSpecPrompt()}
- Write the prose answer first, then the spec block. Never repeat the prose inside components.
- Use EvidenceBoard only for public issues and pull requests.`;

/**
 * Page tools run in the browser. The server acknowledges the call and the agent
 * bar turns the notebook; the same names are in services/agent/registry.ts.
 */
const pageTool = <Shape extends z.ZodRawShape>(description: string, shape: Shape) =>
  tool({
    description: `${description} This moves the notebook the visitor is looking at.`,
    inputSchema: z.object(shape),
    execute: async () => 'Done on the page.',
  });

const githubCall = async (run: () => Promise<unknown>, label: string) => {
  try {
    return await run();
  } catch (error) {
    return `${label} failed: ${error instanceof Error ? error.message : 'unknown error'}`;
  }
};

const account = z.enum(['RealSid08', 'OpenRenderKit']).default('RealSid08');

/** Lookups the model reaches through code mode. Deferred ones load only when a search finds them. */
export function buildLookupTools() {
  return {
    listWork: tool({
      description: 'Index of every role and project, newest first, with ids for the other lookups and notebook page ids.',
      inputSchema: z.object({}),
      execute: async () => formatWorkIndex(),
    }),
    lookupRole: tool({
      description: 'Everything about one role: what he built, numbers, stack. Use an id from listWork, e.g. besmak.',
      inputSchema: z.object({ id: z.string() }),
      execute: async ({ id }) => formatRole(id) ?? 'No such role. Call listWork for ids.',
    }),
    lookupProject: tool({
      description: 'Everything about one project: the problem, what he built, numbers, stack, repo. Use an id from listWork, e.g. parkalong.',
      inputSchema: z.object({ id: z.string() }),
      execute: async ({ id }) => formatProject(id) ?? 'No such project. Call listWork for ids.',
    }),
    findWorkByTech: tool({
      description: 'Every role and project that uses or mentions a technology (e.g. Convex, SwiftUI, Rust), with page ids.',
      inputSchema: z.object({ tech: z.string().min(1).max(60) }),
      execute: async ({ tech }) => formatWorkByTech(tech),
    }),
    lookupSkills: tool({
      deferLoading: true,
      description: 'His skills by area: languages, web and mobile, backend and data, AI and coding agents, cloud, testing.',
      inputSchema: z.object({ cluster: z.string().optional() }),
      execute: async ({ cluster }) => formatSkills(cluster),
    }),
    lookupProfile: tool({
      deferLoading: true,
      description: 'His location, availability, education, High Distinctions and contact details.',
      inputSchema: z.object({}),
      execute: async () => formatProfile(),
    }),
    lookupGitHub: tool({
      deferLoading: true,
      description: 'Public GitHub repositories for RealSid08 or OpenRenderKit, or one repository with its languages, with a fetched-at time.',
      inputSchema: z.object({ account, repo: z.string().optional().describe('A repository name for a single repo') }),
      execute: async ({ account: owner, repo }) => {
        if (!isAllowedAccount(owner)) return 'Only his public GitHub accounts are available.';
        return githubCall(async () => (repo ? formatRepoForModel(await getPublicRepo(owner, repo)) : formatReposForModel(await listPublicRepos(owner))), 'GitHub lookup');
      },
    }),
    browseGitHubCode: tool({
      deferLoading: true,
      description: 'List a public repository directory or read a text file (README, source code).',
      inputSchema: z.object({ account, repo: z.string(), path: z.string().optional().describe('File or directory; omit for the root') }),
      execute: async ({ account: owner, repo, path }) =>
        githubCall(() => getGithubPayload(new URLSearchParams({ account: owner, repo, view: 'code', ...(path ? { path } : {}) })), 'GitHub code lookup'),
    }),
    lookupGitHubIssues: tool({
      deferLoading: true,
      description: 'Recent public issues in one of his repositories, or one issue with its first comments.',
      inputSchema: z.object({ account, repo: z.string(), number: z.number().int().positive().optional(), state: z.enum(['open', 'closed', 'all']).default('all') }),
      execute: async ({ account: owner, repo, number, state }) =>
        githubCall(() => getGithubPayload(new URLSearchParams({ account: owner, repo, view: 'issues', state, ...(number ? { number: String(number) } : {}) })), 'GitHub issue lookup'),
    }),
    lookupGitHubPullRequests: tool({
      deferLoading: true,
      description: 'Recent public pull requests in one of his repositories, or one pull request with its changed files.',
      inputSchema: z.object({ account, repo: z.string(), number: z.number().int().positive().optional(), state: z.enum(['open', 'closed', 'all']).default('all') }),
      execute: async ({ account: owner, repo, number, state }) =>
        githubCall(() => getGithubPayload(new URLSearchParams({ account: owner, repo, view: 'pulls', state, ...(number ? { number: String(number) } : {}) })), 'GitHub pull request lookup'),
    }),
    searchGitHub: tool({
      deferLoading: true,
      description: 'Search GitHub: "pulls" and "issues" find his public pull requests and issues on any repository, including other people’s open source; "code" searches inside his public repositories.',
      inputSchema: z.object({ kind: z.enum(['pulls', 'issues', 'code']), query: z.string().max(100).default(''), state: z.enum(['open', 'closed', 'all']).default('all') }),
      execute: async ({ kind, query, state }) => githubCall(() => searchGithub(kind, query, state), 'GitHub search'),
    }),
  };
}

/** Page tools the model calls directly, so the browser sees them and moves the notebook. */
export function buildPageTools() {
  return {
    turn_to: pageTool('Turn the notebook to a section, role or project; set circle to ring its title in pen.', {
      target: z.enum(TARGET_IDS).describe('Page id, e.g. project-foodly, exp-besmak or contact'),
      circle: z.boolean().optional(),
    }),
    mark_work: pageTool('Turn to the contents and tick every entry whose work uses a technology or matches a phrase.', {
      query: z.string().min(1).max(60),
    }),
    focus: pageTool('Dim everything on the open pages except one entry.', {
      target: z.enum(TARGET_IDS).optional(),
    }),
    tour: pageTool('Step through the work one entry at a time.', {
      action: z.enum(['start', 'next', 'prev', 'stop']),
    }),
    set_theme: pageTool('Turn the desk lamp on (light) or off (dark).', {
      theme: z.enum(['light', 'dark']),
    }),
    reset_view: pageTool('Undo every page change the assistant made.', {}),
  };
}

/** Every tool the model can reach, and who may call it. Exported so scripts/verify-agent.ts can check the wiring. */
export function buildPortfolioTools() {
  const lookups = buildLookupTools();
  return {
    tools: {
      code: codeModeTool({
        toolDiscovery: 'conversation',
        executionPolicy: { timeoutMs: 25_000, maxBridgeRequests: 24, maxInFlightBridgeRequests: 8, maxResultBytes: 200_000 },
      }),
      search: toolSearch({ maxResults: 4 }),
      ...lookups,
      ...buildPageTools(),
    },
    // Lookups and search run only inside code; page tools stay direct so the browser sees them.
    callers: Object.fromEntries([...Object.keys(lookups), 'search'].map((name) => [name, ['code'] as const])) as Record<string, readonly ['code']>,
  };
}

function createPortfolioChatStream(options: { apiKey: string; messages: UIMessage[] }) {
  const openai = createOpenAI({ apiKey: options.apiKey });
  const { tools, callers } = buildPortfolioTools();
  return (async () =>
    streamText({
      model: openai(CHAT_MODEL_ID),
      system: CHAT_SYSTEM,
      messages: await convertToModelMessages(options.messages),
      stopWhen: isStepCount(8),
      experimental_transform: smoothStream({ chunking: 'word', delayInMs: 12 }),
      providerOptions: { openai: { reasoningEffort: 'low' } },
      onError: ({ error }) => {
        console.error('Portfolio chat stream error:', error instanceof Error ? error.message : 'unknown');
      },
      tools: {
        ...tools,
        // Provider-executed: OpenAI runs the search and returns cited pages.
        web_search: openai.tools.webSearch({ searchContextSize: 'low' }),
      },
      experimental_toolCallers: callers as never,
    }))();
}

export async function streamPortfolioChat(options: { apiKey: string; messages: UIMessage[]; response: ServerResponse }): Promise<void> {
  const result = await createPortfolioChatStream(options);
  const stream = createUIMessageStream({
    execute: ({ writer }) => writer.merge(pipeJsonRender(result.toUIMessageStream())),
  });
  pipeUIMessageStreamToResponse({ response: options.response, stream });
}

export async function createPortfolioChatResponse(options: { apiKey: string; messages: UIMessage[] }): Promise<Response> {
  const result = await createPortfolioChatStream(options);
  const stream = createUIMessageStream({
    execute: ({ writer }) => writer.merge(pipeJsonRender(result.toUIMessageStream())),
  });
  return createUIMessageStreamResponse({ stream });
}

export function isUiMessageArray(value: unknown): value is UIMessage[] {
  return Array.isArray(value);
}
