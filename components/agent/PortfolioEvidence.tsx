import React from 'react';
import { defineRegistry } from '@json-render/react';
import { portfolioUiCatalog } from '../../lib/portfolioUiCatalog';
import { isTargetId, targetName } from '../../lib/portfolioIds';
import { runSteps, showOnPage } from '../../services/agent/commands';
import { peek } from '../../services/agent/actions';
import { PortfolioLink } from './PortfolioLink';

const label = 'font-mono text-[9px] uppercase tracking-[0.18em] text-gray-500';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Tool results carry ISO timestamps; show them as "Sep 29, 2026, 09:51 UTC". Anything else passes through. */
export const asOfLabel = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return value;
  const [, year, month, day, hour, minute] = match;
  return `${MONTHS[Number(month) - 1]} ${Number(day)}, ${year}, ${hour}:${minute} UTC`;
};

/** Hover outlines the card on the page; nothing is recorded until the visitor clicks. */
const peekProps = (target: string | null | undefined) =>
  target && isTargetId(target)
    ? { onMouseEnter: () => peek(target), onMouseLeave: () => peek(null) }
    : {};

const ShowButton: React.FC<{ target: string; children?: React.ReactNode }> = ({ target, children }) => (
  <button
    type="button"
    onClick={() => {
      peek(null);
      void showOnPage(target);
    }}
    className="shrink-0 border border-white/20 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-gray-300 transition-colors hover:border-white hover:text-white"
  >
    {children ?? 'Show ↗'}
  </button>
);

