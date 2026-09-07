import React from 'react';
import { SchematicCanvas, INK, white, phase, clamp01, hash, px, label, line, box, fill, dot, dotGrid } from './SchematicCanvas';

/**
 * Schematic visuals for the current workstreams. Each one is laid out against
 * the live container size (see SchematicCanvas) and keeps the top band clear
 * for the role / period badges the card overlays there.
 */

// ─── Besmak: parallel worktrees → main → tenant grid (600 users, web + mobile)

export const BesmakVisual: React.FC = () => (
  <SchematicCanvas
    title="Three git worktrees merging into main and fanning out to a 600-tenant grid across web and mobile"
    still={7}
    loop={16}
    draw={(ctx, { w, h, t, compact, top }) => {
      fill(ctx, 0, 0, w, h, INK.bg);
      dotGrid(ctx, w, h);

      const pad = compact ? 12 : 20;
      const bottom = h - 22;
      const areaY0 = top + 6;
      const areaY1 = bottom - 8;
      const midY = Math.round((areaY0 + areaY1) / 2);

      const laneX0 = pad + 4;
      const splitX = Math.round(w * (compact ? 0.4 : 0.42));
      const mergeX = splitX + (compact ? 22 : 44);
      const trunkEnd = mergeX + (compact ? 16 : 34);
      const gridX1 = w - pad;

      // lanes
      const lanes = ['wt/codex', 'wt/claude', 'wt/design'];
      const laneGap = Math.min(compact ? 34 : 54, (areaY1 - areaY0) / 3);
      const laneLen = splitX - laneX0;
      lanes.forEach((name, i) => {
        const y = Math.round(midY + (i - 1) * laneGap);
        line(ctx, laneX0, y, splitX, y, INK.line);

        ctx.save();
        ctx.strokeStyle = INK.lineStrong;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px(splitX), px(y));
        const cx = splitX + (mergeX - splitX) * 0.55;
        ctx.bezierCurveTo(px(cx), px(y), px(cx), px(midY), px(mergeX), px(midY));
        ctx.stroke();
        ctx.restore();

        box(ctx, laneX0 - 3, y - 3, 6, 6, INK.lineStrong);
        label(ctx, name, laneX0, y - (compact ? 9 : 11), { size: compact ? 8 : 10 });

        // commits drifting toward the merge
        const speed = 18;
        const spacing = compact ? 34 : 46;
        const n = Math.ceil(laneLen / spacing) + 1;
        for (let k = 0; k < n; k++) {
          const x = laneX0 + ((t * speed + k * spacing + i * 19) % (laneLen + spacing)) - spacing * 0.5;
          if (x < laneX0 + 6 || x > splitX - 2) continue;
          const a = 0.3 + 0.55 * ((x - laneX0) / laneLen);
          fill(ctx, x - 2, y - 2, 4, 4, white(a));
        }
      });

      // main trunk
      line(ctx, mergeX, midY, trunkEnd, midY, INK.lineStrong);
      dot(ctx, mergeX, midY, 2.5, INK.ink);
      const pt = (t % 2) / 2;
      fill(ctx, mergeX + (trunkEnd - mergeX) * pt - 3, midY - 1, 6, 2, white(0.9 * (1 - pt)));
      dot(ctx, mergeX - 14, midY + 15, 2, INK.ok);
      label(ctx, 'main', mergeX - 7, midY + 15, { color: INK.text, size: compact ? 8 : 10 });

      // tenant grid — exactly 600 cells, split web / mobile
      const cols = compact ? 30 : 40;
      const rows = 600 / cols;
      const split = compact ? 20 : 26;
      const availW = gridX1 - (trunkEnd + 10);
      const availH = areaY1 - areaY0 - 16;
      const pitch = Math.max(3, Math.floor(Math.min(availW / (cols + 1), availH / rows)));
      const cell = Math.max(2, Math.round(pitch * 0.66));
      const gw = pitch * (cols + 1) - (pitch - cell);
      const gh = pitch * rows - (pitch - cell);
      const gx = gridX1 - gw;
      const gy = Math.round(midY - gh / 2 - 6);

      const fillF = 0.45 + 0.5 * (0.5 - 0.5 * Math.cos((t * Math.PI * 2) / 16));
      const tick = Math.floor(t * 3);
      let active = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const on = hash(idx) < fillF;
          const flicker = hash(idx * 13 + tick) < 0.008;
          if (on) active++;
          const a = on ? (flicker ? 0.3 : 0.78) : flicker ? 0.5 : 0.1;
          fill(ctx, gx + (c + (c >= split ? 1 : 0)) * pitch, gy + r * pitch, cell, cell, white(a));
        }
      }

      // fan-in from trunk to grid
      line(ctx, trunkEnd, midY, gx - 3, gy + 1, INK.line);
      line(ctx, trunkEnd, midY, gx - 3, gy + Math.round(gh / 2), INK.line);
      line(ctx, trunkEnd, midY, gx - 3, gy + gh - 1, INK.line);

      const ly = gy + gh + (compact ? 9 : 12);
      label(ctx, 'WEB', gx, ly, { size: compact ? 8 : 9 });
      if (compact) {
        label(ctx, 'MOBILE', gridX1, ly, { size: 8, align: 'right' });
      } else {
        label(ctx, 'MOBILE', gx + (split + 1) * pitch, ly, { size: 9 });
        label(ctx, '600 USERS', gridX1, ly, { color: INK.ink, align: 'right', size: 9 });
      }

      // footer row
      label(ctx, compact ? '3 lanes → main' : 'git worktree · 3 lanes → main', pad, h - 11, { size: compact ? 8 : 9 });
      label(ctx, `${active} / 600 ACTIVE`, w - pad, h - 11, { size: compact ? 8 : 9, align: 'right', color: INK.text });
    }}
  />
);

