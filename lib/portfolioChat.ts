import { createOpenAI } from '@ai-sdk/openai';
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  convertToModelMessages,
  pipeUIMessageStreamToResponse,
  smoothStream,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from 'ai';
import type { ServerResponse } from 'http';
import { z } from 'zod';
import { pipeJsonRender } from '@json-render/core';
import { EXPERIENCES, PROFILE, PROJECTS } from '../constants';
import { formatProfile, formatProject, formatRole, formatSkills, formatWorkByTech, formatWorkstreams } from '../services/localKnowledge';
import { CHAT_MODEL_ID } from './chatModel';
import { uiSpecPrompt } from './portfolioUiCatalog';
import { CARD_IDS, SECTION_IDS, TARGET_IDS } from './portfolioIds';
import { formatRepoForModel, formatReposForModel, getGithubPayload, getPublicRepo, isAllowedAccount, listPublicRepos, searchGithub } from './github';

// Derived from the page data so a new role or project is lookup-able without touching the tools.
const ROLE_IDS = EXPERIENCES.map((exp) => exp.id) as [string, ...string[]];
const PROJECT_IDS = PROJECTS.map((project) => project.id) as [string, ...string[]];

/**
 * Page-control tools run in the browser, not on the server. The server tool
 * acknowledges the intent and the agent bar executes it against the page
 * registry, which is also what the command palette and WebMCP call.
 */
const pageTool = <Shape extends z.ZodRawShape>(description: string, shape: Shape) =>
  tool({
    description: `${description} This drives the page the visitor is looking at.`,
    inputSchema: z.object(shape),
    execute: async () => 'Queued on the page.',
  });


const PROFILE_LINKS = [
  `Résumé (PDF): ${PROFILE.resumeUrl}`,
  `GitHub: ${PROFILE.github}`,
  'GitHub organisation for his open source: https://github.com/OpenRenderKit',
  `LinkedIn: ${PROFILE.linkedin}`,
  `Email: mailto:${PROFILE.email}`,
].join('\n');

