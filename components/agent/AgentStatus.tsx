import React, { useEffect, useRef, useState } from 'react';
import {
  onActions,
  onExternalAgent,
  onTour,
  setExternalAgent,
  undoAll,
  walkthrough,
  type ActionRecord,
  type TourState,
} from '../../services/agent/actions';
import { EXPERIENCES, PROJECTS } from '../../constants';

const cardName = (id: string) => {
  const bare = id.replace(/^(exp|project)-/, '');
  return EXPERIENCES.find((exp) => exp.id === bare)?.company ?? PROJECTS.find((project) => project.id === bare)?.title ?? bare;
};

const chip = 'font-mono text-[10px] uppercase tracking-[0.14em] text-gray-300 hover:text-white px-1.5 py-0.5';
const surface = 'card-surface pointer-events-auto flex items-center gap-2 border border-white/15 bg-black/95 px-3 py-1.5 backdrop-blur-md';

/**
 * What the assistant (or a command) just did to the page, with a way back.
 * Shows the latest change briefly, the tour controls while a tour runs, and a
 * banner when an external agent is driving the page over WebMCP.
 */
export const AgentStatus: React.FC = () => {
  const [latest, setLatest] = useState<ActionRecord | null>(null);
  const [count, setCount] = useState(0);
  const [tour, setTour] = useState<TourState>(null);
  const [external, setExternal] = useState(false);
  const lastId = useRef<string | null>(null);

  useEffect(() => onExternalAgent(setExternal), []);
  useEffect(() => onTour(setTour), []);

  useEffect(() => {
    let timer: number | undefined;
    const unsubscribe = onActions((records) => {
      setCount(records.length);
      const head = records[0] ?? null;
      if (!head) {
        setLatest(null);
        return;
      }
      if (head.id === lastId.current) return;
      lastId.current = head.id;
      setLatest(head);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setLatest(null), 5000);
    });
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!tour) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
      if (event.key === 'ArrowRight') walkthrough('next');
      if (event.key === 'ArrowLeft') walkthrough('prev');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tour]);

  return (
    <div aria-live="polite" className="flex flex-col items-stretch gap-2 empty:hidden">
      {external && (
        <div className={surface}>
          <p className="flex-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white">An agent is controlling this page</p>
          <button type="button" onClick={() => setExternalAgent(false)} className={`${chip} border border-white/40`}>
            Stop
          </button>
        </div>
      )}

      {tour ? (
        <div className={surface}>
          <p className="min-w-0 flex-1 truncate text-[12px] text-gray-300">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-500">Tour {tour.step}/{tour.of}</span>{' '}
            {cardName(tour.target)}
          </p>
          <button type="button" onClick={() => walkthrough('prev')} disabled={tour.step === 1} aria-label="Previous card" className={`${chip} disabled:opacity-30`}>
            ←
          </button>
          <button type="button" onClick={() => walkthrough('next')} disabled={tour.step === tour.of} aria-label="Next card" className={`${chip} disabled:opacity-30`}>
            →
          </button>
          <button type="button" onClick={() => walkthrough('stop')} className={chip}>
            End
          </button>
        </div>
      ) : (
        latest && (
          <div className={surface}>
            <p className="min-w-0 flex-1 truncate text-[12px] text-gray-300">
              <span className="text-white">↳</span> {latest.label.replace(/(exp|project)-[a-z-]+/g, cardName)}
            </p>
            {latest.undo && (
              <button
                type="button"
                onClick={() => {
                  latest.undo?.();
                  setLatest(null);
                }}
                className={chip}
              >
                Undo
              </button>
            )}
            {count > 1 && (
              <button type="button" onClick={() => undoAll()} className={chip}>
                Reset page
              </button>
            )}
          </div>
        )
      )}
    </div>
  );
};
