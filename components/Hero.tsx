import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { EXPERIENCES, PROFILE, WORKTREE_IDS } from '../constants';
import { ExperienceItem } from '../types';
import { FadeInSection } from './FadeInSection';

const hashOf = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(7, '0').slice(0, 7);
};

const RAIL_W = 56;
const LANE_X = [14, 28, 42];

const useReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
};

/**
 * Live worktrees as a `git log --graph`: one lane per contract, each lane
 * merging into main at the foot of the panel. Hovering a row "checks it out".
 */
const WorktreeGraph: React.FC<{ processes: ExperienceItem[] }> = ({ processes }) => {
  const [checkedOut, setCheckedOut] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const mainRef = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<{ h: number; rows: number[]; main: number } | null>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const measure = () => {
      const top = panel.getBoundingClientRect().top;
      const rows = rowRefs.current.map((el) => {
        if (!el) return 0;
        const r = el.getBoundingClientRect();
        return Math.round(r.top - top + 22);
      });
      const m = mainRef.current?.getBoundingClientRect();
      setGeo({ h: Math.round(panel.getBoundingClientRect().height), rows, main: m ? Math.round(m.top - top + m.height / 2) : 0 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(panel);
    return () => ro.disconnect();
  }, [processes.length]);

  const lanePath = (i: number, y0: number, mainY: number) => {
    const x = LANE_X[i] + 0.5;
    const mx = LANE_X[0] + 0.5;
    if (i === 0) return `M${x},${y0} L${x},${mainY}`;
    const bend = mainY - 26;
    return `M${x},${y0} L${x},${bend} C${x},${bend + 16} ${mx},${bend + 10} ${mx},${mainY}`;
  };

  return (
    <div className="font-mono">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-3 px-1">
        <span>git worktree list</span>
        <span className="flex items-center gap-2 text-white/80">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse motion-reduce:animate-none" aria-hidden="true" />
          {processes.length} running
        </span>
      </div>

      <div
        ref={panelRef}
        className="relative border border-white/15 bg-[#050505] bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:14px_14px]"
      >
        {geo && (
          <svg className="pointer-events-none absolute left-0 top-0" width={RAIL_W} height={geo.h} aria-hidden="true">
            {processes.map((proc, i) => {
              const y0 = geo.rows[i] ?? 0;
              const on = checkedOut === proc.id;
              const d = lanePath(i, y0, geo.main);
              return (
                <g key={proc.id}>
                  <path d={d} fill="none" stroke={on ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.18)'} strokeWidth={1} />
                  {!reduced && (
                    <rect width={3} height={3} x={-1.5} y={-1.5} fill={on ? '#fff' : 'rgba(255,255,255,0.7)'}>
                      <animateMotion dur={`${3.2 + i * 0.6}s`} begin={`${i * 0.9}s`} repeatCount="indefinite" path={d} />
                    </rect>
                  )}
                </g>
              );
            })}
            {processes.map((proc, i) => {
              const y = geo.rows[i] ?? 0;
              const on = checkedOut === proc.id;
              return (
                <g key={`${proc.id}-node`}>
                  <line x1={LANE_X[i] + 0.5} y1={y + 0.5} x2={RAIL_W} y2={y + 0.5} stroke="rgba(255,255,255,0.12)" />
                  <rect x={LANE_X[i] - 3} y={y - 3} width={7} height={7} fill={on ? '#fff' : '#050505'} stroke="#fff" strokeWidth={1} />
                </g>
              );
            })}
            <rect x={LANE_X[0] - 3} y={geo.main - 3} width={7} height={7} fill="#fff" />
          </svg>
        )}

        <ul style={{ paddingLeft: RAIL_W }} className="divide-y divide-white/10">
          {processes.map((proc, i) => {
            const isOut = checkedOut === proc.id;
            const since = proc.period.split('–')[0].trim();
            return (
              <li key={proc.id}>
                <a
                  ref={(el) => {
                    rowRefs.current[i] = el;
                  }}
                  href={`#exp-${proc.id}`}
                  onMouseEnter={() => setCheckedOut(proc.id)}
                  onMouseLeave={() => setCheckedOut(null)}
                  onFocus={() => setCheckedOut(proc.id)}
                  onBlur={() => setCheckedOut(null)}
                  className={`group block pr-4 py-3.5 transition-colors duration-300 ${isOut ? 'bg-white text-black' : 'hover:bg-white/[0.03]'}`}
                >
                  <div className="flex items-center justify-between gap-3 text-[9px] uppercase tracking-[0.25em]">
                    <span className={isOut ? 'text-black/60' : 'text-gray-500'}>
                      wt/{proc.id} <span className={isOut ? 'text-black/40' : 'text-gray-700'}>· {hashOf(proc.id + proc.company)}</span>
                    </span>
                    <span className={`flex items-center gap-1.5 ${isOut ? 'text-black' : 'text-white/80'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isOut ? 'bg-black' : 'bg-green-400'}`} aria-hidden="true" />
                      {isOut ? 'checked out' : 'running'}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-end justify-between gap-4">
                    <p className="font-display font-bold text-lg md:text-xl leading-none tracking-tight">{proc.company}</p>
                    <span className={`hidden sm:block text-[9px] uppercase tracking-[0.2em] shrink-0 ${isOut ? 'text-black/60' : 'text-gray-500'}`}>
                      since {since}
                    </span>
                  </div>
                  <p className={`mt-1.5 text-[10.5px] ${isOut ? 'text-black/70' : 'text-gray-400'}`}>
                    {proc.role} · {proc.employmentType}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {proc.tech.slice(0, 4).map((t) => (
                      <span
                        key={t}
                        className={`text-[9px] uppercase tracking-wider border px-1.5 py-0.5 ${
                          isOut ? 'border-black/25 text-black/80' : 'border-white/[0.12] text-gray-400 group-hover:border-white/30'
                        }`}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </a>
              </li>
            );
          })}
        </ul>

        <div ref={mainRef} style={{ paddingLeft: RAIL_W }} className="flex items-center justify-between pr-4 py-2.5 border-t border-white/10 text-[9px] uppercase tracking-[0.25em]">
          <span className="text-white">main</span>
          <span className="text-gray-600">{checkedOut ? `git checkout wt/${checkedOut}` : 'hover a lane to check out'}</span>
        </div>
      </div>
    </div>
  );
};

export const Hero: React.FC = () => {
  const processes = EXPERIENCES.filter((exp) => (WORKTREE_IDS as readonly string[]).includes(exp.id));

  return (
    <header className="relative z-10 min-h-[90vh] md:min-h-screen flex flex-col justify-center px-4 md:px-8 lg:px-12 pt-16 pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto w-full">
        <FadeInSection>
          <h1 className="relative leading-none select-none">
            <span className="block font-display font-extrabold text-[9.5vw] sm:text-6xl md:text-[min(6rem,10.5vw)] lg:text-[clamp(4.4rem,8vw,7rem)] text-white/90 tracking-[-0.06em]">
              {PROFILE.givenName}
            </span>
            <span className="block font-display font-extrabold text-[10.4vw] sm:text-[min(4.5rem,10vw)] md:text-[min(6rem,9.8vw)] lg:text-[clamp(5rem,9.2vw,8rem)] text-white tracking-[-0.07em] -mt-[0.18em] ml-4 sm:ml-10 md:ml-16 lg:ml-24">
              {PROFILE.familyName}
            </span>
          </h1>
        </FadeInSection>

        <div className="mt-10 md:mt-12 grid grid-cols-1 lg:grid-cols-[1fr_minmax(400px,0.9fr)] gap-10 lg:gap-8 items-end">
          <FadeInSection delay={200}>
            <div className="flex flex-wrap gap-3">
              <a href="#experience" className="px-6 py-3 border border-white bg-white text-black hover:bg-transparent hover:text-white transition-colors text-[11px] uppercase tracking-[0.2em] font-mono">
                Workstreams
              </a>
              <a href="#projects" className="px-6 py-3 border border-white/20 hover:border-white hover:bg-white hover:text-black transition-colors text-[11px] uppercase tracking-[0.2em] font-mono">
                Projects
              </a>
              <a href="#aura" className="px-6 py-3 border border-white/10 text-gray-400 hover:text-white hover:border-white/40 transition-colors text-[11px] uppercase tracking-[0.2em] font-mono">
                Aura
              </a>
            </div>
          </FadeInSection>

          <FadeInSection delay={280}>
            <WorktreeGraph processes={processes} />
          </FadeInSection>
        </div>
      </div>
    </header>
  );
};
