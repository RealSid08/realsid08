import React, { type ReactNode } from 'react';

const GitHubMark = () => (
  <svg viewBox="0 0 16 16" className="inline-block size-3 shrink-0" fill="currentColor" aria-hidden="true">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.54 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.65 7.65 0 018 3.34c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

const GlobeMark = () => (
  <svg viewBox="0 0 16 16" className="inline-block size-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <circle cx="8" cy="8" r="6.5" /><path d="M1.5 8h13M8 1.5c2 2 3 4.2 3 6.5s-1 4.5-3 6.5c-2-2-3-4.2-3-6.5s1-4.5 3-6.5z" />
  </svg>
);

const safeHref = (href?: string) => {
  if (!href) return null;
  if (href.startsWith('#') || (href.startsWith('/') && !href.startsWith('//'))) return href;
  try {
    const url = new URL(href);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch { return null; }
};

export function PortfolioLink({ href, children }: { href?: string; children: ReactNode }) {
  const target = safeHref(href);
  if (!target) return <span>{children}</span>;
  const external = target.startsWith('http');
  const github = external && new URL(target).hostname === 'github.com';
  return (
    <a href={target} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}
      className="inline text-white underline decoration-white/40 underline-offset-[3px] hover:decoration-white [overflow-wrap:anywhere]">
      <span className="mr-1 inline-flex align-[-0.125em]">{github ? <GitHubMark /> : <GlobeMark />}</span>
      {typeof children === 'string' && /^https?:\/\//.test(children)
        ? children.split(/(?<=[/?#&=._-])/).map((segment, index) => <React.Fragment key={index}>{segment}<wbr /></React.Fragment>)
        : children}
    </a>
  );
}