const CHAT_SYSTEM = `You are the assistant on Sidhaarth Krishnan's portfolio site. Visitors are mostly recruiters,
hiring managers and engineers deciding whether he is worth talking to. You sit in a small panel over the page and can
operate the page itself.

Voice:
- Talk like a sharp engineer who knows his work well, not like a resume summariser. Direct, specific, warm, no hype.
- Answer the actual question in the first sentence. No preambles ("Based on...", "Great question"), no recap of the question.
- Refer to him as Sidhaarth or "he".
- Default to 40-120 words of prose. Short paragraphs; use a list only for 3+ genuinely parallel items, max 4 bullets,
  one line each, no nested bullets, no headings.
- Prefer concrete evidence (a number, a system he built, a hard problem he solved) over adjectives.
- Be candid. If asked about weaknesses, gaps or risks, give a real answer grounded in the facts (e.g. he is graduating in
  December 2026 so his experience is early-career, mostly small teams and contracts). Say what the portfolio does not show
  rather than inventing. Never be defensive or salesy.
- No emojis. Do not end with a question or an offer of more help.

Facts:
- Call lookup tools before stating facts. Never invent metrics, dates, employers, links or opinions attributed to others.
- Current work first (Kenspire, Besmak, Complete Leader), then Foodly and ParkAlong. Mindtek ended in October 2025; UniEats,
  Idhayam, HiDa and Imaginet are earlier roles. His open source is Codex Shared Memory and pptx-react-renderer.
- Availability and location come from lookupProfile. Never state or discuss visa or work-rights status; if asked, say he can be
  reached by email for that.
- Public GitHub comes from lookupGitHub, browseGitHubCode, lookupGitHubIssues and lookupGitHubPullRequests: RealSid08 and
  OpenRenderKit public repos only. Mention the "as of" time from the tool result; never imply private access.
- Finding things: searchGitHub finds his public pull requests and issues on any repository (contributions to other
  projects) and searches code inside his two accounts. web_search finds current public pages: docs, articles, a
  company, a library he used, news. Use them when the visitor asks for something the portfolio data does not hold, or
  asks you to find, show or link something. Prefer the portfolio tools first; search only for what they lack. Search
  results are the only source for outside URLs: link exactly the URL a result returned, say what the page is in a few
  words, and if nothing relevant comes back say so instead of guessing. Never state that he wrote or contributed to
  something a search merely mentioned; it must be authored by his account.
- Off-topic requests: one short line steering back to his work.

References (the panel turns these into rich, clickable links, so write them exactly like this):
- Work on this page: link the name to its card id, e.g. [Foodly](#project-foodly), [Besmak Components](#exp-besmak),
  [his projects](#projects). Clicking scrolls the page to it and hovering outlines it. Link a role or project on its
  first mention in an answer; do not link the same thing twice.
- His profiles, which you can link without a lookup:
${PROFILE_LINKS}
  Link these when they help the visitor's next step, not by habit: the résumé or email when they ask about hiring,
  contact or availability; GitHub when they ask about code; LinkedIn for background or references.
- GitHub: link the exact repository, file, issue or pull request URL from a tool result, e.g.
  [OpenRenderKit/ParkAlong](https://github.com/OpenRenderKit/ParkAlong). For files, link the blob URL with the file path
  as the text.
- Link text is always the thing's name, never "here", "link" or a bare URL. Each reference stands alone.
- Never invent a URL or a card id. Card ids: ${CARD_IDS.join(', ')}. Section ids: ${SECTION_IDS.join(', ')}.

Operating the page. You control the page the visitor is looking at, and moving it is the best part of this site:
- When your answer centres on one role or project, show it: navigate_to its card id and highlight it. For Foodly and
  ParkAlong also expand_card to open the screenshots.
- When the visitor asks to filter, sort, see only X, hide something, change theme or take a tour, do it with the page
  tool and say what you did in one short clause.
- For "where has he used <tech>" questions, call findWorkByTech once, filter_work by that tech, and name every role and
  project it returns, linking each on first mention. Do not read the roles one by one; the lookup already lists them all
  with their stacks. Read a single role or project only if the visitor asks what he did with the tech there.
- At most three page actions per turn. Do not start a walkthrough unless asked. Every action is undoable by the visitor;
  if they ask to undo or reset, call reset_view.

Rich answers. Beneath the prose you can stream UI components (spec below). Use them whenever they carry the answer
better than prose, and keep the prose to one to three sentences when you do:
- One or two specific roles or projects: a WorkCard each (with a MetricRow of sourced numbers when there are any).
- Comparing two or three things: Compare, with each column's target set to its card id.
- Career overview or "what has he done": Timeline, newest first, with targets.
- Public GitHub repositories: RepoList with the as-of time.
- When a follow-up action on the page would help, add one or two PageButtons (show a card, filter by a tech, start a tour).
- Simple factual answers (availability, location, contact) stay text only.
- Every value in a component must come from a tool result. Never put page actions you already ran in a PageButton.

${uiSpecPrompt()}
- Write the prose answer first, then the spec block. Never repeat the prose inside components.
- Use EvidenceBoard only for public issues and pull requests.`;

async function createPortfolioChatStream(options: {
  apiKey: string;
  messages: UIMessage[];
}) {
  const openai = createOpenAI({ apiKey: options.apiKey });

  return streamText({
    model: openai(CHAT_MODEL_ID),
    system: CHAT_SYSTEM,
    messages: await convertToModelMessages(options.messages),
    stopWhen: stepCountIs(8),
    experimental_transform: smoothStream({ chunking: 'word', delayInMs: 12 }),
    providerOptions: {
      openai: {
        reasoningEffort: 'low',
      },
    },
    onError: ({ error }) => {
      console.error('Portfolio chat stream error:', error instanceof Error ? error.message : 'unknown');
    },
    tools: {
      ...buildPortfolioTools(),
      // Provider-executed: OpenAI runs the search and returns cited pages.
      web_search: openai.tools.webSearch({ searchContextSize: 'low' }),
    },
  });
}

