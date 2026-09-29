import { EXPERIENCES, PROJECTS } from '../constants';

/** Everything on the page the assistant can point at, derived from the same data the page renders. */
export const ROLE_IDS = EXPERIENCES.map((exp) => exp.id) as [string, ...string[]];
export const PROJECT_IDS = PROJECTS.filter((project) => project.type !== 'live-demo').map((project) => project.id) as [string, ...string[]];
export const CARD_IDS = [...ROLE_IDS.map((id) => `exp-${id}`), ...PROJECT_IDS.map((id) => `project-${id}`)] as [string, ...string[]];
export const SECTION_IDS = ['top', 'skills', 'experience', 'projects', 'education', 'contact'] as const;
export const TARGET_IDS = [...CARD_IDS, ...SECTION_IDS] as [string, ...string[]];

export const isTargetId = (value: string) => (TARGET_IDS as readonly string[]).includes(value);

/** Human name for a card or section id, e.g. project-foodly -> Foodly. */
export const targetName = (id: string) => {
  const bare = id.replace(/^#/, '').replace(/^(exp|project)-/, '');
  return (
    EXPERIENCES.find((exp) => exp.id === bare)?.company ??
    PROJECTS.find((project) => project.id === bare)?.title ??
    bare.charAt(0).toUpperCase() + bare.slice(1)
  );
};
