/**
 * The contents page. A spread is the number of leaves turned to show it, so its
 * left-hand page is page `spread * 2 - 1`. Targets are the page ids the rows cover,
 * which is how the assistant ticks the rows that match a technology.
 */
export type ContentsRow = { spread: number; title: string; line: string; targets: string[] };

export const CONTENTS: ContentsRow[] = [
  { spread: 2, title: 'Stretch', line: 'Eat well on a student budget, free', targets: ['project-stretch'] },
  { spread: 3, title: 'Client work', line: 'Kenspire and Besmak, in production', targets: ['exp-kenspire', 'exp-besmak'] },
  { spread: 4, title: 'Foodly', line: 'Every food reel you saved, on one map', targets: ['project-foodly'] },
  { spread: 5, title: 'Switchyard', line: 'Every coding agent and account behind one endpoint', targets: ['project-switchyard'] },
  { spread: 6, title: 'ParkAlong', line: 'Finding parking without checking four places', targets: ['project-parkalong'] },
  { spread: 7, title: 'ServoGrid', line: 'A fuel map that admits when a price is stale', targets: ['project-servogrid'] },
  { spread: 8, title: 'Stack', line: 'Any files in, one PDF out', targets: ['project-pdfstack'] },
  { spread: 9, title: 'Do coding agents cooperate?', line: 'Who forgives a betrayal, and what it costs them', targets: ['project-llm-cooperation'] },
  {
    spread: 10,
    title: 'Also',
    line: 'Tools for my agent setup, and experiments',
    targets: ['project-codex-shared-memory', 'project-t3-wall', 'project-hs-heist', 'project-cursor-subagents', 'project-pptx-react-renderer', 'project-tbrgs'],
  },
  { spread: 11, title: 'More work, and hello', line: 'Earlier roles and how to reach me', targets: ['exp-complete-leader', 'exp-mindtek', 'exp-hida'] },
];

/** Section ids the assistant can turn to, besides the individual roles and projects. */
export const SECTION_IDS = ['top', 'contents', 'work', 'projects', 'also', 'experience', 'education', 'contact'] as const;
