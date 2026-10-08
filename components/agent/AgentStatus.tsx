import React, { useEffect, useRef, useState } from 'react';
import {
  onActions,
  onExternalAgent,
  onTour,
  setExternalAgent,
  tour as runTour,
  undoAll,
  type ActionRecord,
  type TourState,
} from '../../services/agent/actions';
import { targetName } from '../../lib/portfolioIds';

const chip = 'rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-gray-400 hover:bg-white/[0.07] hover:text-white disabled:opacity-30';
const surface = 'pointer-events-auto flex items-center gap-2 rounded-xl bg-black px-3 py-2 shadow-[0_10px_24px_-12px_rgba(0,0,0,0.7)]';

/**
 * What the assistant (or a command) just did to the notebook, with a way back.
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

  // During a tour the arrow keys step the tour instead of turning single pages.
  useEffect(() => {
    if (!tour) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.stopImmediatePropagation();
      void runTour(event.key === 'ArrowRight' ? 'next' : 'prev');
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [tour]);

  return (
    <div aria-live="polite" className="flex flex-col items-stretch gap-2 empty:hidden">
      {external && (
        <div className={surface}>
          <p className="flex-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white">An agent is turning these pages</p>
          <button type="button" onClick={() => setExternalAgent(false)} className={`${chip} border border-white/30`}>Stop</button>
        </div>
      )}

      {tour ? (
        <div className={surface}>
          <p className="min-w-0 flex-1 truncate text-[12.5px] text-gray-300">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-500">Tour {tour.step}/{tour.of}</span>{' '}
            <span className="text-white">{targetName(tour.target)}</span>
          </p>
          <button type="button" onClick={() => void runTour('prev')} disabled={tour.step === 1} aria-label="Previous stop" className={chip}>←</button>
          <button type="button" onClick={() => void runTour('next')} disabled={tour.step === tour.of} aria-label="Next stop" className={chip}>→</button>
          <button type="button" onClick={() => void runTour('stop')} className={chip}>End</button>
        </div>
      ) : (
        latest && (
          <div className={surface}>
            <p className="min-w-0 flex-1 truncate text-[12.5px] text-gray-300">
              <span className="font-hand text-[17px] leading-none text-mono-accent">✓</span> {latest.label}
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
            {count > 1 && <button type="button" onClick={() => undoAll()} className={chip}>Reset</button>}
          </div>
        )
      )}
    </div>
  );
};
