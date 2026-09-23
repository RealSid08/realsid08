import {
  focusMode,
  getState,
  highlight,
  navigateTo,
  resetView,
  setTheme,
  setVisibility,
  walkthrough,
} from './actions';

export type AgentTool = {
  name: string;
  description: string;
  /** read tools are safe in any context; act tools change the page */
  kind: 'read' | 'act';
  inputSchema: Record<string, unknown>;
  /** shown in the command palette as a ready-made action */
  palette?: { label: string; args: Record<string, unknown> };
  run: (args: Record<string, unknown>) => unknown;
};

const str = (description: string, values?: string[]) =>
  values ? { type: 'string', enum: values, description } : { type: 'string', description };

const SECTIONS = [
  'top',
  'skills',
  'experience',
  'projects',
  'education',
  'aura',
  'contact',
];

/**
 * The single source of truth for what the agent can do. Consumed by the
 * in-page agent, the command palette and (later) the WebMCP registration.
 */
export const TOOLS: AgentTool[] = [
  {
    name: 'get_state',
    description: 'Read what the visitor is currently looking at: theme, focus mode, hidden sections.',
    kind: 'read',
    inputSchema: { type: 'object', properties: {} },
    run: () => getState(),
  },
  {
    name: 'navigate_to',
    description: 'Scroll the page to a section.',
    kind: 'act',
    inputSchema: { type: 'object', properties: { section: str('Section id', SECTIONS) }, required: ['section'] },
    palette: { label: 'Jump to projects', args: { section: 'projects' } },
    run: ({ section }) => navigateTo(String(section)),
  },
  {
    name: 'highlight',
    description: 'Point at one card or section by briefly outlining it.',
    kind: 'act',
    inputSchema: {
      type: 'object',
      properties: { target: str('Element id, e.g. project-foodly'), durationMs: { type: 'number' } },
      required: ['target'],
    },
    palette: { label: 'Highlight ParkAlong', args: { target: 'project-parkalong' } },
    run: ({ target, durationMs }) => highlight(String(target), Number(durationMs) || undefined),
  },
  {
    name: 'focus_mode',
    description: 'Dim everything except one card so it can be read closely.',
    kind: 'act',
    inputSchema: { type: 'object', properties: { target: str('Element id to keep in focus') } },
    run: ({ target }) => focusMode(target ? String(target) : undefined),
  },
  {
    name: 'walkthrough',
    description: 'Step through the work one card at a time.',
    kind: 'act',
    inputSchema: {
      type: 'object',
      properties: { action: str('Step', ['start', 'next', 'prev', 'stop']) },
      required: ['action'],
    },
    palette: { label: 'Walk me through the work', args: { action: 'start' } },
    run: ({ action }) => walkthrough(String(action) as 'start' | 'next' | 'prev' | 'stop'),
  },
  {
    name: 'set_theme',
    description: 'Switch between light and dark.',
    kind: 'act',
    inputSchema: { type: 'object', properties: { theme: str('Theme', ['light', 'dark']) }, required: ['theme'] },
    palette: { label: 'Use dark mode', args: { theme: 'dark' } },
    run: ({ theme }) => setTheme(String(theme) as 'light' | 'dark'),
  },
  {
    name: 'set_visibility',
    description: 'Show or hide a section of the page.',
    kind: 'act',
    inputSchema: {
      type: 'object',
      properties: { section: str('Section id', SECTIONS), visible: { type: 'boolean' } },
      required: ['section', 'visible'],
    },
    run: ({ section, visible }) => setVisibility(String(section), Boolean(visible)),
  },
  {
    name: 'reset_view',
    description: 'Undo every change the agent made to the page.',
    kind: 'act',
    inputSchema: { type: 'object', properties: {} },
    palette: { label: 'Reset the page', args: {} },
    run: () => resetView(),
  },
];

export const toolByName = (name: string) => TOOLS.find((tool) => tool.name === name);

export const paletteEntries = TOOLS.filter((tool) => tool.palette).map((tool) => ({
  name: tool.name,
  label: tool.palette!.label,
  args: tool.palette!.args,
}));

/** Execute by name, which is what an external agent will call. */
export const runTool = (name: string, args: Record<string, unknown> = {}) => {
  const tool = toolByName(name);
  if (!tool) return { ok: false, error: `Unknown tool: ${name}` };
  try {
    return { ok: true, result: tool.run(args) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Tool failed' };
  }
};
