import { defineRegistry } from '@json-render/react';
import { portfolioUiCatalog } from '../../lib/portfolioUiCatalog';
import { PortfolioLink } from './PortfolioLink';

export const { registry: portfolioEvidenceRegistry } = defineRegistry(portfolioUiCatalog, {
  components: {
    EvidenceBoard: ({ props, children }) => (
      <section className="mt-2 border border-white/20 bg-white/[0.04] p-2.5" aria-label={props.title}>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 border-b border-white/10 pb-1.5">
          <strong className="text-[12px] text-white">{props.title}</strong>
          <span className="font-mono text-[9px] uppercase tracking-wider text-gray-500">{props.asOf}</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">{children}</div>
      </section>
    ),
    EvidenceItem: ({ props, children }) => (
      <div className="min-w-0 border-l-2 border-white/30 bg-black/20 px-2 py-1.5">
        <span className="font-mono text-[9px] uppercase tracking-wider text-gray-500">{props.kind}</span>
        <strong className="block text-[12px] text-white">{props.title}</strong>
        <p className="mt-0.5 text-[11px] leading-snug text-gray-400">{props.summary}</p>
        {children && <div className="mt-1.5 space-y-1">{children}</div>}
      </div>
    ),
    Fact: ({ props }) => (
      <p className="text-[10px] leading-snug text-gray-400"><span className="text-gray-500">{props.label}: </span>{props.value}</p>
    ),
    SourceLink: ({ props }) => <p className="text-[10px]"><PortfolioLink href={props.url}>{props.label}</PortfolioLink></p>,
  },
  actions: {},
});
