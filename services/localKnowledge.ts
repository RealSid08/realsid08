import { EDUCATION, EXPERIENCES, PROFILE, PROJECTS, SKILLS } from '../constants';

export function formatRole(id: string): string | null {
  const role = EXPERIENCES.find((exp) => exp.id === id);
  if (!role) return null;
  const meta = [role.period, role.location, role.employmentType].filter(Boolean).join(', ');
  return [
    `**${role.role}** at **${role.company}** (${meta}).`,
    ...role.description.map((line) => `- ${line}`),
    `Stack: ${role.tech.join(', ')}`,
  ].join('\n');
}

export function formatProject(id: string): string | null {
  const project = PROJECTS.find((item) => item.id === id);
  if (!project) return null;
  return [
    `**${project.title}**${project.subtitle ? ` — ${project.subtitle}` : ''}${project.period ? ` (${project.period})` : ''}.`,
    ...(project.bullets ?? [project.description]).map((line) => `- ${line}`),
    project.githubUrl ? `Repo: ${project.githubUrl}` : '',
  ].filter(Boolean).join('\n');
}

export function localPortfolioAnswer(question: string): string {
  const q = question.toLowerCase();
  const parts: string[] = [];

  if (/besmak/.test(q)) {
    const text = formatRole('besmak');
    if (text) parts.push(text);
  }
  if (/complete leader/.test(q)) {
    const text = formatRole('complete-leader');
    if (text) parts.push(text);
  }
  if (/kenspire/.test(q)) {
    const text = formatRole('kenspire');
    if (text) parts.push(text);
  }
  if (/mindtek/.test(q)) {
    const text = formatRole('mindtek');
    if (text) parts.push(text);
  }
  if (/foodly/.test(q)) {
    const text = formatProject('foodly');
    if (text) parts.push(text);
  }
  if (/parkalong|parking/.test(q)) {
    const text = formatProject('parkalong');
    if (text) parts.push(text);
  }
  if (/(available|availability|graduate|december|dec 2026|work rights|visa|melbourne|location)/.test(q)) {
    parts.push([`**${PROFILE.location}**`, PROFILE.visa, PROFILE.availability].join('\n\n'));
  }
  if (/educat|swinburne|degree/.test(q)) {
    parts.push(`**${EDUCATION.degree}**, ${EDUCATION.school}, ${EDUCATION.campus}. Graduating ${EDUCATION.graduating}.`);
  }
  if (/skill|stack|agentic|worktree/.test(q) && parts.length === 0) {
    parts.push(SKILLS.map((cluster) => `**${cluster.label}**: ${cluster.items.join(', ')}`).join('\n'));
  }

  if (parts.length > 0) {
    return parts.join('\n\n');
  }

  return [
    `Sidhaarth Krishnan is a full-stack software engineer in ${PROFILE.location}.`,
    PROFILE.availability,
    'Active workstreams: **Besmak Components**, **Complete Leader**, and **Kenspire Advisors**. Featured projects include **Foodly** and **ParkAlong**.',
    'Ask about a company, project, skills, or availability for specifics.',
  ].join('\n\n');
}
