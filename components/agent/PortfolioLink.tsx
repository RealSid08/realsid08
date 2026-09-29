import React, { useState, type ReactNode } from 'react';
import { isTargetId, targetName } from '../../lib/portfolioIds';
import { showOnPage } from '../../services/agent/commands';
import { peek } from '../../services/agent/actions';

const iconClass = 'inline-block size-3 shrink-0';

const GitHubMark = () => (
  <svg viewBox="0 0 16 16" className={iconClass} fill="currentColor" aria-hidden="true">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.54 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.65 7.65 0 018 3.34c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

const LinkedInMark = () => (
  <svg viewBox="0 0 16 16" className={iconClass} fill="currentColor" aria-hidden="true">
    <path d="M0 1.15C0 .52.52 0 1.17 0h13.66C15.48 0 16 .52 16 1.15v13.7c0 .63-.52 1.15-1.17 1.15H1.17C.52 16 0 15.48 0 14.85V1.15zm4.94 12.24V6.17H2.542v7.22h2.4zM3.74 5.18c.84 0 1.36-.55 1.36-1.25-.01-.71-.52-1.25-1.34-1.25-.82 0-1.36.54-1.36 1.25 0 .7.52 1.25 1.33 1.25h.01zm4.91 8.21V9.36c0-.22.02-.43.08-.59.17-.43.57-.88 1.23-.88.87 0 1.21.66 1.21 1.63v3.87h2.4V9.25c0-2.22-1.18-3.25-2.76-3.25-1.27 0-1.84.7-2.16 1.19v.03h-.02l.02-.03V6.17h-2.4c.03.68 0 7.22 0 7.22h2.4z" />
  </svg>
);

const GlobeMark = () => (
  <svg viewBox="0 0 16 16" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <circle cx="8" cy="8" r="6.5" /><path d="M1.5 8h13M8 1.5c2 2 3 4.2 3 6.5s-1 4.5-3 6.5c-2-2-3-4.2-3-6.5s1-4.5 3-6.5z" />
  </svg>
);

const MailMark = () => (
  <svg viewBox="0 0 16 16" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <rect x="1.5" y="3" width="13" height="10" rx="1" /><path d="M2 4l6 5 6-5" />
  </svg>
);

const DocMark = () => (
  <svg viewBox="0 0 16 16" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M4 1.5h5.5L13 5v9.5H4z" /><path d="M9.5 1.5V5H13M6 8.5h4.5M6 11h4.5" />
  </svg>
);

const PageMark = () => (
  <svg viewBox="0 0 16 16" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M3 3v6.5h9M9 6.5l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Hosts whose favicon failed this session, so they go straight to the globe. */
const failedFavicons = new Set<string>();

const Favicon: React.FC<{ host: string }> = ({ host }) => {
  const [failed, setFailed] = useState(failedFavicons.has(host));
  if (failed) return <GlobeMark />;
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=32`}
      alt=""
      loading="lazy"
      draggable={false}
      className={`${iconClass} rounded-[2px]`}
      onError={() => {
        failedFavicons.add(host);
        setFailed(true);
      }}
    />
  );
};

type Resolved =
  | { kind: 'page'; target: string }
  | { kind: 'internal'; href: string; icon: ReactNode }
  | { kind: 'external'; href: string; host: string; icon: ReactNode; label?: string };

/** A short, readable label for a bare GitHub URL: owner/repo, owner/repo#12, owner/repo/path, or a short sha. */
const githubLabel = (url: URL) => {
  const [owner, repo, kind, ...rest] = url.pathname.split('/').filter(Boolean);
  if (!owner) return 'GitHub';
  if (!repo) return owner;
  const base = `${owner}/${repo}`;
  if ((kind === 'pull' || kind === 'issues') && rest[0]) return `${base}#${rest[0]}`;
  if (kind === 'commit' && rest[0]) return `${base}@${rest[0].slice(0, 7)}`;
  if ((kind === 'blob' || kind === 'tree') && rest.length > 1) return `${repo}/${rest.slice(1).join('/')}`;
  return base;
};

export const resolveHref = (href?: string): Resolved | null => {
  if (!href) return null;
  if (href.startsWith('#')) {
    const target = decodeURIComponent(href.slice(1));
    return isTargetId(target) ? { kind: 'page', target } : null;
  }
  if (href.startsWith('/') && !href.startsWith('//')) {
    return { kind: 'internal', href, icon: /\.pdf$/i.test(href) ? <DocMark /> : <GlobeMark /> };
  }
  if (href.startsWith('mailto:')) {
    return { kind: 'external', href, host: 'mail', icon: <MailMark /> };
  }
  try {
    const url = new URL(href);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'github.com') return { kind: 'external', href: url.href, host, icon: <GitHubMark />, label: githubLabel(url) };
    if (host.endsWith('linkedin.com')) return { kind: 'external', href: url.href, host, icon: <LinkedInMark /> };
    return { kind: 'external', href: url.href, host, icon: <Favicon host={host} /> };
  } catch {
    return null;
  }
};

const linkClass =
  'text-white underline decoration-white/35 underline-offset-[3px] transition-colors hover:decoration-white [overflow-wrap:anywhere]';

/** The icon rides on the first character so it never wraps onto a line by itself. */
const WithIcon: React.FC<{ icon: ReactNode; children: ReactNode }> = ({ icon, children }) => {
  if (typeof children === 'string' && children.length > 0) {
    return (
      <>
        <span className="whitespace-nowrap">
          <span className="mr-[0.3em] inline-flex align-[-0.1em]">{icon}</span>
          {children.charAt(0)}
        </span>
        {children.slice(1)}
      </>
    );
  }
  return (
    <>
      <span className="mr-[0.3em] inline-flex align-[-0.1em]">{icon}</span>
      {children}
    </>
  );
};

const plainText = (children: ReactNode): string | null => {
  const parts = React.Children.toArray(children);
  return parts.every((part) => typeof part === 'string') ? parts.join('') : null;
};

/**
 * Links in assistant answers. `#project-foodly` style references drive the page
 * (hover outlines the card, click scrolls to it); GitHub, LinkedIn, mail and the
 * résumé get their own marks; anything else gets its site's favicon. Unknown
 * schemes and unknown page targets render as plain text.
 */
export function PortfolioLink({ href, children }: { href?: string; children: ReactNode }) {
  const resolved = resolveHref(href);
  if (!resolved) return <span>{children}</span>;

  if (resolved.kind === 'page') {
    const { target } = resolved;
    return (
      <a
        href={`#${target}`}
        title={`Show ${targetName(target)} on the page`}
        onMouseEnter={() => peek(target)}
        onMouseLeave={() => peek(null)}
        onFocus={() => peek(target)}
        onBlur={() => peek(null)}
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
          event.preventDefault();
          peek(null);
          void showOnPage(target);
        }}
        className="text-white underline decoration-dotted decoration-white/50 underline-offset-[3px] hover:decoration-solid hover:decoration-white"
      >
        <WithIcon icon={<PageMark />}>{children}</WithIcon>
      </a>
    );
  }

  const text = plainText(children);
  const label = resolved.kind === 'external' && resolved.label && text && /^https?:\/\//.test(text) ? resolved.label : children;

  if (resolved.kind === 'internal') {
    return (
      <a href={resolved.href} target="_blank" rel="noopener" className={linkClass}>
        <WithIcon icon={resolved.icon}>{label}</WithIcon>
      </a>
    );
  }

  const mail = resolved.href.startsWith('mailto:');
  return (
    <a
      href={resolved.href}
      target={mail ? undefined : '_blank'}
      rel={mail ? undefined : 'noopener noreferrer'}
      className={linkClass}
    >
      <WithIcon icon={resolved.icon}>{label}</WithIcon>
    </a>
  );
}
