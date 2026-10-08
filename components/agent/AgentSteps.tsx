import React, { useState } from 'react';
import type { UIMessage } from 'ai';
import { EXPERIENCES, PROJECTS } from '../../constants';
import { targetName } from '../../lib/portfolioIds';

type ToolPart = { type: string; state?: string; input?: Record<string, unknown>; output?: unknown };

const nameOf = (id: unknown) => {
  const value = String(id ?? '');
  return EXPERIENCES.find((exp) => exp.id === value)?.company ?? PROJECTS.find((project) => project.id === value)?.title ?? value;
};

const hostOf = (url: string) => {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
};

/** The web_search output carries what was searched or opened; input is empty. */
const webAction = (output: unknown) => {
  const action = (output as { action?: { type?: string; query?: string; queries?: string[]; url?: string | null } } | undefined)?.action;
  if (action?.type === 'openPage' && action.url) return `Opened ${hostOf(action.url)}`;
  const query = action?.query ?? action?.queries?.[0];
  return query ? `Searched the web for “${query}”` : 'Searched the web';
};

const arg = (call: string, key: string) => new RegExp(`${key}\\s*:\\s*['"\`]([^'"\`]+)`).exec(call)?.[1];

/**
 * A code-mode program, summarised from the host tools it calls:
 * `tools.lookupProject({ id: 'foodly' })` becomes "Read Foodly".
 */
export const describeCode = (js: unknown): string[] => {
  const source = String(js ?? '');
  const calls = Array.from(source.matchAll(/tools(?:\.(\w+)|\[['"]([\w-]+)['"]\])\s*\(([^)]*)\)/g)).map((match) => ({ name: match[1] ?? match[2], call: match[3] ?? '' }));
  const read: string[] = [];
  const lines: string[] = [];
  calls.forEach(({ name, call }) => {
    if (name === 'lookupRole' || name === 'lookupProject') { const id = arg(call, 'id'); if (id) read.push(nameOf(id)); }
    else if (name === 'listWork') lines.push('Read the index of his work');
    else if (name === 'search') lines.push(`Looked for a tool${arg(call, 'query') ? ` to ${arg(call, 'query')}` : ''}`);
    else if (name === 'findWorkByTech') lines.push(`Checked his work for ${arg(call, 'tech') ?? 'a technology'}`);
    else if (name === 'lookupSkills') lines.push('Read his skills');
    else if (name === 'lookupProfile') lines.push('Read his profile');
    else if (name === 'lookupGitHub') lines.push(`GitHub ${[arg(call, 'account') ?? 'RealSid08', arg(call, 'repo')].filter(Boolean).join('/')}`);
    else if (name === 'browseGitHubCode') lines.push(`Read ${[arg(call, 'repo'), arg(call, 'path')].filter(Boolean).join('/')}`);
    else if (name === 'lookupGitHubIssues') lines.push(`Issues in ${arg(call, 'repo') ?? 'a repo'}`);
    else if (name === 'lookupGitHubPullRequests') lines.push(`Pull requests in ${arg(call, 'repo') ?? 'a repo'}`);
    else if (name === 'searchGitHub') lines.push(`Searched GitHub${arg(call, 'query') ? ` for “${arg(call, 'query')}”` : ''}`);
  });
  // Lookups called in a loop, e.g. ids.map((id) => tools.lookupProject({ id })), name their ids in a literal list.
  if (calls.some(({ name, call }) => (name === 'lookupRole' || name === 'lookupProject') && !arg(call, 'id'))) {
    const known = new Set([...EXPERIENCES.map((exp) => exp.id), ...PROJECTS.map((project) => project.id)]);
    Array.from(source.matchAll(/['"`]([a-z0-9-]+)['"`]/g)).forEach((match) => {
      if (known.has(match[1])) read.push(nameOf(match[1]));
    });
  }
  const unique = Array.from(new Set(read.filter((name) => name && name !== 'undefined')));
  if (unique.length) lines.unshift(`Read ${unique.join(', ')}`);
  return lines.length ? Array.from(new Set(lines)) : ['Checked his portfolio'];
};

/** Plain-language labels for a tool call, and whether it moved the notebook. */
const describe = (tool: string, input: Record<string, unknown> = {}, output?: unknown): Array<{ label: string; page: boolean }> => {
  const read = (label: string) => [{ label, page: false }];
  const page = (label: string) => [{ label, page: true }];
  switch (tool) {
    case 'code': return describeCode(input.js).map((label) => ({ label, page: false }));
    case 'search': return read('Looked for the right tool');
    case 'web_search': return read(webAction(output));
    case 'turn_to': return page(`Turned to ${targetName(String(input.target ?? ''))}${input.circle ? ' and circled it' : ''}`);
    case 'mark_work': return page(`Ticked the work that uses ${input.query ?? 'it'}`);
    case 'focus': return page(input.target ? `Focused on ${targetName(String(input.target))}` : 'Focused the page');
    case 'tour': return page(input.action === 'stop' ? 'Ended the tour' : input.action === 'start' ? 'Started a tour' : 'Moved the tour on');
    case 'set_theme': return page(input.theme === 'dark' ? 'Turned the lamp off' : 'Turned the lamp on');
    case 'reset_view': return page('Put the notebook back');
    default: return read(tool);
  }
};

export const toolPartsOf = (message: UIMessage) =>
  (message.parts ?? []).filter((part) => part.type.startsWith('tool-')) as ToolPart[];

const Glyph: React.FC<{ state?: string; page: boolean }> = ({ state, page }) => {
  if (state === 'output-error') return <span className="text-gray-400">×</span>;
  if (state !== 'output-available') return <span className="inline-block size-1.5 animate-pulse rounded-full bg-mono-accent" />;
  return <span className={page ? 'text-mono-accent' : 'text-gray-500'}>{page ? '↳' : '·'}</span>;
};

/** The lookups and page moves behind an answer, as a short work log. */
export const AgentSteps: React.FC<{ message: UIMessage; streaming: boolean }> = ({ message, streaming }) => {
  const [expanded, setExpanded] = useState(false);
  const parts = toolPartsOf(message);
  if (parts.length === 0) return null;

  const steps = parts.flatMap((part) => describe(part.type.replace(/^tool-/, ''), part.input, part.output).map((step) => ({ ...step, state: part.state })));
  const reads = steps.filter((step) => !step.page);
  const moves = steps.filter((step) => step.page);
  const collapsed = !streaming && !expanded && reads.length > 2;
  const visible = collapsed ? moves : steps;

  return (
    <div className="mb-2 space-y-0.5 font-mono text-[11px] leading-5">
      {collapsed && (
        <button type="button" onClick={() => setExpanded(true)} className="flex items-center gap-1.5 text-gray-500 hover:text-white">
          <span>·</span>
          Checked {reads.length} sources
          <span aria-hidden="true">›</span>
        </button>
      )}
      {visible.map((step, index) => (
        <p key={index} className={`flex items-center gap-1.5 ${step.page ? 'text-gray-300' : 'text-gray-500'}`}>
          <span className="grid w-2 place-items-center"><Glyph state={step.state} page={step.page} /></span>
          <span className="truncate">{step.label}</span>
        </p>
      ))}
    </div>
  );
};
