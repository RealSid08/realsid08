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
    project.link ? `Link: ${project.link}` : '',
  ].filter(Boolean).join('\n');
}

export function formatProfile(): string {
  return [
    `**${PROFILE.givenName} ${PROFILE.familyName}** — ${PROFILE.title}`,
    PROFILE.location,
    PROFILE.availability,
    `Email: ${PROFILE.email}`,
    `Phone: ${PROFILE.phone}`,
    `LinkedIn: ${PROFILE.linkedin}`,
    `GitHub: ${PROFILE.github}`,
    `Resume: ${PROFILE.resumeUrl}`,
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

export function formatWorkstreams(lane: 'active' | 'archive' | 'all'): string {
  return EXPERIENCES.filter((exp) => lane === 'all' || exp.lane === lane)
    .map((exp) => `- **${exp.company}** — ${exp.role} (${exp.period})${exp.employmentType ? ` · ${exp.employmentType}` : ''}`)
    .join('\n');
}

/**
 * Every role and project that lists a technology in its stack or mentions it in its
 * write-up, with the page card id to link. Lets "where has he used X" be answered
 * from one lookup instead of reading every role.
 */
export function formatWorkByTech(tech: string): string {
  const needle = tech.trim().toLowerCase();
  if (!needle) return 'Give a technology to look for.';
  const mentions = (tags: string[], text: string[]) =>
    tags.some((tag) => tag.toLowerCase().includes(needle)) || text.some((line) => line.toLowerCase().includes(needle));
  const roles = EXPERIENCES.filter((exp) => mentions(exp.tech, exp.description)).map(
    (exp) => `- **${exp.company}** — ${exp.role} (${exp.period}) · card id exp-${exp.id} · stack: ${exp.tech.join(', ')}`,
  );
  const projects = PROJECTS.filter((project) => mentions(project.tech, project.bullets ?? [project.description])).map(
    (project) => `- **${project.title}** — ${project.subtitle ?? 'project'}${project.period ? ` (${project.period})` : ''}${project.type === 'live-demo' ? '' : ` · card id project-${project.id}`} · stack: ${project.tech.join(', ')}`,
  );
  if (roles.length + projects.length === 0) return `Nothing in his roles or projects mentions ${tech}.`;
  return [
    `Work that uses or mentions ${tech} (${roles.length + projects.length} in total; name every one):`,
    ...(roles.length ? ['Roles:', ...roles] : []),
    ...(projects.length ? ['Projects:', ...projects] : []),
  ].join('\n');
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
  if (/open.?source|codex shared memory|shared memory|pptx/.test(q)) {
    ['codex-shared-memory', 'pptx-react-renderer'].forEach((id) => {
      const text = formatProject(id);
      if (text) parts.push(text);
    });
  }
  if (/foodly/.test(q)) {
    const text = formatProject('foodly');
    if (text) parts.push(text);
  }
  if (/parkalong|parking/.test(q)) {
    const text = formatProject('parkalong');
    if (text) parts.push(text);
  }
  if (/(available|availability|graduate|december|dec 2026|melbourne|location)/.test(q)) {
    parts.push([`**${PROFILE.location}**`, PROFILE.availability].join('\n\n'));
  }
  if (/educat|swinburne|degree|grades?|marks?|distinction/.test(q)) {
    parts.push(
      `**${EDUCATION.degree}**, ${EDUCATION.school}, ${EDUCATION.campus}. Graduating ${EDUCATION.graduating}.`,
      `High Distinctions: ${EDUCATION.distinctions.map((item) => `${item.unit} (${item.mark})`).join(', ')}.`,
    );
  }
  if (/skill|stack|agentic|worktree/.test(q) && parts.length === 0) {
    parts.push(SKILLS.map((cluster) => `**${cluster.label}**: ${cluster.items.join(', ')}`).join('\n'));
  }

  if (parts.length > 0) {
    return parts.join('\n\n');
  }

  return [
    `Sidhaarth Krishnan is a software engineer in ${PROFILE.location}.`,
    PROFILE.availability,
    'Current work: **Kenspire Advisors**, **Besmak Components** and **Complete Leader**. Projects include **Foodly** and **ParkAlong**, plus open source: **Codex Shared Memory** and **pptx-react-renderer**.',
    'Ask about a company, project, skills, or availability for specifics.',
  ].join('\n\n');
}