// ─── Complete Leader: responses → scoring → report pages assembling

const SCORES = [0.82, 0.64, 0.91, 0.55, 0.73, 0.88];

export const CompleteLeaderVisual: React.FC = () => (
  <SchematicCanvas
    title="Psychometric responses scored into dimensions and assembled into a report page"
    still={9.4}
    loop={11}
    draw={(ctx, { w, h, t, compact, top }) => {
      fill(ctx, 0, 0, w, h, INK.bg);
      dotGrid(ctx, w, h);

      const pad = compact ? 12 : 20;
      const bottom = h - 22;
      const areaY0 = top + 4;
      const areaY1 = bottom - 6;
      const areaH = areaY1 - areaY0;
      const midY = Math.round((areaY0 + areaY1) / 2);

      const respX = pad;
      const respW = Math.round(w * (compact ? 0.4 : 0.28));
      const scoreX = Math.round(pad + w * 0.34);
      const scoreW = Math.round(w * 0.24);
      const repX = Math.round(pad + w * (compact ? 0.5 : 0.66));
      const repW = w - pad - repX;

      // responses: likert rows filling in
      const rowH = compact ? 14 : 16;
      const rows = Math.min(10, Math.floor((areaH - 4) / rowH));
      const rowsY0 = Math.round(midY - (rows * rowH) / 2);
      const answered = phase(t, 0.2, 4.0) * rows;
      const boxSize = 6;
      const boxPitch = compact ? 9 : 11;
      const boxesW = boxPitch * 4 + boxSize;
      for (let i = 0; i < rows; i++) {
        const y = rowsY0 + i * rowH + rowH / 2;
        const done = answered >= i + 1;
        const current = !done && answered > i;
        fill(ctx, respX, y - 1, Math.round(respW * (0.28 + hash(i * 3) * 0.2)), 2, white(done ? 0.35 : 0.14));
        const bx0 = respX + respW - boxesW;
        const pick = Math.floor(hash(i + 11) * 5);
        for (let k = 0; k < 5; k++) {
          const bx = bx0 + k * boxPitch;
          if (done && k === pick) fill(ctx, bx, y - boxSize / 2, boxSize, boxSize, white(0.85));
          else box(ctx, bx, y - boxSize / 2, boxSize, boxSize, white(current ? 0.4 : 0.16));
        }
        if (current) fill(ctx, respX, y + rowH / 2 - 2, respW, 1, white(0.5));
      }

      // scoring bars (desktop only; compact folds them into the report)
      const scored = phase(t, 3.6, 6.2);
      if (!compact) {
        const barGap = Math.min(20, (areaH - 8) / SCORES.length);
        const barsY0 = Math.round(midY - (SCORES.length * barGap) / 2 + barGap / 2);
        const trackX = scoreX + 22;
        const trackW = scoreW - 22;
        SCORES.forEach((v, i) => {
          const y = barsY0 + i * barGap;
          label(ctx, `0${i + 1}`, scoreX, y, { size: 9, color: white(0.35) });
          fill(ctx, trackX, y - 3, trackW, 6, white(0.06));
          box(ctx, trackX, y - 3, trackW, 6, white(0.14));
          fill(ctx, trackX, y - 3, Math.round(trackW * v * scored), 6, white(0.8));
        });
      }

      // connectors + travelling dots
      const c1x0 = respX + respW + 6;
      const c1x1 = compact ? repX - 6 : scoreX - 6;
      line(ctx, c1x0, midY, c1x1, midY, INK.line);
      const d1 = phase(t, 3.2, 3.7);
      if (d1 > 0 && d1 < 1) dot(ctx, c1x0 + (c1x1 - c1x0) * d1, midY, 2, INK.ink);
      if (!compact) {
        const c2x0 = scoreX + scoreW + 6;
        const c2x1 = repX - 6;
        line(ctx, c2x0, midY, c2x1, midY, INK.line);
        const d2 = phase(t, 5.9, 6.4);
        if (d2 > 0 && d2 < 1) dot(ctx, c2x0 + (c2x1 - c2x0) * d2, midY, 2, INK.ink);
      }

      // report page(s) assembling
      const pr = phase(t, 6.2, 9.0);
      const pageH = Math.min(areaH, Math.round((repW - 12) / 0.72));
      const pageW = Math.round(pageH * 0.72);
      const pageX = Math.round(repX + (repW - pageW) / 2 + 4);
      const pageY = Math.round(midY - pageH / 2 + 4);
      const stackIn = phase(t, 6.0, 7.0);
      for (let s = 2; s >= 1; s--) {
        const off = s * 4 * stackIn;
        box(ctx, pageX + off, pageY - off, pageW, pageH, white(0.1 + 0.06 * (2 - s)));
      }
      fill(ctx, pageX, pageY, pageW, pageH, INK.bg);
      box(ctx, pageX, pageY, pageW, pageH, white(0.25 + 0.45 * pr));

      const inset = 10;
      if (pr > 0.04) fill(ctx, pageX + inset, pageY + inset, Math.round(pageW * 0.55), 3, white(0.85));
      [0.16, 0.26, 0.36].forEach((at, i) => {
        if (pr > at) fill(ctx, pageX + inset, pageY + inset + 10 + i * 6, Math.round(pageW * (0.7 - i * 0.12)), 2, white(0.22));
      });
      // mini dimension bars mirror the scores
      const chartY1 = pageY + pageH - 22;
      const chartH = Math.max(14, Math.round(pageH * 0.34));
      const chartX = pageX + inset;
      const chartW = pageW - inset * 2;
      const bw = Math.max(3, Math.floor((chartW - 5 * 3) / 6));
      const grow = compact ? phase(t, 4.0, 6.5) : phase(t, 7.0, 8.4);
      fill(ctx, chartX, chartY1, chartW, 1, white(0.2));
      SCORES.forEach((v, i) => {
        const bh = Math.round(chartH * v * grow);
        fill(ctx, chartX + i * (bw + 3), chartY1 - bh, bw, bh, white(0.7));
      });
      const ready = t > 9.0;
      if (ready) dot(ctx, pageX + inset + 2, pageY + pageH - 9, 2, INK.ok);
      label(ctx, ready ? 'READY' : 'RENDERING', pageX + inset + (ready ? 9 : 0), pageY + pageH - 9, {
        size: 8,
        color: ready ? INK.text : white(0.3),
      });

      // footer row
      label(ctx, 'RESPONSES', respX, h - 11, { size: compact ? 8 : 9 });
      if (!compact) label(ctx, 'SCORING', scoreX, h - 11, { size: 9 });
      label(ctx, 'REPORT.PDF', w - pad, h - 11, { size: compact ? 8 : 9, align: 'right', color: INK.text });
    }}
  />
);

