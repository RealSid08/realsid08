import { EDUCATION, EXPERIENCES, PROFILE, PROJECTS, SKILLS } from '../constants.js';
import { cardIdFor } from '../lib/portfolioIds.js';

const pageRef = (id: string | null) => (id ? ` · page id ${id}` : ' · not in the notebook');

export function formatRole(id: string): string | null {
  const role = EXPERIENCES.find((exp) => exp.id === id);
  if (!role) return null;
  const meta = [role.period, role.location, role.employmentType].filter(Boolean).join(', ');
  return [
    `**${role.role}** at **${role.company}** (${meta})${pageRef(cardIdFor('role', role.id))}.`,
    ...role.description.map((line) => `- ${line}`),
    `Stack: ${role.tech.join(', ')}`,
  ].join('\n');
}

export function formatProject(id: string): string | null {
  const project = PROJECTS.find((item) => item.id === id);
  if (!project) return null;
  return [
    `**${project.title}**${project.subtitle ? `: ${project.subtitle}` : ''}${project.period ? ` (${project.period})` : ''}${pageRef(cardIdFor('project', project.id))}.`,
    ...(project.bullets ?? [project.description]).map((line) => `- ${line}`),
    `Stack: ${project.tech.join(', ')}`,
    project.githubUrl ? `Repo: ${project.githubUrl}` : '',
    project.link ? `Link: ${project.link}` : '',
  ].filter(Boolean).join('\n');
}

export function formatProfile(): string {
  return [
    `**${PROFILE.givenName} ${PROFILE.familyName}**, ${PROFILE.title}, ${PROFILE.location}.`,
    PROFILE.tagline,
    `How he works: ${PROFILE.manifesto}`,
    PROFILE.availability,
    `Email: ${PROFILE.email}`,
    `LinkedIn: ${PROFILE.linkedin}`,
    `GitHub: ${PROFILE.github}`,
    `Résumé: ${PROFILE.resumeUrl}`,
    `Education: ${EDUCATION.degree}, ${EDUCATION.school}, ${EDUCATION.campus}. Graduating ${EDUCATION.graduating}.`,
    `High Distinctions: ${EDUCATION.distinctions.map((item) => `${item.unit} (${item.mark})`).join(', ')}.`,
  ].join('\n');
}

export function formatSkills(cluster?: string): string {
  const selected = cluster
    ? SKILLS.filter((item) => item.id === cluster || item.label.toLowerCase().includes(cluster.toLowerCase()))
    : SKILLS;
  const rows = selected.length > 0 ? selected : SKILLS;
  return rows.map((item) => `**${item.label}**: ${item.items.join(', ')}`).join('\n');
}

/** A compact index of every role and project, with ids for the other lookups and page ids for the notebook. */
export function formatWorkIndex(): string {
  return [
    'Roles (newest first):',
    ...EXPERIENCES.map((exp) => `- ${exp.id}: ${exp.company}, ${exp.role} (${exp.period}${exp.employmentType ? `, ${exp.employmentType}` : ''})${exp.lane === 'archive' ? ', earlier role' : ''}${pageRef(cardIdFor('role', exp.id))}`),
    'Projects:',
    ...PROJECTS.map((project) => `- ${project.id}: ${project.title}${project.subtitle ? `, ${project.subtitle}` : ''}${pageRef(cardIdFor('project', project.id))}`),
  ].join('\n');
}

const mentions = (needle: string, tags: string[], text: string[]) =>
  tags.some((tag) => tag.toLowerCase().includes(needle)) || text.some((line) => line.toLowerCase().includes(needle));

/** Page ids of every role and project that uses or mentions a technology or phrase. */
export function matchingTargets(query: string): string[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return [
    ...EXPERIENCES.filter((exp) => mentions(needle, exp.tech, [exp.company, ...exp.description])).map((exp) => cardIdFor('role', exp.id)),
    ...PROJECTS.filter((project) => mentions(needle, project.tech, [project.title, project.description, ...(project.bullets ?? [])])).map((project) => cardIdFor('project', project.id)),
  ].filter((id): id is string => id !== null);
}

/**
 * Every role and project that lists a technology in its stack or mentions it in
 * its write-up, with page ids to link. Answers "where has he used X" in one call.
 */
export function formatWorkByTech(tech: string): string {
  const needle = tech.trim().toLowerCase();
  if (!needle) return 'Give a technology to look for.';
  const roles = EXPERIENCES.filter((exp) => mentions(needle, exp.tech, exp.description)).map(
    (exp) => `- **${exp.company}**, ${exp.role} (${exp.period})${pageRef(cardIdFor('role', exp.id))} · stack: ${exp.tech.join(', ')}`,
  );
  const projects = PROJECTS.filter((project) => mentions(needle, project.tech, project.bullets ?? [project.description])).map(
    (project) => `- **${project.title}**${project.subtitle ? `, ${project.subtitle}` : ''}${pageRef(cardIdFor('project', project.id))} · stack: ${project.tech.join(', ')}`,
  );
  if (roles.length + projects.length === 0) return `Nothing in his roles or projects mentions ${tech}.`;
  return [
    `Work that uses or mentions ${tech} (${roles.length + projects.length} in total):`,
    ...(roles.length ? ['Roles:', ...roles] : []),
    ...(projects.length ? ['Projects:', ...projects] : []),
  ].join('\n');
}
