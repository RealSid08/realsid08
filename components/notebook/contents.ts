/**
 * The contents page. A spread is the number of leaves turned to show it, so its
 * left-hand page is page `spread * 2 - 1`. Targets are the page ids the rows cover,
 * which is how the assistant ticks the rows that match a technology.
 */
export type ContentsRow = { spread: number; title: string; line: string; targets: string[] };

export const CONTENTS: ContentsRow[] = [
  { spread: 2, title: 'Stretch', line: 'A personal food agent. Won Builders Hack: Unlocked', targets: ['project-stretch', 'exp-stretch'] },
  { spread: 3, title: 'Kenspire', line: 'A consultancy’s platform, at 22 client companies', targets: ['exp-kenspire'] },
  { spread: 4, title: 'Besmak, and more client work', line: 'A manufacturer’s task platform, launched in October', targets: ['exp-besmak', 'exp-complete-leader', 'exp-mindtek', 'exp-hida'] },
  { spread: 5, title: 'Runaway', line: 'An AI advisor for battery fires', targets: ['project-runaway'] },
  { spread: 6, title: 'Foodly', line: 'Every food reel you saved, on one map', targets: ['project-foodly'] },
  { spread: 7, title: 'Switchyard', line: 'Every coding agent and account behind one endpoint', targets: ['project-switchyard'] },
  { spread: 8, title: 'ParkAlong', line: 'Finding parking without checking four places', targets: ['project-parkalong'] },
  { spread: 9, title: 'ServoGrid', line: 'A fuel map that admits when a price is stale', targets: ['project-servogrid'] },
  { spread: 10, title: 'Stack', line: 'Any files in, one PDF out', targets: ['project-pdfstack'] },
  { spread: 11, title: 'Do coding agents cooperate?', line: 'Who forgives a betrayal, and what it costs them', targets: ['project-llm-cooperation'] },
  {
    spread: 12,
    title: 'Open source',
    line: 'An npm package, agent tools and experiments',
    targets: ['project-pptx-react-renderer', 'project-openclaw', 'project-codex-shared-memory', 'project-p3stack', 'project-t3-wall', 'project-hs-heist'],
  },
  { spread: 13, title: 'Writing, and hello', line: 'The blog, and how to reach me', targets: [] },
];

/** Section ids the assistant can turn to, besides the individual roles and projects. */
export const SECTION_IDS = ['top', 'contents', 'work', 'projects', 'also', 'experience', 'education', 'writing', 'contact'] as const;