// ─── Kenspire: bounded backfill → read cutover → legacy fades, new schema locks

export const KenspireVisual: React.FC = () => (
  <SchematicCanvas
    title="Schema cutover: rows backfilled from a legacy index into a new one, reads switched over, new index locked"
    still={10.5}
    loop={13}
    draw={(ctx, { w, h, t, compact, top }) => {
      fill(ctx, 0, 0, w, h, INK.bg);
      dotGrid(ctx, w, h);

      const pad = compact ? 12 : 20;
      const bottom = h - 22;
      const areaY0 = top + 4;
      const areaY1 = bottom - 6;

      const blockW = compact ? Math.floor((w - 2 * pad - 36) / 2) : Math.min(230, Math.floor((w - 2 * pad - 96) / 2));
      const v1X = pad;
      const v2X = w - pad - blockW;
      const blockY = areaY0;
      const blockH = areaY1 - 26 - areaY0;
      const rows = compact ? 6 : 8;
      const barH = compact ? 4 : 5;
      const rowH = Math.max(barH + 4, Math.floor((blockH - 26) / rows));
      const rowsY0 = blockY + 22;

      const copyStep = 0.4;
      const copyStart = 0.6;
      const tc = copyStart + rows * copyStep + 0.8; // cutover
      const lockStart = tc + 0.5;
      const lockStep = 0.25;
      const allLocked = lockStart + rows * lockStep;

      const backfill = clamp01((t - copyStart) / (rows * copyStep));
      const legacyA = 1 - 0.82 * phase(t, tc + 0.3, tc + 2.4);

      const drawRows = (x: number, alpha: number, present: (i: number) => number, locked: (i: number) => boolean) => {
        for (let i = 0; i < rows; i++) {
          const y = rowsY0 + i * rowH + Math.floor((rowH - barH) / 2);
          const p = present(i);
          if (p <= 0) continue;
          fill(ctx, x + 10, y, Math.round(blockW * 0.26), barH, white(0.7 * alpha * p));
          fill(ctx, x + 10 + Math.round(blockW * 0.3), y, Math.round(blockW * 0.42), barH, white(0.2 * alpha * p));
          const slot = x + blockW - 18;
          if (locked(i)) fill(ctx, slot, y - 1, barH + 2, barH + 2, white(0.9 * alpha));
          else box(ctx, slot, y - 1, barH + 2, barH + 2, white(0.14 * alpha * p));
        }
      };

      // v1 · legacy
      box(ctx, v1X, blockY, blockW, blockH, white(0.22 * legacyA));
      label(ctx, 'v1 · legacy', v1X + 10, blockY + 11, { size: compact ? 8 : 9, color: white(0.45 * legacyA) });
      line(ctx, v1X, blockY + 20, v1X + blockW, blockY + 20, white(0.12 * legacyA));
      drawRows(v1X, legacyA, () => 1, () => false);

      // v2 · cutover
      const v2Border = 0.22 + 0.5 * phase(t, tc, tc + 0.6);
      box(ctx, v2X, blockY, blockW, blockH, white(v2Border));
      label(ctx, 'v2 · cutover', v2X + 10, blockY + 11, { size: compact ? 8 : 9, color: t > tc ? INK.text : INK.muted });
      line(ctx, v2X, blockY + 20, v2X + blockW, blockY + 20, INK.line);
      drawRows(
        v2X,
        1,
        (i) => phase(t, copyStart + i * copyStep, copyStart + i * copyStep + 0.3),
        (i) => t > lockStart + i * lockStep,
      );

      // backfill dots between blocks
      const gapX0 = v1X + blockW;
      const gapX1 = v2X;
      for (let i = 0; i < rows; i++) {
        const u = (t - (copyStart + i * copyStep)) / 0.35;
        if (u > 0 && u < 1) {
          const y = rowsY0 + i * rowH + Math.floor(rowH / 2);
          fill(ctx, gapX0 + (gapX1 - gapX0) * u - 2, y - 1, 4, 2, white(0.9));
        }
      }
      // gap label + progress hairline
      const gapMid = Math.round((gapX0 + gapX1) / 2);
      const gapY = blockY + Math.round(blockH / 2);
      const trackW = Math.max(28, gapX1 - gapX0 - (compact ? 10 : 24));
      const trackX = gapMid - Math.round(trackW / 2);
      const status = t > allLocked ? 'LOCKED' : t > tc ? 'CUTOVER' : `BACKFILL ${Math.round(backfill * 100)}%`;
      line(ctx, trackX, gapY + 8, trackX + trackW, gapY + 8, white(0.14));
      fill(ctx, trackX, gapY + 8, Math.round(trackW * backfill), 1, white(0.7));
      if (!compact) {
        if (t > allLocked) dot(ctx, gapMid - 26, gapY - 4, 2, INK.ok);
        label(ctx, status, gapMid + (t > allLocked ? 4 : 0), gapY - 4, {
          size: 8,
          align: 'center',
          color: t > tc ? INK.text : INK.muted,
          spacing: '0.08em',
        });
      }

      // app node at the bottom, reads pointer switches at cutover
      const appW = compact ? 34 : 44;
      const appH = 16;
      const appX = Math.round(w / 2 - appW / 2);
      const appY = areaY1 - appH;
      const readsNew = t > tc;
      const v1Bottom = { x: v1X + Math.round(blockW / 2), y: blockY + blockH };
      const v2Bottom = { x: v2X + Math.round(blockW / 2), y: blockY + blockH };
      const drawRead = (target: { x: number; y: number }, on: boolean) => {
        const c = on ? INK.lineStrong : white(0.08);
        line(ctx, appX + appW / 2, appY, appX + appW / 2, appY - 5, c);
        line(ctx, appX + appW / 2, appY - 5, target.x, appY - 5, c);
        line(ctx, target.x, appY - 5, target.x, target.y, c);
      };
      drawRead(v1Bottom, !readsNew);
      drawRead(v2Bottom, readsNew);
      const sw = phase(t, tc, tc + 0.5);
      if (sw > 0 && sw < 1) {
        const path = [
          { x: appX + appW / 2, y: appY - 5 },
          { x: v2Bottom.x, y: appY - 5 },
          { x: v2Bottom.x, y: v2Bottom.y },
        ];
        const l1 = Math.abs(path[1].x - path[0].x);
        const l2 = Math.abs(path[2].y - path[1].y);
        const d = sw * (l1 + l2);
        const p = d < l1 ? { x: path[0].x + (path[1].x - path[0].x) * (d / l1), y: path[0].y } : { x: path[1].x, y: path[1].y - (d - l1) };
        dot(ctx, p.x, p.y, 2, INK.ink);
      }
      box(ctx, appX, appY, appW, appH, INK.lineStrong);
      label(ctx, 'app', appX + appW / 2, appY + appH / 2 + 0.5, { size: 8, align: 'center', color: INK.text });
      label(ctx, `reads → ${readsNew ? 'v2' : 'v1'}`, appX + appW + 8, appY + appH / 2 + 0.5, { size: 8, color: INK.muted });

      // footer row (compact folds the gap status down here)
      if (compact) {
        if (t > allLocked) dot(ctx, pad + 2, h - 11, 2, INK.ok);
        label(ctx, status, pad + (t > allLocked ? 9 : 0), h - 11, { size: 8, color: t > tc ? INK.text : INK.muted });
        label(ctx, '500 ORGS', w - pad, h - 11, { size: 8, align: 'right', color: INK.text });
      } else {
        label(ctx, 'schema migration · bounded backfill', pad, h - 11, { size: 9 });
        label(ctx, '500 ORGS · TARGET', w - pad, h - 11, { size: 9, align: 'right', color: INK.text });
      }
    }}
  />
);
