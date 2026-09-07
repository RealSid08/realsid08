import React from 'react';
import { SchematicCanvas, INK, white, phase, hash, px, label, line, box, fill, dot, dotGrid } from './SchematicCanvas';

const URL_FULL = 'instagram.com/reel/C8xQ9vLp';
const URL_SHORT = 'instagram.com/reel/…';
const NODES = ['APIFY', 'GEMINI', 'PLACES'];

type Pt = { x: number; y: number };

/** point at fraction u (0..1) along a polyline, by arc length */
const along = (pts: Pt[], u: number): Pt => {
  const segs = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
  const total = segs.reduce((a, b) => a + b, 0);
  let d = Math.max(0, Math.min(1, u)) * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const k = segs[i] === 0 ? 0 : d / segs[i];
      return { x: pts[i].x + (pts[i + 1].x - pts[i].x) * k, y: pts[i].y + (pts[i + 1].y - pts[i].y) * k };
    }
    d -= segs[i];
  }
  return pts[pts.length - 1];
};

export const FoodlyViz: React.FC = () => (
  <SchematicCanvas
    title="A social video URL passes through scraping, extraction and place matching and lands as a pin on a map"
    still={8.2}
    loop={9}
    draw={(ctx, { w, h, t, compact }) => {
      fill(ctx, 0, 0, w, h, INK.bg);
      dotGrid(ctx, w, h);

      const pad = compact ? 12 : 20;
      const bottom = h - 22;
      const leftW = Math.round(w * (compact ? 0.46 : 0.42));
      const colX0 = pad;
      const colX1 = Math.min(pad + leftW - (compact ? 12 : 24), colX0 + 360);
      const mapX = pad + leftW;
      const mapW = w - pad - mapX;
      const mapY = pad;
      const mapH = bottom - 6 - mapY;
      const cy = Math.round((mapY + mapY + mapH) / 2);

      // ── URL chip, typed out
      const chipH = 22;
      const chipY = cy - (compact ? 30 : 36);
      const url = compact ? URL_SHORT : URL_FULL;
      const typed = Math.floor(phase(t, 0.3, 2.2) * url.length);
      box(ctx, colX0, chipY, colX1 - colX0, chipH, INK.line);
      fill(ctx, colX0, chipY, 4, chipH, white(0.35));
      label(ctx, url.slice(0, typed), colX0 + 12, chipY + chipH / 2 + 0.5, { size: compact ? 9 : 10, color: INK.text, spacing: '0' });
      if (typed < url.length && Math.floor(t * 3) % 2 === 0) {
        ctx.save();
        ctx.font = `400 ${compact ? 9 : 10}px "Fira Code", ui-monospace, monospace`;
        const tw = ctx.measureText(url.slice(0, typed)).width;
        ctx.restore();
        fill(ctx, colX0 + 12 + tw + 1, chipY + 6, 1, chipH - 12, white(0.8));
      }

      // ── pipeline nodes
      const nodeY = cy + (compact ? 12 : 16);
      const nodeH = 22;
      const gap = compact ? 10 : 16;
      const nodeX0 = colX0 + 14;
      const nodeW = Math.floor((colX1 - nodeX0 - gap * 2) / 3);
      const path: Pt[] = [
        { x: colX0 + 8, y: chipY + chipH },
        { x: colX0 + 8, y: nodeY + nodeH / 2 },
        { x: mapX, y: nodeY + nodeH / 2 },
      ];
      line(ctx, path[0].x, path[0].y, path[1].x, path[1].y, INK.line);
      line(ctx, path[1].x, path[1].y, path[2].x, path[2].y, INK.line);

      const travel = phase(t, 2.3, 4.6);
      const dotPos = travel > 0 && travel < 1 ? along(path, travel) : null;

      NODES.forEach((name, i) => {
        const x = nodeX0 + i * (nodeW + gap);
        const lit = dotPos !== null && dotPos.x >= x - 2 && dotPos.x <= x + nodeW + 2 && dotPos.y > path[1].y - 1;
        fill(ctx, x, nodeY, nodeW, nodeH, INK.bg);
        box(ctx, x, nodeY, nodeW, nodeH, lit ? white(0.85) : INK.line);
        label(ctx, name, x + nodeW / 2, nodeY + nodeH / 2 + 0.5, { size: compact ? 7 : 9, align: 'center', color: lit ? INK.ink : INK.muted });
      });
      if (dotPos) dot(ctx, dotPos.x, dotPos.y, 2.5, INK.ink);

      // ── map tile
      fill(ctx, mapX, mapY, mapW, mapH, INK.bg);
      box(ctx, mapX, mapY, mapW, mapH, INK.lineStrong);
      ctx.save();
      ctx.beginPath();
      ctx.rect(mapX + 1, mapY + 1, mapW - 2, mapH - 2);
      ctx.clip();
      // street grid, irregular spacing
      const ys = [0, 0.19, 0.47, 0.7, 1].map((f, i) => Math.round(mapY + mapH * (f + (i === 0 || i === 4 ? 0 : (hash(i + 40) - 0.5) * 0.08))));
      const xs = [0, 0.13, 0.31, 0.5, 0.66, 0.84, 1].map((f, i) => Math.round(mapX + mapW * (f + (i === 0 || i === 6 ? 0 : (hash(i + 50) - 0.5) * 0.06))));
      // city blocks: inset outlines between streets, a few filled as footprints
      for (let r = 0; r < ys.length - 1; r++) {
        for (let c = 0; c < xs.length - 1; c++) {
          const inset = 5;
          const bx = xs[c] + inset;
          const by = ys[r] + inset;
          const bw = xs[c + 1] - xs[c] - inset * 2;
          const bh = ys[r + 1] - ys[r] - inset * 2;
          if (bw < 8 || bh < 8) continue;
          box(ctx, bx, by, bw, bh, white(0.07));
          const k = r * 7 + c;
          if (hash(k + 90) > 0.55) {
            const fw = Math.round(bw * (0.3 + hash(k + 91) * 0.4));
            const fh = Math.round(bh * (0.3 + hash(k + 92) * 0.4));
            fill(ctx, bx + Math.round((bw - fw) * hash(k + 93)), by + Math.round((bh - fh) * hash(k + 94)), fw, fh, white(0.05));
          }
        }
      }
      ys.slice(1, -1).forEach((y, i) => line(ctx, mapX, y, mapX + mapW, y, i === 1 ? INK.lineStrong : INK.line));
      xs.slice(1, -1).forEach((x, i) => line(ctx, x, mapY, x, mapY + mapH, i === 2 ? INK.lineStrong : INK.line));
      // one diagonal avenue
      line(ctx, mapX, mapY + mapH * 0.9, mapX + mapW * 0.62, mapY, white(0.16));
      // scale bar
      line(ctx, mapX + 10, mapY + mapH - 10, mapX + 40, mapY + mapH - 10, INK.muted);
      line(ctx, mapX + 10, mapY + mapH - 13, mapX + 10, mapY + mapH - 7, INK.muted);
      line(ctx, mapX + 40, mapY + mapH - 13, mapX + 40, mapY + mapH - 7, INK.muted);
      label(ctx, '100 m', mapX + 46, mapY + mapH - 10, { size: 8, color: INK.muted, spacing: '0.05em' });

      // pin drop
      const pinX = Math.round(mapX + mapW * 0.58);
      const pinY = Math.round(mapY + mapH * 0.46);
      const drop = phase(t, 4.6, 5.2);
      if (drop <= 0) {
        // searching: a quiet dashed target where the match will land
        const r = 10 + Math.sin(t * 2) * 2;
        ctx.save();
        ctx.setLineDash([2, 3]);
        ctx.strokeStyle = white(0.28);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(pinX, pinY, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        line(ctx, pinX - 4, pinY, pinX + 4, pinY, white(0.35));
        line(ctx, pinX, pinY - 4, pinX, pinY + 4, white(0.35));
      } else {
        const y = pinY - (1 - drop) * 50;
        const ring = phase(t, 5.2, 6.2);
        if (ring > 0 && ring < 1) {
          ctx.strokeStyle = white(0.5 * (1 - ring));
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(pinX, pinY, 4 + ring * 20, 0, Math.PI * 2);
          ctx.stroke();
        }
        // crosshair under the pin
        line(ctx, pinX - 9, pinY, pinX + 9, pinY, white(0.35));
        line(ctx, pinX, pinY - 9, pinX, pinY + 9, white(0.35));
        // pin glyph
        ctx.strokeStyle = INK.ink;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pinX, y - 12, 6, Math.PI * 0.85, Math.PI * 2.15);
        ctx.lineTo(px(pinX), y);
        ctx.closePath();
        ctx.stroke();
        dot(ctx, pinX, y - 12, 2, INK.ink);
      }

      // place card
      const card = phase(t, 5.6, 6.8);
      if (card > 0) {
        const cardW = compact ? mapW - 20 : Math.min(200, Math.round(mapW * 0.42));
        const cardH = compact ? 40 : 54;
        const cardX = mapX + mapW - cardW - 10;
        const cardY = mapY + mapH - cardH - (compact ? 10 : 22);
        fill(ctx, cardX, cardY, cardW, cardH, INK.bg);
        box(ctx, cardX, cardY, cardW, cardH, white(0.25 + 0.45 * card));
        if (card > 0.2) fill(ctx, cardX + 10, cardY + 10, Math.round((cardW - 20) * 0.6), 3, white(0.85));
        if (card > 0.5) label(ctx, 'google places · match', cardX + 10, cardY + (compact ? 24 : 27), { size: 8, color: INK.muted, spacing: '0.04em' });
        if (card > 0.85) {
          dot(ctx, cardX + 12, cardY + cardH - 10, 2, INK.ok);
          label(ctx, 'SAVED TO LIST', cardX + 20, cardY + cardH - 10, { size: 8, color: INK.text });
        }
        if (!compact) line(ctx, pinX, pinY + 9, pinX, cardY, white(0.25), [2, 3]);
      }
      ctx.restore();

      // footer row
      label(ctx, 'SOCIAL URL → MAPPED PLACE', pad, h - 11, { size: 9 });
      label(ctx, 'REEL · TIKTOK → PIN', w - pad, h - 11, { size: 9, align: 'right', color: INK.text });
    }}
  />
);
