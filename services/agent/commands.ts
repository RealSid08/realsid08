import { runTool } from './registry';

export type ToolStep = { tool: string; args: Record<string, unknown> };

export type SlashCommand = {
  id: string;
  /** what it does, shown in the menu */
  hint: string;
  group: 'Go to' | 'Ask' | 'Page';
  /** placeholder for a command that takes text after it, e.g. `/find convex` */
  arg?: string;
  /** page tools to run, in order; also checked against the registry in verify-agent */
  steps?: (arg: string) => ToolStep[];
  /** a question sent to the assistant instead of a page action */
  prompt?: (arg: string) => string;
  /** handled by the agent bar itself */
  local?: 'resume' | 'clear';
};

/** Turn to a page and ring it in pen. */
export const showCard = (target: string): ToolStep[] => [{ tool: 'turn_to', args: { target, circle: /^(exp|project)-/.test(target) } }];

const goTo = (id: string, target: string, hint: string): SlashCommand => ({ id, group: 'Go to', hint, steps: () => showCard(target) });

/**
 * `/` commands are the quick way in. Page commands reuse the same tool registry
 * external agents call, so they show up in the activity log and can be undone.
 */
export const SLASH_COMMANDS: SlashCommand[] = [
  goTo('work', 'work', 'Kenspire and Besmak, in production'),
  goTo('foodly', 'project-foodly', 'Every food reel you saved, on one map'),
  goTo('switchyard', 'project-switchyard', 'One gateway for every coding agent'),
  goTo('parkalong', 'project-parkalong', 'Parking, time limits and prices on one map'),
  goTo('servogrid', 'project-servogrid', 'Fuel prices that admit when they are stale'),
  goTo('research', 'project-llm-cooperation', 'Do coding agents cooperate?'),
  goTo('also', 'also', 'Tools and experiments'),
  goTo('contact', 'contact', 'Email, GitHub, LinkedIn, résumé'),

  { id: 'tour', group: 'Page', hint: 'Turn through the work one entry at a time', steps: () => [{ tool: 'tour', args: { action: 'start' } }] },
  { id: 'find', group: 'Page', arg: 'tech or keyword', hint: 'Tick the work that uses it, e.g. /find convex', steps: (arg) => [{ tool: 'mark_work', args: { query: arg } }] },
  { id: 'lamp', group: 'Page', hint: 'Turn the desk lamp on or off', steps: () => [{ tool: 'set_theme', args: { theme: globalThis.document?.documentElement.dataset.theme === 'dark' ? 'light' : 'dark' } }] },
  { id: 'reset', group: 'Page', hint: 'Undo everything the assistant changed', steps: () => [{ tool: 'reset_view', args: {} }] },
  { id: 'resume', group: 'Page', hint: 'Download the PDF', local: 'resume' },
  { id: 'clear', group: 'Page', hint: 'Start a new conversation', local: 'clear' },

  { id: 'now', group: 'Ask', hint: 'What he is working on right now', prompt: () => 'What is Sidhaarth working on right now, and what does he own in each?' },
  { id: 'github', group: 'Ask', hint: 'What he has shipped publicly, with links', prompt: () => 'What has Sidhaarth shipped on GitHub recently? Link the repos.' },
  { id: 'compare', group: 'Ask', hint: 'ParkAlong vs ServoGrid, side by side', prompt: () => 'Compare ParkAlong and ServoGrid: what problem each solves, what was hard, and what each shows about him as an engineer.' },
  { id: 'hire', group: 'Ask', hint: 'The honest case for and against', prompt: () => 'Give me the honest case for and against hiring Sidhaarth.' },
  { id: 'stack', group: 'Ask', arg: 'technology', hint: 'Where he has used it, e.g. /stack convex', prompt: (arg) => `Where has Sidhaarth used ${arg} in real work? Show me in the notebook.` },
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
