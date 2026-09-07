import React, { useEffect, useRef, useState } from 'react';
import { SKILLS } from '../constants';
import { SkillCluster } from '../types';
import { FadeInSection } from './FadeInSection';

const EDGES: Array<[string, string]> = [
  ['languages', 'frontend'],
  ['languages', 'agentic'],
  ['frontend', 'agentic'],
  ['backend', 'agentic'],
  ['cloud', 'agentic'],
  ['backend', 'cloud'],
  ['agentic', 'delivery'],
  ['cloud', 'delivery'],
];

/** node centres in % of the desktop board */
const NODE_POS: Record<string, { x: number; y: number }> = {
  languages: { x: 16, y: 22 },
  frontend: { x: 84, y: 22 },
  agentic: { x: 50, y: 40 },
  backend: { x: 16, y: 70 },
  cloud: { x: 84, y: 70 },
  delivery: { x: 50, y: 85 },
};

/** the two horizontal buses the elbows share; junction ticks sit where drops meet them */
const BUS_Y = [22, 70];

const HEAD_ID = 'agentic';

const useSize = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
};

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

export const SkillsMap: React.FC = () => {
  const [active, setActive] = useState<string>(HEAD_ID);
  const [boardRef, board] = useSize<HTMLDivElement>();
  const reduced = useReducedMotion();

  const lit = new Set<string>([active]);
  EDGES.forEach(([a, b]) => {
    if (a === active) lit.add(b);
    if (b === active) lit.add(a);
  });

  const toPx = (id: string) => {
    const p = NODE_POS[id];
    return { x: Math.round((p.x / 100) * board.w) + 0.5, y: Math.round((p.y / 100) * board.h) + 0.5 };
  };
  /** elbow: run along the source row, then drop/rise into the target column */
  const elbow = (a: string, b: string) => {
    const from = toPx(a);
    const to = toPx(b);
    if (from.y === to.y || from.x === to.x) return `M${from.x},${from.y} L${to.x},${to.y}`;
    return `M${from.x},${from.y} L${to.x},${from.y} L${to.x},${to.y}`;
  };
  const isLit = (a: string, b: string) => a === active || b === active;
  const ordered = [...EDGES].sort((e1, e2) => Number(isLit(...e1)) - Number(isLit(...e2)));

  return (
    <section id="skills" className="mb-24 md:mb-40 scroll-mt-16">
      <FadeInSection>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 md:mb-16 border-b border-white/10 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-4">
            <h2 className="text-3xl md:text-4xl font-bold">SKILL GRAPH</h2>
            <span className="text-gray-500 font-mono text-xs md:mb-2">/CTL/CONSTELLATION</span>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-gray-500 flex flex-wrap gap-x-5 gap-y-1 md:justify-end md:mb-2">
            <span>{String(SKILLS.length).padStart(2, '0')} nodes</span>
            <span>{String(EDGES.length).padStart(2, '0')} edges</span>
            <span className="text-white/70">
              trace → node/<span className="text-white">{active}</span>
            </span>
          </div>
        </div>
      </FadeInSection>

      <FadeInSection delay={120}>
        <div className="relative border border-white/10 bg-[#050505] overflow-hidden bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:16px_16px]">
          {/* ── mobile / tablet: git-log rail */}
          <ol className="relative lg:hidden p-4 pl-9 space-y-4">
            <span className="absolute left-[1.45rem] top-6 bottom-6 w-px bg-white/15" aria-hidden="true" />
            {SKILLS.map((cluster) => (
              <li key={cluster.id} className="relative">
                <span
                  aria-hidden="true"
                  className={`absolute -left-[1.2rem] top-[0.95rem] w-1.5 h-1.5 border border-white ${cluster.id === HEAD_ID ? 'bg-white' : 'bg-black'}`}
                />
                <SkillNode cluster={cluster} isOn={lit.has(cluster.id)} isActive={active === cluster.id} onActivate={() => setActive(cluster.id)} />
              </li>
            ))}
          </ol>

          {/* ── desktop: bus-routed schematic */}
          <div ref={boardRef} className="relative hidden lg:block h-[680px] xl:h-[640px]">
            {board.w > 0 && (
              <svg className="pointer-events-none absolute inset-0" width={board.w} height={board.h} aria-hidden="true">
                {ordered.map(([a, b]) => {
                  const on = isLit(a, b);
                  const d = elbow(a, b);
                  return (
                    <g key={`${a}-${b}`}>
                      <path d={d} fill="none" stroke={on ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.14)'} strokeWidth={1} />
                      {on && !reduced && (
                        <circle r={2} fill="#fff">
                          <animateMotion dur="2.4s" repeatCount="indefinite" path={d} />
                        </circle>
                      )}
                    </g>
                  );
                })}
                {BUS_Y.map((y) => {
                  const cx = Math.round(0.5 * board.w) + 0.5;
                  const cy = Math.round((y / 100) * board.h) + 0.5;
                  const on = active === HEAD_ID || (y === BUS_Y[0] ? active === 'languages' || active === 'frontend' : active === 'backend' || active === 'cloud' || active === 'delivery');
                  return <rect key={y} x={cx - 3} y={cy - 3} width={6} height={6} fill="#050505" stroke={on ? '#fff' : 'rgba(255,255,255,0.3)'} strokeWidth={1} />;
                })}
              </svg>
            )}

            {SKILLS.map((cluster) => {
              const pos = NODE_POS[cluster.id];
              if (!pos) return null;
              return (
                <div
                  key={cluster.id}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 ${cluster.emphasis ? 'z-20 w-[320px] xl:w-[340px]' : 'z-10 w-[270px] xl:w-[290px]'}`}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  <SkillNode cluster={cluster} isOn={lit.has(cluster.id)} isActive={active === cluster.id} onActivate={() => setActive(cluster.id)} />
                </div>
              );
            })}

            <div className="absolute left-4 bottom-3 font-mono text-[9px] uppercase tracking-[0.25em] text-gray-600">hover a node to trace its edges</div>
            <div className="absolute right-4 bottom-3 font-mono text-[9px] uppercase tracking-[0.25em] text-gray-600">bus · elbow routing · 1px</div>
          </div>
        </div>
      </FadeInSection>
    </section>
  );
};

const SkillNode: React.FC<{
  cluster: SkillCluster;
  isOn: boolean;
  isActive: boolean;
  onActivate: () => void;
}> = ({ cluster, isOn, isActive, onActivate }) => {
  const head = cluster.id === HEAD_ID;
  return (
    <button
      type="button"
      onMouseEnter={onActivate}
      onFocus={onActivate}
      onClick={onActivate}
      aria-pressed={isActive}
      className={`w-full text-left border bg-[#050505] font-mono transition-colors duration-300 ${
        isActive ? 'border-white' : isOn ? 'border-white/60' : 'border-white/15 hover:border-white/40'
      }`}
    >
      <div className="flex items-center justify-between gap-3 px-3 py-1.5 border-b border-white/10 text-[9px] uppercase tracking-[0.25em]">
        <span className={`flex items-center gap-2 ${head ? 'text-white' : isOn ? 'text-gray-300' : 'text-gray-500'}`}>
          {head && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse motion-reduce:animate-none" aria-hidden="true" />}
          {head ? 'HEAD · node/agentic' : `node/${cluster.id}`}
        </span>
        <span className="text-gray-600">{String(cluster.items.length).padStart(2, '0')}</span>
      </div>
      <div className={head ? 'px-4 py-4' : 'px-3 py-3'}>
        <h3 className={`uppercase tracking-[0.2em] ${head ? 'text-[13px] font-semibold text-white' : 'text-[11px] text-white/90'}`}>{cluster.label}</h3>
        {head && <p className="text-[9px] uppercase tracking-widest text-gray-500 mt-1.5">Parallel agents · Git worktrees · Human review</p>}
        <ul className={`mt-3 ${cluster.items.length > 6 ? 'grid grid-cols-2 gap-x-3 gap-y-1' : 'space-y-1'}`}>
          {cluster.items.map((item) => (
            <li key={item} className="text-[10.5px] text-gray-400 flex gap-2 leading-snug">
              <span className={`shrink-0 ${isOn ? 'text-white' : 'text-gray-600'}`}>+</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </button>
  );
};
