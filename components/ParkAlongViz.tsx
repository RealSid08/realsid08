import React from 'react';
import { SchematicCanvas, INK, white, phase, hash, hex, label, line, box, fill, dot, dotGrid } from './SchematicCanvas';

const RECORDS = '34,023';
const GEN_SECONDS = 6;

export const ParkAlongViz: React.FC = () => (
  <SchematicCanvas
    title="Parking bays with live occupancy inside a moving viewport, next to a SHA-256 integrity manifest being verified"
    still={5}
    draw={(ctx, { w, h, t, compact }) => {
      fill(ctx, 0, 0, w, h, INK.bg);
      dotGrid(ctx, w, h);

      const pad = compact ? 12 : 20;
      const bottom = h - 22;
      const panelW = compact ? 138 : Math.min(280, Math.round(w * 0.32));
      const panelX = w - pad - panelW;
      const lotX0 = pad;
      const lotX1 = panelX - (compact ? 12 : 24);
      const lotY0 = pad + 2;
      const lotY1 = bottom - 6;

      // ── bay lot
      const bayW = compact ? 7 : 10;
      const bayH = compact ? 10 : 14;
      const pitchX = bayW + 2;
      const aisle = Math.round(bayH * 0.8);
      const pairH = bayH * 2 + aisle + 6;
      const cols = Math.floor((lotX1 - lotX0) / pitchX);
      const pairs = Math.max(1, Math.floor((lotY1 - lotY0 - 14) / pairH));
      const lotW = cols * pitchX - 2;
      const lotH = pairs * pairH - 6;
      const gx = Math.round(lotX0 + (lotX1 - lotX0 - lotW) / 2);
      const gy = Math.round(lotY0 + 14 + (lotY1 - lotY0 - 14 - lotH) / 2);

      // viewport drifting over the lot
      const vpW = Math.round(lotW * (compact ? 0.6 : 0.5));
      const vpH = Math.round(lotH * 0.66);
      const vpX = Math.round(gx + (lotW - vpW) / 2 + Math.sin(t * 0.17) * ((lotW - vpW) / 2));
      const vpY = Math.round(gy + (lotH - vpH) / 2 + Math.cos(t * 0.12) * ((lotH - vpH) / 2));
      const inView = (x: number, y: number) => x >= vpX && x <= vpX + vpW && y >= vpY && y <= vpY + vpH;

      let seen = 0;
      let occ = 0;
      for (let p = 0; p < pairs; p++) {
        for (let side = 0; side < 2; side++) {
          const y = gy + p * pairH + side * (bayH + aisle);
          for (let c = 0; c < cols; c++) {
            const idx = (p * 2 + side) * cols + c;
            const x = gx + c * pitchX;
            const base = hash(idx);
            const drift = 0.2 * Math.sin(t * 0.35 + hash(idx * 7) * Math.PI * 2);
            const occupied = base + drift > 0.46;
            const vis = inView(x + bayW / 2, y + bayH / 2) ? 1 : 0.3;
            if (vis === 1) {
              seen++;
              if (occupied) occ++;
            }
            box(ctx, x, y, bayW, bayH, white(0.16 * vis));
            if (occupied) fill(ctx, x + 2, y + 2, bayW - 3, bayH - 3, white(0.72 * vis));
          }
          if (side === 0) {
            // aisle centre line
            const ay = y + bayH + aisle / 2;
            line(ctx, gx, ay, gx + lotW, ay, white(0.08), [3, 5]);
          }
        }
      }

      box(ctx, vpX, vpY, vpW, vpH, white(0.6), [4, 4]);
      fill(ctx, vpX, vpY, 5, 1, white(0.9));
      fill(ctx, vpX, vpY, 1, 5, white(0.9));
      fill(ctx, vpX + vpW - 5, vpY + vpH, 6, 1, white(0.9));
      fill(ctx, vpX + vpW, vpY + vpH - 5, 1, 6, white(0.9));
      fill(ctx, vpX + 4, vpY - 12, 44, 10, INK.bg);
      label(ctx, 'viewport', vpX + 6, vpY - 7, { size: 7, color: INK.muted, spacing: '0.08em' });

      label(ctx, compact ? 'LIVE OCCUPANCY' : 'CITY OF MELBOURNE · LIVE OCCUPANCY', lotX0, lotY0 + 5, { size: compact ? 7 : 8 });
      label(ctx, compact ? `${occ}/${seen}` : `${occ} / ${seen} IN VIEW`, lotX1, lotY0 + 5, { size: compact ? 7 : 8, align: 'right', color: INK.text });

      // ── integrity manifest panel
      const panelY = lotY0;
      const panelH = lotY1 - panelY;
      fill(ctx, panelX, panelY, panelW, panelH, INK.bg);
      box(ctx, panelX, panelY, panelW, panelH, INK.lineStrong);
      line(ctx, panelX, panelY + 20, panelX + panelW, panelY + 20, INK.line);
      label(ctx, compact ? 'MANIFEST' : 'INTEGRITY MANIFEST', panelX + 10, panelY + 10.5, { size: compact ? 7 : 8 });
      label(ctx, RECORDS, panelX + panelW - 10, panelY + 10.5, { size: compact ? 8 : 9, align: 'right', color: INK.ink, spacing: '0.04em' });

      const gen = Math.floor(t / GEN_SECONDS);
      const u = t - gen * GEN_SECONDS;
      const rowH = compact ? 12 : 14;
      const rowsY0 = panelY + 28;
      const rowsH = panelH - 28 - 22;
      const rows = Math.max(2, Math.min(9, Math.floor(rowsH / rowH)));
      const scan = phase(u, 0.3, 4.2);
      const scanY = rowsY0 + scan * rows * rowH;
      const hexLen = compact ? 8 : 14;
      for (let i = 0; i < rows; i++) {
        const y = rowsY0 + i * rowH + rowH / 2;
        const verified = scanY >= y + rowH / 2 - 1;
        label(ctx, `${String(i + 1).padStart(2, '0')}`, panelX + 10, y, { size: 8, color: white(0.3), spacing: '0' });
        label(ctx, hex(gen * 97 + i, hexLen), panelX + 28, y, { size: compact ? 8 : 9, color: verified ? INK.text : white(0.35), spacing: '0' });
        const sx = panelX + panelW - 16;
        if (verified) fill(ctx, sx, y - 3, 6, 6, white(0.85));
        else box(ctx, sx, y - 3, 6, 6, white(0.16));
      }
      if (scan > 0 && scan < 1) {
        line(ctx, panelX + 1, scanY, panelX + panelW - 1, scanY, white(0.55));
        fill(ctx, panelX + 1, scanY - 8, panelW - 2, 8, white(0.03));
      }

      const footY = panelY + panelH - 11;
      const verifiedAll = scan >= 1;
      const refreshing = u > GEN_SECONDS - 0.5;
      if (verifiedAll && !refreshing) {
        dot(ctx, panelX + 12, footY, 2, INK.ok);
        label(ctx, `VERIFIED · GEN ${String(gen).padStart(2, '0')}`, panelX + 20, footY, { size: 8, color: INK.text });
      } else if (refreshing) {
        label(ctx, `REFRESH → GEN ${String(gen + 1).padStart(2, '0')}`, panelX + 10, footY, { size: 8, color: INK.muted });
      } else {
        label(ctx, 'sha256 · verifying', panelX + 10, footY, { size: 8, color: INK.muted, spacing: '0.04em' });
      }

      // footer row
      label(ctx, compact ? 'VIEWPORT LOAD' : 'VIEWPORT LOAD · GENERATION-SAFE REFRESH', pad, h - 11, { size: compact ? 8 : 9 });
      label(ctx, compact ? `${RECORDS} RECORDS` : `${RECORDS} RECORDS · SHA-256`, w - pad, h - 11, { size: compact ? 8 : 9, align: 'right', color: INK.text });
    }}
  />
);
