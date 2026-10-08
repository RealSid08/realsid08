import { EXPERIENCES, PROJECTS } from '../constants.js';

/**
 * Everything in the notebook the assistant can turn to. Each id is a
 * `data-target` on a page or an entry; scripts/verify-agent.ts checks that every
 * one is actually rendered.
 */
export const SECTION_TARGETS = {
  top: 'the opening page',
  contents: 'the contents',
  work: 'client work',
  projects: 'the projects',
  also: 'the tools and experiments',
  experience: 'earlier roles',
  education: 'his degree',
  contact: 'the contact page',
} as const;

export const ROLE_TARGETS = ['kenspire', 'besmak', 'complete-leader', 'mindtek', 'hida'] as const;

export const PROJECT_TARGETS = [
  'foodly',
  'switchyard',
  'parkalong',
  'servogrid',
  'llm-cooperation',
  'codex-shared-memory',
  't3-wall',
  'hs-heist',
  'cursor-subagents',
  'pptx-react-renderer',
  'tbrgs',
] as const;

export const SECTION_IDS = Object.keys(SECTION_TARGETS) as Array<keyof typeof SECTION_TARGETS>;
export const CARD_IDS = [
  ...ROLE_TARGETS.map((id) => `exp-${id}`),
  ...PROJECT_TARGETS.map((id) => `project-${id}`),
] as [string, ...string[]];
export const TARGET_IDS = [...CARD_IDS, ...SECTION_IDS] as [string, ...string[]];

/** The order a tour turns through. */
export const TOUR = ['exp-kenspire', 'exp-besmak', 'project-foodly', 'project-switchyard', 'project-parkalong', 'project-servogrid', 'project-llm-cooperation', 'also', 'experience', 'contact'];

export const isTargetId = (value: string) => (TARGET_IDS as readonly string[]).includes(value.replace(/^#/, ''));

/** Human name for a target id, e.g. project-foodly -> Foodly. */
export const targetName = (id: string) => {
  const bare = id.replace(/^#/, '');
  if (bare in SECTION_TARGETS) return SECTION_TARGETS[bare as keyof typeof SECTION_TARGETS];
  const key = bare.replace(/^(exp|project)-/, '');
  return (
    EXPERIENCES.find((exp) => exp.id === key)?.company ??
    PROJECTS.find((project) => project.id === key)?.title ??
    key.charAt(0).toUpperCase() + key.slice(1)
  );
};

/** The page id for a role or project, if it appears in the notebook. */
export const cardIdFor = (kind: 'role' | 'project', id: string) => {
  const target = `${kind === 'role' ? 'exp' : 'project'}-${id}`;
  return isTargetId(target) ? target : null;
};
