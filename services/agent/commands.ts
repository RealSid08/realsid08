import { runTool } from './registry';

export type SlashCommand = {
  id: string;
  label: string;
  /** what it does, shown next to the label while typing */
  hint: string;
  /** handled by the bar itself (voice, links) rather than a page tool */
  local?: 'voice' | 'resume';
  run?: () => void;
};

/**
 * `/` commands are the easy way in: each one is a real action, not a canned
 * question, and they reuse the same tool registry the agent and WebMCP call.
 */
export const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: 'navigate',
    label: "Navigate Sidhaarth's portfolio",
    hint: 'guided walkthrough',
    run: () => void runTool('walkthrough', { action: 'start' }),
  },
  {
    id: 'projects',
    label: 'Projects',
    hint: 'Foodly, ParkAlong, and the rest',
    run: () => void runTool('navigate_to', { section: 'projects' }),
  },
  {
    id: 'experience',
    label: 'Experience',
    hint: 'current roles and earlier work',
    run: () => void runTool('navigate_to', { section: 'experience' }),
  },
  {
    id: 'skills',
    label: 'Skills',
    hint: 'languages, stack, tooling',
    run: () => void runTool('navigate_to', { section: 'skills' }),
  },
  {
    id: 'foodly',
    label: 'Foodly',
    hint: 'jump to the screenshots',
    run: () => {
      void runTool('navigate_to', { section: 'projects' });
      void runTool('highlight', { target: 'project-foodly' });
      void runTool('expand_card', { target: 'project-foodly', expanded: true });
    },
  },
  {
    id: 'parkalong',
    label: 'ParkAlong',
    hint: 'jump to the screenshots',
    run: () => {
      void runTool('navigate_to', { section: 'projects' });
      void runTool('highlight', { target: 'project-parkalong' });
      void runTool('expand_card', { target: 'project-parkalong', expanded: true });
    },
  },
  {
    id: '2026',
    label: 'Only 2026 work',
    hint: 'filter the page',
    run: () => void runTool('filter_work', { year: 2026 }),
  },
  {
    id: 'voice',
    label: 'Voice',
    hint: 'talk to the agent',
    local: 'voice',
  },
  {
    id: 'dark',
    label: 'Dark mode',
    hint: 'switch the theme',
    run: () => void runTool('set_theme', { theme: 'dark' }),
  },
  {
    id: 'light',
    label: 'Light mode',
    hint: 'switch the theme',
    run: () => void runTool('set_theme', { theme: 'light' }),
  },
  {
    id: 'reset',
    label: 'Reset the page',
    hint: 'undo everything the agent changed',
    run: () => void runTool('reset_view', {}),
  },
  {
    id: 'resume',
    label: 'Résumé',
    hint: 'open the PDF',
    local: 'resume',
  },
];

export const matchCommands = (value: string) => {
  const query = value.startsWith('/') ? value.slice(1).toLowerCase().trim() : '';
  if (!query) return SLASH_COMMANDS;
  return SLASH_COMMANDS.filter(
    (command) =>
      command.id.startsWith(query) ||
      command.label.toLowerCase().includes(query) ||
      command.hint.includes(query),
  );
};
