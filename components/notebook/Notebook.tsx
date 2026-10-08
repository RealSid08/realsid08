import React, { useEffect, useRef, useState } from 'react';
import { setNotebook } from '../../services/notebook';
import { useTheme } from '../../services/theme';
import { NotebookEngine, type NotebookState } from './engine';
import { HomeIcon } from './icons';
import { PAGES, type Page } from './pages';

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
            style={{ top: 22 + tabIndex * 75, '--c': front.color } as React.CSSProperties}
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
  const [theme, setTheme] = useTheme();

  useEffect(() => {
    const el = Object.fromEntries(Object.entries(refs).map(([key, ref]) => [key, ref.current])) as Record<keyof typeof refs, HTMLDivElement>;
    const instance = new NotebookEngine(el);
    engine.current = instance;
    setNotebook(instance);
    const unsubscribe = instance.subscribe(setState);
    // A #p<number> link opens the notebook at that page.
    const match = /^#p(\d+)$/.exec(window.location.hash);
    if (match) {
      const page = Number(match[1]);
      void instance.go(page % 2 ? (page + 1) / 2 : page / 2, page);
    }
    return () => {
      unsubscribe();
      setNotebook(null);
      instance.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <div className="fit" ref={refs.fit}>
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
        <nav className="ctrl" aria-label="Turn pages">
          <button type="button" onClick={() => engine.current?.next(-1)} disabled={!state?.canGoBack} aria-label="Previous page">←</button>
          <span className="where" aria-live="polite">{state?.label ?? 'Cover'}</span>
          <button type="button" onClick={() => engine.current?.next(1)} disabled={!state?.canGoForward} aria-label="Next page">→</button>
          <button type="button" onClick={() => void engine.current?.home()} aria-label="Home: contents" title="Home"><HomeIcon /></button>
          <span className="tip">{state?.solo ? 'swipe or tap to turn' : 'click a page · drag a corner · ← →'}</span>
        </nav>
      </main>
    </div>
  );
};
