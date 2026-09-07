import React, { useEffect, useRef } from 'react';

/**
 * Shared canvas language for the schematic visuals (Besmak, Complete Leader,
 * Kenspire, Foodly, ParkAlong). Unlike BaseCanvas (fixed 600x400, object-cover)
 * this sizes the bitmap to the real container so labels and 1px lines are never
 * cropped or blurred, and lays out against the actual width/height.
 */

export type Frame = {
  w: number;
  h: number;
  t: number;
  /** narrow container (mobile card) */
  compact: boolean;
  /** vertical space reserved at the top for the card's role / period badges */
  top: number;
};

export const INK = {
  bg: '#050505',
  grid: 'rgba(255,255,255,0.045)',
  line: 'rgba(255,255,255,0.12)',
  lineStrong: 'rgba(255,255,255,0.32)',
  dim: 'rgba(255,255,255,0.16)',
  muted: 'rgba(255,255,255,0.42)',
  text: 'rgba(255,255,255,0.72)',
  ink: '#ffffff',
  ok: '#4ade80',
} satisfies Record<string, string>;

export const white = (a: number) => `rgba(255,255,255,${Math.max(0, Math.min(1, a)).toFixed(3)})`;
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const smooth = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
/** eased 0..1 for a window [a, b] on the timeline */
export const phase = (t: number, a: number, b: number) => smooth((t - a) / (b - a));
/** deterministic pseudo-random in [0, 1) */
export const hash = (i: number) => {
  const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};
export const hex = (seed: number, len: number) => {
  let out = '';
  for (let i = 0; i < len; i++) out += Math.floor(hash(seed * 31 + i) * 16).toString(16);
  return out;
};
/** snap to pixel centre so 1px strokes stay crisp */
export const px = (v: number) => Math.round(v) + 0.5;

export const mono = (ctx: CanvasRenderingContext2D, size = 10, weight: 300 | 400 | 600 = 400) => {
  ctx.font = `${weight} ${size}px "Fira Code", ui-monospace, monospace`;
};

type LabelOpts = { color?: string; size?: number; align?: CanvasTextAlign; spacing?: string; weight?: 300 | 400 | 600 };

export const label = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, opts: LabelOpts = {}) => {
  const { color = INK.muted, size = 10, align = 'left', spacing = '0.12em', weight = 400 } = opts;
  ctx.save();
  mono(ctx, size, weight);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  const c = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  if ('letterSpacing' in c) c.letterSpacing = spacing;
  ctx.fillText(text, x, y);
  ctx.restore();
};

export const line = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string = INK.line, dash?: number[]) => {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(px(x1), px(y1));
  ctx.lineTo(px(x2), px(y2));
  ctx.stroke();
  ctx.restore();
};

export const box = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string = INK.line, dash?: number[]) => {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  if (dash) ctx.setLineDash(dash);
  ctx.strokeRect(px(x), px(y), Math.round(w), Math.round(h));
  ctx.restore();
};

export const fill = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

export const dot = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
};

/** faint blueprint dot grid shared by every schematic */
export const dotGrid = (ctx: CanvasRenderingContext2D, w: number, h: number, pitch = 16) => {
  ctx.fillStyle = INK.grid;
  for (let x = pitch; x < w; x += pitch) {
    for (let y = pitch; y < h; y += pitch) {
      ctx.fillRect(x, y, 1, 1);
    }
  }
};

type Props = {
  draw: (ctx: CanvasRenderingContext2D, f: Frame) => void;
  /** timeline value used for the single frozen frame under prefers-reduced-motion */
  still?: number;
  /** loop length in seconds; t wraps to keep numbers small */
  loop?: number;
  /** accessible description */
  title?: string;
};

export const SchematicCanvas: React.FC<Props> = ({ draw, still = 4, loop = 600, title }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let visible = true;
    let raf = 0;
    const start = performance.now();

    const paint = (t: number) => {
      if (w === 0 || h === 0) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const compact = w < 560;
      drawRef.current(ctx, { w, h, t, compact, top: compact ? 48 : 56 });
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      if (reduced) paint(still);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const io = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
    });
    io.observe(canvas);

    if (!reduced) {
      const tick = (now: number) => {
        if (visible) paint(((now - start) / 1000) % loop);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [still, loop]);

  return (
    <canvas
      ref={canvasRef}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className="block w-full h-full"
    />
  );
};
