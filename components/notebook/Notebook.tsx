import React, { useEffect, useRef, useState } from 'react';
import { setNotebook } from '../../services/notebook';
import { useTheme } from '../../services/theme';
import { NotebookEngine, type NotebookState } from './engine';
import { HomeIcon } from './icons';
import { PAGES, type Page } from './pages';
import { useLightbox } from './Lightbox';

const PageFace: React.FC<{ page: Page; index: number; side: 'front' | 'back' }> = ({ page, index, side }) => (
  <div className={`face ${side}`}>
    <section
      className={`pg${page.className ? ` ${page.className}` : ''}`}
      data-page={index}
      data-name={page.name}
      data-target={page.target}
      aria-label={page.className === 'cover' ? page.name : `${page.name}, page ${index}`}
      style={page.color ? ({ '--c': page.color } as React.CSSProperties) : undefined}
    >
      {page.content}
      {index > 0 && index < PAGES.length - 1 && <span className="folio" aria-hidden="true">{index}</span>}
    </section>
  </div>
);

/** The leaves never re-render: the engine owns every class and style that moves. */
const TAB_COUNT = PAGES.filter((page) => page.tab).length;
/** Tabs share the page edge: 75px apart, closer when there are more of them. */
const TAB_STEP = Math.min(75, Math.floor(620 / TAB_COUNT));
const TAB_TOP = TAB_STEP < 75 ? 12 : 22;

const Book = React.memo(function Book() {
  let tabs = 0;
  const leaves = [];
  for (let i = 0; i < PAGES.length / 2; i += 1) {
    const front = PAGES[2 * i];
    const back = PAGES[2 * i + 1];
    const tabIndex = front.tab ? tabs++ : -1;
    leaves.push(
      <div className="leaf" key={i}>
        <PageFace page={front} index={2 * i} side="front" />
        <PageFace page={back} index={2 * i + 1} side="back" />
        {front.tab && (
          <a
            className="tab"
            href={`#p${2 * i}`}
            data-go={i}
            aria-label={`Turn to ${front.tab}`}
            style={{ top: TAB_TOP + tabIndex * TAB_STEP, height: TAB_STEP - 5, '--c': front.color } as React.CSSProperties}
          >
            <span>{front.tab}</span>
            <span className="b" aria-hidden="true">{front.tab}</span>
          </a>
        )}
      </div>,
    );
  }
  return <>{leaves}</>;
});

/** Where a visitor left off, kept in their browser so a return visit can offer it back. */
const BOOKMARK_KEY = 'realsid08:notebook:last-page';
type Bookmark = { page: number; name: string };

const readBookmark = (): Bookmark | null => {
  try {
    const saved = JSON.parse(localStorage.getItem(BOOKMARK_KEY) ?? 'null') as Bookmark | null;
    return saved && Number.isInteger(saved.page) && saved.page > 2 && saved.page < PAGES.length - 1 ? saved : null;
  } catch {
    return null;
  }
};

/**
 * The assistant's composer loads after the book. Reserve its room before the first render (the same rule
 * AgentBar uses), so the book is laid out once, at its final size, instead of shrinking while it rests.
 */
if (typeof document !== 'undefined') {
  const root = document.documentElement.style;
  if (!root.getPropertyValue('--agent-bottom')) {
    let closed = false;
    try { closed = localStorage.getItem('agent-closed') === 'true'; } catch { /* storage off */ }
    root.setProperty('--agent-bottom', !closed && window.innerWidth >= 640 ? '64px' : '0px');
  }
}

/** The arrival: the closed book is set down, rests, its cover lifts, then it opens. */
const SET_DOWN_MS = 900;
const REST_MS = 1000;
const LIFT_MS = 450;

const LampIcon: React.FC<{ on: boolean }> = ({ on }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 3h8l3 7H5z" fill={on ? 'currentColor' : 'none'} fillOpacity={on ? 0.25 : 0} />
    <path d="M12 10v8M8 21h8" />
  </svg>
);

