import { runTool } from './registry';

export type ToolStep = { tool: string; args: Record<string, unknown> };

export type SlashCommand = {
  id: string;
  /** what it does, shown in the menu */
  hint: string;
  group: 'Go to' | 'Ask' | 'Page';
  /** placeholder for a command that takes text after it, e.g. `/filter convex` */
  arg?: string;
  /** page tools to run, in order; also checked against the registry in verify-agent */
  steps?: (arg: string) => ToolStep[];
  /** a question sent to the assistant instead of a page action */
  prompt?: (arg: string) => string;
  /** handled by the agent bar itself */
  local?: 'resume' | 'clear';
};

/** Scroll to a card, open its screenshots if it has any, and outline it. Sections just scroll. */
export const showCard = (target: string): ToolStep[] =>
  /^(exp|project)-/.test(target)
    ? [
        { tool: 'navigate_to', args: { section: target } },
        ...(target.startsWith('project-') ? [{ tool: 'expand_card', args: { target, expanded: true } }] : []),
        { tool: 'highlight', args: { target } },
      ]
    : [{ tool: 'navigate_to', args: { section: target } }];

/**
 * `/` commands are the quick way in. Page commands reuse the same tool registry
 * the assistant and WebMCP call, so they show up in the activity log and undo.
 */
export const SLASH_COMMANDS: SlashCommand[] = [
  { id: 'projects', group: 'Go to', hint: 'Foodly, ParkAlong and the rest', steps: () => [{ tool: 'navigate_to', args: { section: 'projects' } }] },
  { id: 'experience', group: 'Go to', hint: 'Current roles and earlier work', steps: () => [{ tool: 'navigate_to', args: { section: 'experience' } }] },
  { id: 'skills', group: 'Go to', hint: 'Languages, stack and tooling', steps: () => [{ tool: 'navigate_to', args: { section: 'skills' } }] },
  { id: 'contact', group: 'Go to', hint: 'Email, LinkedIn, GitHub', steps: () => [{ tool: 'navigate_to', args: { section: 'contact' } }] },
  { id: 'foodly', group: 'Go to', hint: 'Open the Foodly screenshots', steps: () => showCard('project-foodly') },
  { id: 'parkalong', group: 'Go to', hint: 'Open the ParkAlong screenshots', steps: () => showCard('project-parkalong') },

  { id: 'tour', group: 'Page', hint: 'Step through the work one card at a time', steps: () => [{ tool: 'walkthrough', args: { action: 'start' } }] },
  {
    id: 'filter',
    group: 'Page',
    arg: 'tech or keyword',
    hint: 'Only show matching work, e.g. /filter convex',
    steps: (arg) => [{ tool: 'filter_work', args: /^\d{4}$/.test(arg) ? { year: Number(arg) } : { query: arg } }],
  },
  { id: 'theme', group: 'Page', hint: 'Switch light or dark', steps: () => [{ tool: 'set_theme', args: { theme: globalThis.document?.documentElement.dataset.theme === 'dark' ? 'light' : 'dark' } }] },
  { id: 'reset', group: 'Page', hint: 'Undo everything the assistant changed', steps: () => [{ tool: 'reset_view', args: {} }] },
  { id: 'resume', group: 'Page', hint: 'Open the PDF', local: 'resume' },
  { id: 'clear', group: 'Page', hint: 'Start a new conversation', local: 'clear' },

  { id: 'github', group: 'Ask', hint: 'What he has shipped publicly, with links', prompt: () => 'What has Sidhaarth shipped on GitHub recently? Link the repos.' },
  { id: 'compare', group: 'Ask', hint: 'Foodly vs ParkAlong, side by side', prompt: () => 'Compare Foodly and ParkAlong: what was hard about each, and what does each show about him as an engineer?' },
  { id: 'hire', group: 'Ask', hint: 'The honest case for and against', prompt: () => 'Give me the honest case for and against hiring Sidhaarth as a graduate engineer.' },
  { id: 'stack', group: 'Ask', arg: 'technology', hint: 'Where he has used it, e.g. /stack convex', prompt: (arg) => `Where has Sidhaarth used ${arg} in real work? Show me on the page.` },
];

/** Splits `/filter convex` into the command text and its argument. */
export const parseSlash = (value: string) => {
  const match = /^\/(\S*)(?:\s+(.*))?$/s.exec(value);
  if (!match) return null;
  return { name: match[1].toLowerCase(), arg: (match[2] ?? '').trim(), hasSpace: /\s/.test(value) };
};

export const matchCommands = (value: string) => {
  const parsed = parseSlash(value);
  if (!parsed) return [];
  if (parsed.hasSpace) return SLASH_COMMANDS.filter((command) => command.id === parsed.name);
  const query = parsed.name;
  if (!query) return SLASH_COMMANDS;
  const starts = SLASH_COMMANDS.filter((command) => command.id.startsWith(query));
  const mentions = SLASH_COMMANDS.filter(
    (command) => !starts.includes(command) && command.hint.toLowerCase().includes(query),
  );
  return [...starts, ...mentions];
};

export const runSteps = async (steps: ToolStep[]) => {
  for (const step of steps) await runTool(step.tool, step.args);
};

export const showOnPage = (target: string) => runSteps(showCard(target));
