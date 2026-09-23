import { createOpenAI } from '@ai-sdk/openai';
import {
  convertToModelMessages,
  pipeUIMessageStreamToResponse,
  stepCountIs,
  streamText,
  toUIMessageStream,
  tool,
  type UIMessage,
} from 'ai';
import type { ServerResponse } from 'http';
import { z } from 'zod';
import { EDUCATION, EXPERIENCES, PROFILE, SKILLS } from '../constants';
import { formatProject, formatRole } from '../services/localKnowledge';
import { CHAT_MODEL_ID } from './chatModel';
import { formatRepoForModel, formatReposForModel, getPublicRepo, isAllowedAccount, listPublicRepos } from './github';

const ROLE_IDS = ['besmak', 'complete-leader', 'kenspire', 'mindtek', 'unieats', 'idhayam', 'hida', 'imaginet'] as const;
const PROJECT_IDS = ['foodly', 'parkalong', 'tbrgs', 'rag-viz', 'aura'] as const;

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

const CHAT_SYSTEM = `You are the portfolio assistant for Sidhaarth Krishnan.
Persona: professional, concise, technically specific. No emojis.

Rules:
- Call tools to retrieve facts before answering. Do not invent metrics, dates, or employers.
- Lead with current work (Besmak, Complete Leader, Kenspire), then Foodly and ParkAlong.
- Older roles (Mindtek, UniEats, Idhayam, HiDa, Imaginet) are archive context.
- Availability, visa, and location come from lookupProfile.
- Public GitHub activity comes from lookupGitHub: RealSid08 and OpenRenderKit only, public repositories only,
  and always state the "as of" time from the tool result rather than implying live data.
- Keep answers structured with short markdown lists.
- After answering, you may suggest one next question in a single italic line.

Driving the page:
- You can move the page while you answer. Call navigate_to, highlight, focus_mode, walkthrough,
  filter_work, sort_work, expand_card, set_theme, set_visibility or reset_view when the visitor
  asks to see something, or when pointing at a card makes the answer clearer.
- Prefer one or two page actions per turn; never dispatch a walkthrough unasked.
- The visitor can see every page action in an activity log and undo them, so be deliberate.
  If they ask to undo, call reset_view.`;

function lookupProfile(): string {
  return [
    `**${PROFILE.givenName} ${PROFILE.familyName}** — ${PROFILE.title}`,
    PROFILE.location,
    PROFILE.visa,
    PROFILE.availability,
    `Email: ${PROFILE.email}`,
    `Phone: ${PROFILE.phone}`,
    `LinkedIn: ${PROFILE.linkedin}`,
    `GitHub: ${PROFILE.github}`,
    `Resume: ${PROFILE.resumeUrl}`,
    `Education: ${EDUCATION.degree}, ${EDUCATION.school}, ${EDUCATION.campus}. Graduating ${EDUCATION.graduating}.`,
  ].join('\n');
}

function lookupSkills(cluster?: string): string {
  const selected = cluster
    ? SKILLS.filter((item) => item.id === cluster || item.label.toLowerCase().includes(cluster.toLowerCase()))
    : SKILLS;
  if (selected.length === 0) {
    return SKILLS.map((item) => `**${item.label}**: ${item.items.join(', ')}`).join('\n');
  }
  return selected.map((item) => `**${item.label}**: ${item.items.join(', ')}`).join('\n');
}

function listWorkstreams(lane: 'active' | 'archive' | 'all'): string {
  const rows = EXPERIENCES.filter((exp) => lane === 'all' || exp.lane === lane);
  return rows
    .map((exp) => `- **${exp.company}** — ${exp.role} (${exp.period})${exp.employmentType ? ` · ${exp.employmentType}` : ''}`)
    .join('\n');
}

export async function streamPortfolioChat(options: {
  apiKey: string;
  messages: UIMessage[];
  response: ServerResponse;
}): Promise<void> {
  const openai = createOpenAI({ apiKey: options.apiKey });

  const result = streamText({
    model: openai(CHAT_MODEL_ID),
    system: CHAT_SYSTEM,
    messages: await convertToModelMessages(options.messages),
    stopWhen: stepCountIs(4),
    providerOptions: {
      openai: {
        reasoningEffort: 'low',
      },
    },
    tools: buildPortfolioTools(),
  });

  pipeUIMessageStreamToResponse({
    response: options.response,
    stream: toUIMessageStream({ stream: result.stream }),
  });
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
        description: 'Fetch a featured project: Foodly, ParkAlong, TBRGS, RAG, or the voice demo.',
        inputSchema: z.object({
          id: z.enum(PROJECT_IDS),
        }),
        execute: async ({ id }) => formatProject(id) ?? 'Project not found.',
      }),
      lookupSkills: tool({
        description: 'Fetch skill clusters (languages, frontend, backend, agentic, cloud, delivery).',
        inputSchema: z.object({
          cluster: z.string().optional().describe('Optional cluster name or id'),
        }),
        execute: async ({ cluster }) => lookupSkills(cluster),
      }),
      lookupProfile: tool({
        description: 'Fetch location, visa, availability, education, and contact links.',
        inputSchema: z.object({}),
        execute: async () => lookupProfile(),
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
      listWorkstreams: tool({
        description: 'List active contracts or archive roles as a compact index.',
        inputSchema: z.object({
          lane: z.enum(['active', 'archive', 'all']).default('active'),
        }),
        execute: async ({ lane }) => listWorkstreams(lane),
      }),
      navigate_to: pageTool('Scroll the page to a section.', {
        section: z.enum(['top', 'skills', 'experience', 'projects', 'education', 'aura', 'contact']),
      }),
      highlight: pageTool('Briefly outline one card or section.', {
        target: z.string().describe('Element id, e.g. project-foodly or exp-besmak'),
      }),
      focus_mode: pageTool('Dim everything except one card.', {
        target: z.string().optional().describe('Element id to keep in focus'),
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
        target: z.string().describe('Element id, e.g. project-foodly'),
        expanded: z.boolean().optional(),
      }),
      set_theme: pageTool('Switch the site between light and dark.', {
        theme: z.enum(['light', 'dark']),
      }),
      set_visibility: pageTool('Show or hide a section.', {
        section: z.enum(['top', 'skills', 'experience', 'projects', 'education', 'aura', 'contact']),
        visible: z.boolean(),
      }),
      reset_view: pageTool('Undo every page change the agent made.', {}),
  };
}

export function isUiMessageArray(value: unknown): value is UIMessage[] {
  return Array.isArray(value);
}