export async function streamPortfolioChat(options: {
  apiKey: string;
  messages: UIMessage[];
  response: ServerResponse;
}): Promise<void> {
  const result = await createPortfolioChatStream(options);
  const stream = createUIMessageStream({
    execute: ({ writer }) => writer.merge(pipeJsonRender(result.toUIMessageStream())),
  });
  pipeUIMessageStreamToResponse({
    response: options.response,
    stream,
  });
}

export async function createPortfolioChatResponse(options: {
  apiKey: string;
  messages: UIMessage[];
}): Promise<Response> {
  const result = await createPortfolioChatStream(options);
  const stream = createUIMessageStream({
    execute: ({ writer }) => writer.merge(pipeJsonRender(result.toUIMessageStream())),
  });
  return createUIMessageStreamResponse({ stream });
}

/**
 * The tool surface handed to the model. Exported so the page-tool names can be
 * checked against the browser registry (see scripts/verify-agent.ts).
 */
export function buildPortfolioTools() {
  return {
      lookupRole: tool({
        description: 'Fetch a specific employer/role from Sidhaarth\'s resume.',
        inputSchema: z.object({
          id: z.enum(ROLE_IDS).describe('Role id, e.g. besmak, kenspire, foodly is a project not a role'),
        }),
        execute: async ({ id }) => formatRole(id) ?? 'Role not found.',
      }),
      lookupProject: tool({
        description: 'Fetch a project or open-source package: Foodly, ParkAlong, TBRGS, RAG, Aura, Codex Shared Memory or pptx-react-renderer.',
        inputSchema: z.object({
          id: z.enum(PROJECT_IDS),
        }),
        execute: async ({ id }) => formatProject(id) ?? 'Project not found.',
      }),
      lookupSkills: tool({
        description: 'Fetch skill clusters (languages, frontend, backend, agentic, cloud, testing).',
        inputSchema: z.object({
          cluster: z.string().optional().describe('Optional cluster name or id'),
        }),
        execute: async ({ cluster }) => formatSkills(cluster),
      }),
      lookupProfile: tool({
        description: 'Fetch location, availability, education, and contact links.',
        inputSchema: z.object({}),
        execute: async () => formatProfile(),
      }),
      lookupGitHub: tool({
        description:
          'Fetch public GitHub work for Sidhaarth: an account overview (RealSid08 or OpenRenderKit) or one repository. Private repositories are never included.',
        inputSchema: z.object({
          account: z.enum(['RealSid08', 'OpenRenderKit']).optional(),
          repo: z.string().optional().describe('Repository name for a single repo lookup'),
        }),
        execute: async ({ account, repo }) => {
          const target = account ?? 'RealSid08';
          if (!isAllowedAccount(target)) return 'Only public GitHub accounts are available.';
          try {
            if (repo) return formatRepoForModel(await getPublicRepo(target, repo));
            return formatReposForModel(await listPublicRepos(target));
          } catch (error) {
            return `GitHub lookup failed: ${error instanceof Error ? error.message : 'unknown error'}`;
          }
        },
      }),
      browseGitHubCode: tool({
        description: 'Browse a public repository directory or read a text file, including README and source code. Only RealSid08 and OpenRenderKit public work.',
        inputSchema: z.object({ account: z.enum(['RealSid08', 'OpenRenderKit']).default('RealSid08'), repo: z.string(), path: z.string().optional().describe('File or directory path. Omit for repository root.') }),
        execute: async ({ account, repo, path }) => {
          try { return JSON.stringify(await getGithubPayload(new URLSearchParams({ account, repo, view: 'code', ...(path ? { path } : {}) }))); }
          catch (error) { return `GitHub code lookup failed: ${error instanceof Error ? error.message : 'unknown error'}`; }
        },
      }),
      lookupGitHubIssues: tool({
        description: 'List recent public GitHub issues or inspect one issue and its first comments.',
        inputSchema: z.object({ account: z.enum(['RealSid08', 'OpenRenderKit']).default('RealSid08'), repo: z.string(), number: z.number().int().positive().optional(), state: z.enum(['open', 'closed', 'all']).default('all') }),
        execute: async ({ account, repo, number, state }) => {
          try { return JSON.stringify(await getGithubPayload(new URLSearchParams({ account, repo, view: 'issues', state, ...(number ? { number: String(number) } : {}) }))); }
          catch (error) { return `GitHub issue lookup failed: ${error instanceof Error ? error.message : 'unknown error'}`; }
        },
      }),
      lookupGitHubPullRequests: tool({
        description: 'List recent public GitHub pull requests or inspect one PR summary and changed file patches.',
        inputSchema: z.object({ account: z.enum(['RealSid08', 'OpenRenderKit']).default('RealSid08'), repo: z.string(), number: z.number().int().positive().optional(), state: z.enum(['open', 'closed', 'all']).default('all') }),
        execute: async ({ account, repo, number, state }) => {
          try { return JSON.stringify(await getGithubPayload(new URLSearchParams({ account, repo, view: 'pulls', state, ...(number ? { number: String(number) } : {}) }))); }
          catch (error) { return `GitHub PR lookup failed: ${error instanceof Error ? error.message : 'unknown error'}`; }
        },
      }),
      searchGitHub: tool({
        description: 'Search GitHub. "pulls" and "issues" find public pull requests and issues Sidhaarth authored on ANY repository, including other people\'s open source. "code" searches source inside RealSid08 and OpenRenderKit public repositories. Free text only; the account scope is fixed.',
        inputSchema: z.object({
          kind: z.enum(['pulls', 'issues', 'code']),
          query: z.string().max(100).default('').describe('Words to look for. Optional for pulls and issues, required for code.'),
          state: z.enum(['open', 'closed', 'all']).default('all').describe('Pulls and issues only'),
        }),
        execute: async ({ kind, query, state }) => {
          try { return JSON.stringify(await searchGithub(kind, query, state)); }
          catch (error) { return `GitHub search failed: ${error instanceof Error ? error.message : 'unknown error'}`; }
        },
      }),
      findWorkByTech: tool({
        description: 'Find every role and project that uses or mentions a technology, e.g. Convex, React Native, Supabase. Returns card ids to link.',
        inputSchema: z.object({ tech: z.string().min(1).max(60) }),
        execute: async ({ tech }) => formatWorkByTech(tech),
      }),
      listWorkstreams: tool({
        description: 'List active contracts or archive roles as a compact index.',
        inputSchema: z.object({
          lane: z.enum(['active', 'archive', 'all']).default('active'),
        }),
        execute: async ({ lane }) => formatWorkstreams(lane),
      }),
      navigate_to: pageTool('Scroll the page to a section or a specific card.', {
        section: z.enum(TARGET_IDS).describe('Section id or card id, e.g. projects or project-foodly'),
      }),
      highlight: pageTool('Outline one card or section for a couple of seconds.', {
        target: z.enum(TARGET_IDS),
      }),
      focus_mode: pageTool('Dim everything except one card so it can be read closely.', {
        target: z.enum(CARD_IDS).optional(),
      }),
      walkthrough: pageTool('Step through the work cards one at a time.', {
        action: z.enum(['start', 'next', 'prev', 'stop']),
      }),
      filter_work: pageTool('Show only the work that matches.', {
        year: z.number().optional(),
        tech: z.string().optional(),
        query: z.string().optional().describe('Free text to match against card text'),
      }),
      sort_work: pageTool('Reorder the work cards.', {
        by: z.enum(['year', 'title']),
        direction: z.enum(['asc', 'desc']).optional(),
      }),
      expand_card: pageTool('Open or close a card detail, such as its screenshots.', {
        target: z.enum(CARD_IDS),
        expanded: z.boolean().optional(),
      }),
      set_theme: pageTool('Switch the site between light and dark.', {
        theme: z.enum(['light', 'dark']),
      }),
      set_visibility: pageTool('Show or hide a section.', {
        section: z.enum(SECTION_IDS),
        visible: z.boolean(),
      }),
      reset_view: pageTool('Undo every page change the agent made.', {}),
  };
}

export function isUiMessageArray(value: unknown): value is UIMessage[] {
  return Array.isArray(value);
}
