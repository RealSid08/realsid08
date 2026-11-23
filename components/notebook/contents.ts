/**
 * The contents page. A spread is the number of leaves turned to show it, so its
 * left-hand page is page `spread * 2 - 1`. Targets are the page ids the rows cover,
 * which is how the assistant ticks the rows that match a technology.
 */
export type ContentsRow = { spread: number; title: string; line: string; color: string; targets: string[] };

export const CONTENTS: ContentsRow[] = [
  { spread: 2, title: 'Stretch', line: 'Personal food agent, 490+ devices in six weeks. Won Builders Hack', color: '#e8361d', targets: ['project-stretch', 'exp-stretch'] },
  { spread: 3, title: 'Kenspire', line: 'Sole engineer across two apps, 20+ client companies, 1,000+ PRs', color: '#7a5c3e', targets: ['exp-kenspire'] },
  { spread: 4, title: 'Besmak, and more client work', line: 'Self-hosted Mumbai AWS rollout, 220+ staff in two weeks', color: '#7a5c3e', targets: ['exp-besmak', 'exp-complete-leader', 'exp-mindtek', 'exp-hida'] },
  { spread: 5, title: 'Runaway', line: 'A battery-fire advisor that tests its plan before it speaks', color: '#c2410c', targets: ['project-runaway'] },
  { spread: 6, title: 'Foodly', line: 'Every food reel you saved, on one map (9s to 1.1s load)', color: '#3f8f4f', targets: ['project-foodly'] },
  { spread: 7, title: 'Switchyard', line: 'One local Rust gateway for every coding agent and account', color: '#c98a12', targets: ['project-switchyard'] },
  { spread: 8, title: 'ParkAlong', line: 'Availability, time limits and prices on one map for Victoria', color: '#d2491f', targets: ['project-parkalong'] },
  { spread: 9, title: 'ServoGrid', line: 'An iOS fuel map that refuses to fake a fresh price', color: '#2a9bb5', targets: ['project-servogrid'] },
  { spread: 10, title: 'Stack', line: 'Any 56 file types in, one PDF out. No sign-up, no ads', color: '#9c3a6b', targets: ['project-pdfstack'] },
  { spread: 11, title: 'Do coding agents cooperate?', line: 'Who forgives a betrayal, and what it costs them', color: '#4f46e5', targets: ['project-llm-cooperation'] },
  {
    spread: 12,
    title: 'Open source',
    line: '1,780+ npm downloads, agent tools and experiments',
    color: '#8a8175',
    targets: ['project-pptx-react-renderer', 'project-openclaw', 'project-codex-shared-memory', 'project-p3stack', 'project-t3-wall', 'project-hs-heist'],
  },
  { spread: 13, title: 'Writing, and hello', line: 'Your agents should live at home, and how to reach me', color: '#d2491f', targets: [] },
];

/** Section ids the assistant can turn to, besides the individual roles and projects. */
export const SECTION_IDS = ['top', 'contents', 'work', 'projects', 'also', 'experience', 'education', 'writing', 'contact'] as const;