export const Notebook: React.FC = () => {
  const refs = {
    desk: useRef<HTMLDivElement>(null),
    stage: useRef<HTMLDivElement>(null),
    fit: useRef<HTMLDivElement>(null),
    canvas: useRef<HTMLDivElement>(null),
    shift: useRef<HTMLDivElement>(null),
    shadow: useRef<HTMLDivElement>(null),
    edgeL: useRef<HTMLDivElement>(null),
    edgeR: useRef<HTMLDivElement>(null),
    ribbon: useRef<HTMLDivElement>(null),
    book: useRef<HTMLDivElement>(null),
  };
  const engine = useRef<NotebookEngine | null>(null);
  const [state, setState] = useState<NotebookState | null>(null);
  const [bookmark, setBookmark] = useState<Bookmark | null>(null);
  const [arrived, setArrived] = useState(false);
  const [theme, setTheme] = useTheme();
  const lightbox = useLightbox(refs.book);

  useEffect(() => {
    const el = Object.fromEntries(Object.entries(refs).map(([key, ref]) => [key, ref.current])) as Record<keyof typeof refs, HTMLDivElement>;
    const instance = new NotebookEngine(el);
    engine.current = instance;
    setNotebook(instance);
    const unsubscribe = instance.subscribe(setState);
    const saved = readBookmark();
    // Remember the page in view, past the opening spread, for the next visit.
    const unsave = instance.subscribe((next) => {
      const page = next.solo ? next.page : 2 * next.spread - 1;
      if (page > 2 && page < PAGES.length - 1) {
        try { localStorage.setItem(BOOKMARK_KEY, JSON.stringify({ page, name: PAGES[page].name })); } catch { /* storage off */ }
      }
    });
    // A #p<number> link opens the notebook at that page; otherwise it falls open at the first page.
    const match = /^#p(\d+)$/.exec(window.location.hash);
    const timers: number[] = [];
    const after = (ms: number, run: () => void) => timers.push(window.setTimeout(run, ms));
    // Show the book only once the engine has laid it out, so nothing flashes before it is set down.
    requestAnimationFrame(() => setArrived(true));
    if (match) {
      const page = Number(match[1]);
      after(SET_DOWN_MS * 0.6, () => void instance.go(page % 2 ? (page + 1) / 2 : page / 2, page));
    } else {
      after(SET_DOWN_MS + REST_MS, () => refs.book.current?.classList.add('lift'));
      after(SET_DOWN_MS + REST_MS + LIFT_MS, () => {
        refs.book.current?.classList.remove('lift');
        void instance.openCover().then(() => setBookmark(saved));
      });
    }
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      unsave();
      unsubscribe();
      setNotebook(null);
      instance.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once the visitor reaches the bookmarked page by any route, the bookmark has done its job.
  useEffect(() => {
    if (bookmark && state && (state.solo ? state.page === bookmark.page : 2 * state.spread - 1 === bookmark.page || 2 * state.spread === bookmark.page)) setBookmark(null);
  }, [bookmark, state]);

  const lampOn = theme === 'light';

  return (
    <div className="nb-desk" ref={refs.desk}>
      <button
        type="button"
        className="lamp"
        onClick={() => setTheme(lampOn ? 'dark' : 'light')}
        aria-label={lampOn ? 'Turn the desk lamp off (dark mode)' : 'Turn the desk lamp on (light mode)'}
        title={lampOn ? 'Lamp off' : 'Lamp on'}
      >
        <LampIcon on={lampOn} />
      </button>
      <main className="nb-stage" ref={refs.stage} aria-label="Sidhaarth Krishnan’s portfolio notebook">
        <div className={`fit${arrived ? ' arrived' : ''}`} ref={refs.fit}>
          <div className="canvas" ref={refs.canvas}>
            <div className="pencil" aria-hidden="true" />
            <div className="shift" ref={refs.shift}>
              <div className="shadow" ref={refs.shadow} />
              <div className="edge l" ref={refs.edgeL} />
              <div className="edge r" ref={refs.edgeR} />
              <div className="book" ref={refs.book}><Book /></div>
              <div className="ribbon" ref={refs.ribbon} />
            </div>
          </div>
        </div>
        {bookmark && (
          <div className="bookmark" role="status">
            <button
              type="button"
              className="bookmark-go"
              onClick={() => {
                const { page } = bookmark;
                setBookmark(null);
                void engine.current?.go(page % 2 ? (page + 1) / 2 : page / 2, page);
              }}
            >
              <span className="hw">you left off at</span>
              <b>{bookmark.name}</b>
              <small>p. {bookmark.page} →</small>
            </button>
            <button type="button" className="bookmark-x" onClick={() => setBookmark(null)} aria-label="Dismiss bookmark">×</button>
          </div>
        )}
        <nav className="ctrl" aria-label="Turn pages">
          <button type="button" onClick={() => engine.current?.next(-1)} disabled={!state?.canGoBack} aria-label="Previous page">←</button>
          <span className="where" aria-live="polite">{state?.label ?? 'Cover'}</span>
          <button type="button" onClick={() => engine.current?.next(1)} disabled={!state?.canGoForward} aria-label="Next page">→</button>
          <button type="button" onClick={() => void engine.current?.home()} aria-label="Home: contents" title="Home"><HomeIcon /></button>
          <button type="button" className="lamp-inline" onClick={() => setTheme(lampOn ? 'dark' : 'light')} aria-label={lampOn ? 'Turn the desk lamp off (dark mode)' : 'Turn the desk lamp on (light mode)'} title={lampOn ? 'Lamp off' : 'Lamp on'}><LampIcon on={lampOn} /></button>
          <span className="tip">{state?.solo ? 'swipe or tap to turn' : 'click a page · drag a corner · ← →'}</span>
        </nav>
      </main>
      {lightbox}
    </div>
  );
};
