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

const ROLE_IDS = ['besmak', 'complete-leader', 'kenspire', 'mindtek', 'unieats', 'idhayam', 'hida', 'imaginet'] as const;
const PROJECT_IDS = ['foodly', 'parkalong', 'tbrgs', 'rag-viz', 'aura'] as const;

const CHAT_SYSTEM = `You are the portfolio assistant for Sidhaarth Krishnan.
Persona: professional, concise, technically specific. No emojis.

Rules:
- Call tools to retrieve facts before answering. Do not invent metrics, dates, or employers.
- Lead with current work (Besmak, Complete Leader, Kenspire), then Foodly and ParkAlong.
- Older roles (Mindtek, UniEats, Idhayam, HiDa, Imaginet) are archive context.
- Availability, visa, and location come from lookupProfile.
- Keep answers structured with short markdown lists.
- After answering, you may suggest one next question in a single italic line.`;

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
    tools: {
      lookupRole: tool({
        description: 'Fetch a specific employer/role from Sidhaarth\'s resume.',
        inputSchema: z.object({
          id: z.enum(ROLE_IDS).describe('Role id, e.g. besmak, kenspire, foodly is a project not a role'),
        }),
        execute: async ({ id }) => formatRole(id) ?? 'Role not found.',
      }),
      lookupProject: tool({
        description: 'Fetch a featured project: Foodly, ParkAlong, TBRGS, RAG, or Aura/Voice Hub.',
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
      listWorkstreams: tool({
        description: 'List active contracts or archive roles as a compact index.',
        inputSchema: z.object({
          lane: z.enum(['active', 'archive', 'all']).default('active'),
        }),
        execute: async ({ lane }) => listWorkstreams(lane),
      }),
    },
  });

  pipeUIMessageStreamToResponse({
    response: options.response,
    stream: toUIMessageStream({ stream: result.stream }),
  });
}

export function isUiMessageArray(value: unknown): value is UIMessage[] {
  return Array.isArray(value);
}
