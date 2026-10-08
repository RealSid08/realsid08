import { focusOn, getState, markWork, resetView, setTheme, tour, turnTo } from './actions';
import { formatProfile, formatProject, formatRole, formatSkills, formatWorkByTech, formatWorkIndex } from '../localKnowledge';
import { SECTION_IDS, TARGET_IDS } from '../../lib/portfolioIds';

export type AgentTool = {
  name: string;
  description: string;
  /** read tools are safe in any context; act tools change the page */
  kind: 'read' | 'act';
  inputSchema: Record<string, unknown>;
  run: (args: Record<string, unknown>) => unknown | Promise<unknown>;
};

const str = (description: string, values?: readonly string[]) =>
  values ? { type: 'string', enum: values, description } : { type: 'string', description };

const target = str(`A page id: a section (${SECTION_IDS.join(', ')}) or a role or project such as project-foodly or exp-besmak`, TARGET_IDS);

const github = async (params: Record<string, string>) => {
  const response = await fetch(`/api/github?${new URLSearchParams(params)}`);
  if (!response.ok) return { error: `GitHub lookup failed (${response.status})` };
  return response.json();
};

/**
 * What the notebook can do, for the slash commands and for external agents over
 * WebMCP. The chat assistant's page tools (lib/portfolioChat.ts) use the same names.
 */
export const TOOLS: AgentTool[] = [
  {
    name: 'list_work',
    description: 'List every role and project in Sidhaarth’s portfolio, with ids and notebook page ids.',
    kind: 'read',
    inputSchema: { type: 'object', properties: {} },
    run: () => formatWorkIndex(),
  },
  {
    name: 'lookup_role',
    description: 'Read one of Sidhaarth’s roles in full.',
    kind: 'read',
    inputSchema: { type: 'object', properties: { id: str('Role id from list_work, e.g. besmak') }, required: ['id'] },
    run: ({ id }) => formatRole(String(id)) ?? 'Role not found. Call list_work for ids.',
  },
  {
    name: 'lookup_project',
    description: 'Read one of Sidhaarth’s projects in full.',
    kind: 'read',
    inputSchema: { type: 'object', properties: { id: str('Project id from list_work, e.g. foodly') }, required: ['id'] },
    run: ({ id }) => formatProject(String(id)) ?? 'Project not found. Call list_work for ids.',
  },
  {
    name: 'lookup_skills',
    description: 'Read his skills: languages, web and mobile, backend, AI and coding agents, cloud, testing.',
    kind: 'read',
    inputSchema: { type: 'object', properties: { cluster: str('Optional cluster name') } },
    run: ({ cluster }) => formatSkills(cluster ? String(cluster) : undefined),
  },
  {
    name: 'lookup_profile',
    description: 'Read his location, availability, education and public contact details.',
    kind: 'read',
    inputSchema: { type: 'object', properties: {} },
    run: () => formatProfile(),
  },
  {
    name: 'find_work_by_tech',
    description: 'Find every role and project that uses or mentions a technology.',
    kind: 'read',
    inputSchema: { type: 'object', properties: { tech: str('A technology, e.g. Convex') }, required: ['tech'] },
    run: ({ tech }) => formatWorkByTech(String(tech ?? '')),
  },
  {
    name: 'get_public_repos',
    description: 'List public GitHub repositories for RealSid08 or OpenRenderKit, with a fetched-at time.',
    kind: 'read',
    inputSchema: { type: 'object', properties: { account: str('Account', ['RealSid08', 'OpenRenderKit']) } },
    run: ({ account }) => github({ account: account ? String(account) : 'RealSid08' }),
  },
  {
    name: 'get_state',
    description: 'Read what the visitor is looking at: the open pages, the theme, and any tour.',
    kind: 'read',
    inputSchema: { type: 'object', properties: {} },
    run: () => getState(),
  },
  {
    name: 'turn_to',
    description: 'Turn the notebook to a section, role or project. Set circle to ring its title in pen.',
    kind: 'act',
    inputSchema: { type: 'object', properties: { target, circle: { type: 'boolean' } }, required: ['target'] },
    run: ({ target: id, circle: ring }) => turnTo(String(id), Boolean(ring)),
  },
  {
    name: 'focus',
    description: 'Dim everything on the open pages except one role, project or section.',
    kind: 'act',
    inputSchema: { type: 'object', properties: { target } },
    run: ({ target: id }) => focusOn(id ? String(id) : undefined),
  },
  {
    name: 'mark_work',
    description: 'Turn to the contents and tick every entry whose work uses a technology or matches a phrase.',
    kind: 'act',
    inputSchema: { type: 'object', properties: { query: str('A technology or phrase, e.g. Convex or SwiftUI') }, required: ['query'] },
    run: ({ query }) => markWork(String(query ?? '')),
  },
  {
    name: 'tour',
    description: 'Step through the work one entry at a time.',
    kind: 'act',
    inputSchema: { type: 'object', properties: { action: str('Step', ['start', 'next', 'prev', 'stop']) }, required: ['action'] },
    run: ({ action }) => tour(String(action) as 'start' | 'next' | 'prev' | 'stop'),
  },
  {
    name: 'set_theme',
    description: 'Turn the desk lamp on (light) or off (dark).',
    kind: 'act',
    inputSchema: { type: 'object', properties: { theme: str('Theme', ['light', 'dark']) }, required: ['theme'] },
    run: ({ theme }) => setTheme(String(theme) === 'dark' ? 'dark' : 'light'),
  },
  {
    name: 'reset_view',
    description: 'Undo every change the assistant made to the page.',
    kind: 'act',
    inputSchema: { type: 'object', properties: {} },
    run: () => resetView(),
  },
];

export const toolByName = (name: string) => TOOLS.find((tool) => tool.name === name);

/** Execute by name, which is what an external agent will call. */
export const runTool = async (name: string, args: Record<string, unknown> = {}) => {
  const tool = toolByName(name);
  if (!tool) return { ok: false, error: `Unknown tool: ${name}` };
  try {
    return { ok: true, result: await tool.run(args) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Tool failed' };
  }
};
