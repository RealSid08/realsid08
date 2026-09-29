import React, { useState } from 'react';
import type { UIMessage } from 'ai';
import { EXPERIENCES, PROJECTS } from '../../constants';

type ToolPart = { type: string; state?: string; input?: Record<string, unknown>; output?: unknown };

const nameOf = (id: unknown) => {
  const value = String(id ?? '');
  const bare = value.replace(/^(exp|project)-/, '');
  return (
    EXPERIENCES.find((exp) => exp.id === bare)?.company ??
    PROJECTS.find((project) => project.id === bare)?.title ??
    bare
  );
};

const repoOf = (input: Record<string, unknown>) =>
  [input.account ?? 'RealSid08', input.repo].filter(Boolean).join('/');

const SEARCH_LABEL = { pulls: 'pull requests', issues: 'issues', code: 'code' } as const;

/** The web_search output carries what was searched or opened; input is empty. */
const webAction = (output: unknown) => {
  const action = (output as { action?: { type?: string; query?: string; queries?: string[]; url?: string | null } } | undefined)?.action;
  if (action?.type === 'openPage' && action.url) return `Opened ${hostOf(action.url)}`;
  const query = action?.query ?? action?.queries?.[0];
  return query ? `Searched the web for “${query}”` : 'Searched the web';
};

const hostOf = (url: string) => {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
};

/** Plain-language label for a tool call, and whether it changed the page. */
const describe = (tool: string, input: Record<string, unknown> = {}, output?: unknown): { label: string; page: boolean } => {
  switch (tool) {
    case 'lookupRole': return { label: `Read ${nameOf(input.id)}`, page: false };
    case 'lookupProject': return { label: `Read ${nameOf(input.id)}`, page: false };
    case 'lookupSkills': return { label: input.cluster ? `Read ${input.cluster} skills` : 'Read skills', page: false };
    case 'lookupProfile': return { label: 'Read profile', page: false };
    case 'listWorkstreams': return { label: 'Listed roles', page: false };
    case 'lookupGitHub': return { label: `GitHub ${repoOf(input)}`, page: false };
    case 'browseGitHubCode': return { label: `Read ${repoOf(input)}${input.path ? `/${input.path}` : ''}`, page: false };
    case 'lookupGitHubIssues': return { label: `Issues in ${repoOf(input)}`, page: false };
    case 'lookupGitHubPullRequests': return { label: `Pull requests in ${repoOf(input)}`, page: false };
    case 'searchGitHub': {
      const what = SEARCH_LABEL[input.kind as keyof typeof SEARCH_LABEL] ?? 'GitHub';
      return { label: `Searched ${what}${input.query ? ` for “${input.query}”` : ''}`, page: false };
    }
    case 'web_search': return { label: webAction(output), page: false };
    case 'navigate_to': return { label: `Scrolled to ${nameOf(input.section)}`, page: true };
    case 'highlight': return { label: `Pointed at ${nameOf(input.target)}`, page: true };
    case 'focus_mode': return { label: input.target ? `Focused ${nameOf(input.target)}` : 'Focused the page', page: true };
    case 'expand_card': return { label: `${input.expanded === false ? 'Closed' : 'Opened'} ${nameOf(input.target)}`, page: true };
    case 'filter_work': return { label: `Filtered to ${[input.year, input.tech, input.query].filter(Boolean).join(', ') || 'all work'}`, page: true };
    case 'sort_work': return { label: `Sorted by ${input.by}`, page: true };
    case 'set_theme': return { label: `Switched to ${input.theme}`, page: true };
    case 'set_visibility': return { label: `${input.visible ? 'Showed' : 'Hid'} ${input.section}`, page: true };
    case 'walkthrough': return { label: input.action === 'stop' ? 'Stopped the tour' : 'Started a tour', page: true };
    case 'reset_view': return { label: 'Reset the page', page: true };
    default: return { label: tool, page: false };
  }
};

export const toolPartsOf = (message: UIMessage) =>
  (message.parts ?? []).filter((part) => part.type.startsWith('tool-')) as ToolPart[];

const Glyph: React.FC<{ state?: string; page: boolean }> = ({ state, page }) => {
  if (state === 'output-error') return <span className="text-gray-400">×</span>;
  if (state !== 'output-available') return <span className="inline-block size-1.5 animate-pulse rounded-full bg-gray-400" />;
  return <span className={page ? 'text-white' : 'text-gray-500'}>{page ? '↳' : '·'}</span>;
};

/** The lookups and page moves behind an answer, shown as a short work log. */
export const AgentSteps: React.FC<{ message: UIMessage; streaming: boolean }> = ({ message, streaming }) => {
  const [expanded, setExpanded] = useState(false);
  const parts = toolPartsOf(message);
  if (parts.length === 0) return null;

  const steps = parts.map((part) => ({ ...describe(part.type.replace(/^tool-/, ''), part.input, part.output), state: part.state }));
  const reads = steps.filter((step) => !step.page);
  const moves = steps.filter((step) => step.page);
  const collapsed = !streaming && !expanded && reads.length > 2;
  const visible = collapsed ? moves : steps;

  return (
    <div className="mb-1.5 space-y-0.5 font-mono text-[11px] leading-5">
      {collapsed && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex items-center gap-1.5 text-gray-500 hover:text-white"
        >
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