export const { registry: portfolioEvidenceRegistry } = defineRegistry(portfolioUiCatalog, {
  components: {
    Stack: ({ children }) => <div className="space-y-2">{children}</div>,
    WorkCard: ({ props, children }) => (
      <section {...peekProps(props.target)} className="mt-2 border border-white/15 bg-white/[0.03] p-2.5" aria-label={props.title}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={label}>{props.meta}</p>
            <strong className="mt-0.5 block text-[13px] text-white">{props.title}</strong>
          </div>
          {isTargetId(props.target) && <ShowButton target={props.target} />}
        </div>
        <p className="mt-1.5 text-[12px] leading-snug text-gray-300">{props.summary}</p>
        {(props.stack ?? []).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {(props.stack ?? []).map((item) => (
              <span key={item} className="border border-white/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-gray-400">{item}</span>
            ))}
          </div>
        )}
        {children && <div className="mt-2 space-y-1.5">{children}</div>}
      </section>
    ),
    Metric: ({ props }) => (
      <div className="min-w-0 border-l border-white/20 pl-2">
        <p className="font-display text-[18px] font-bold leading-none text-white">{props.value}</p>
        <p className="mt-1 text-[10px] leading-snug text-gray-400">{props.label}</p>
      </div>
    ),
    MetricRow: ({ children }) => <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">{children}</div>,
    Compare: ({ props }) => (
      <div className="mt-2 overflow-x-auto border border-white/15">
        <table className="w-full border-collapse text-left text-[11px]">
          <thead>
            <tr className="border-b border-white/15">
              <th className="p-2" />
              {(props.columns ?? []).map((column) => (
                <th key={column.title} {...peekProps(column.target)} className="p-2 align-bottom">
                  {column.target && isTargetId(column.target) ? (
                    <button
                      type="button"
                      onClick={() => void showOnPage(column.target!)}
                      className="text-left text-[12px] font-semibold text-white underline decoration-dotted decoration-white/40 underline-offset-[3px] hover:decoration-white"
                    >
                      {column.title}
                    </button>
                  ) : (
                    <span className="text-[12px] font-semibold text-white">{column.title}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(props.rows ?? []).map((row) => (
              <tr key={row.label} className="border-b border-white/10 last:border-0">
                <th scope="row" className={`${label} p-2 align-top font-normal`}>{row.label}</th>
                {(props.columns ?? []).map((column, index) => (
                  <td key={column.title} className="p-2 align-top leading-snug text-gray-300">{row.values?.[index] ?? '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
    Timeline: ({ props }) => (
      <ol className="mt-2 border-l border-white/15">
        {(props.items ?? []).map((item) => {
          const target = item.target && isTargetId(item.target) ? item.target : null;
          return (
            <li key={`${item.period}-${item.title}`} {...peekProps(target)} className="relative py-1.5 pl-3">
              <span className="absolute -left-[3.5px] top-3 size-1.5 bg-white" aria-hidden="true" />
              <p className={label}>{item.period}</p>
              {target ? (
                <button
                  type="button"
                  onClick={() => void showOnPage(target)}
                  className="text-left text-[12px] font-semibold text-white underline decoration-dotted decoration-white/40 underline-offset-[3px] hover:decoration-white"
                >
                  {item.title}
                </button>
              ) : (
                <p className="text-[12px] font-semibold text-white">{item.title}</p>
              )}
              <p className="text-[11px] leading-snug text-gray-400">{item.note}</p>
            </li>
          );
        })}
      </ol>
    ),
    RepoList: ({ props }) => (
      <div className="mt-2 border border-white/15">
        <p className={`${label} border-b border-white/10 px-2.5 py-1.5`}>Public GitHub · as of {asOfLabel(props.asOf)}</p>
        <ul className="divide-y divide-white/10">
          {(props.repos ?? []).map((repo) => (
            <li key={repo.url} className="px-2.5 py-2">
              <PortfolioLink href={repo.url}>{repo.name}</PortfolioLink>
              <p className="mt-0.5 text-[11px] leading-snug text-gray-400">{repo.description}</p>
              {(repo.language || repo.updated) && (
                <p className="mt-1 font-mono text-[10px] text-gray-500">
                  {[repo.language, repo.updated && `updated ${repo.updated}`].filter(Boolean).join(' · ')}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    ),
    PageButton: ({ props }) => {
      const value = props.value ?? '';
      const target = props.action === 'show' && isTargetId(value) ? value : null;
      if (props.action === 'show' && !target) return null;
      return (
        <button
          type="button"
          {...peekProps(target)}
          onClick={() => {
            peek(null);
            if (target) void showOnPage(target);
            if (props.action === 'filter' && value) void runSteps([{ tool: 'filter_work', args: { query: value } }]);
            if (props.action === 'tour') void runSteps([{ tool: 'walkthrough', args: { action: 'start' } }]);
          }}
          title={target ? `Show ${targetName(target)} on the page` : undefined}
          className="mr-1.5 mt-2 inline-flex items-center gap-1.5 border border-white/25 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-gray-200 transition-colors hover:border-white hover:text-white"
        >
          {props.label}
        </button>
      );
    },
    EvidenceBoard: ({ props, children }) => (
      <section className="mt-2 border border-white/15 bg-white/[0.03] p-2.5" aria-label={props.title}>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 border-b border-white/10 pb-1.5">
          <strong className="text-[12px] text-white">{props.title}</strong>
          <span className={label}>{asOfLabel(props.asOf)}</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">{children}</div>
      </section>
    ),
    EvidenceItem: ({ props, children }) => (
      <div className="min-w-0 border-l-2 border-white/30 px-2 py-1.5">
        <span className={label}>{props.kind}</span>
        <strong className="block text-[12px] text-white">{props.title}</strong>
        <p className="mt-0.5 text-[11px] leading-snug text-gray-400">{props.summary}</p>
        {children && <div className="mt-1.5 space-y-1">{children}</div>}
      </div>
    ),
    Fact: ({ props }) => (
      <p className="text-[11px] leading-snug text-gray-300"><span className="text-gray-500">{props.label}: </span>{props.value}</p>
    ),
    SourceLink: ({ props }) => <p className="text-[11px]"><PortfolioLink href={props.url}>{props.label}</PortfolioLink></p>,
  },
});
