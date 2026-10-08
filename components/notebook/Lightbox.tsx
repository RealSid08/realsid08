import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Screenshots lift out of the notebook. Any `img[data-zoom]` in the book opens
 * here: it flies from its spot on the page to the middle of the screen over a
 * blurred desk, swaps to the full-quality file, and steps through the other
 * screenshots in its group. Closing flies it back into the book.
 */

type Shot = { el: HTMLImageElement; thumb: string; full: string; caption: string; detail: string };
type Open = { shots: Shot[]; index: number };

const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
const MS = 420;

const shotOf = (el: HTMLImageElement): Shot => ({
  el,
  thumb: el.currentSrc || el.src,
  full: el.dataset.full ?? el.src,
  caption: el.dataset.caption ?? el.alt,
  detail: el.dataset.detail ?? '',
});

/** Where an image sits on screen, ignoring the slight tilt of the paper. */
const rectOf = (el: Element) => el.getBoundingClientRect();

export const useLightbox = (book: React.RefObject<HTMLElement | null>) => {
  const [open, setOpen] = useState<Open | null>(null);

  useEffect(() => {
    const root = book.current;
    if (!root) return;
    const launch = (img: HTMLImageElement) => {
      const group = img.dataset.group;
      const shots = Array.from(root.querySelectorAll<HTMLImageElement>(group ? `img[data-zoom][data-group="${group}"]` : 'img[data-zoom]'))
        .filter((el) => (group ? true : el === img))
        .map(shotOf);
      setOpen({ shots, index: Math.max(0, shots.findIndex((shot) => shot.el === img)) });
    };
    const onClick = (event: MouseEvent) => {
      const img = (event.target as HTMLElement).closest<HTMLImageElement>('img[data-zoom]');
      if (!img) return;
      event.preventDefault();
      event.stopPropagation();
      launch(img);
    };
    const onKey = (event: KeyboardEvent) => {
      const img = (event.target as HTMLElement).closest?.<HTMLImageElement>('img[data-zoom]');
      if (!img || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      launch(img);
    };
    root.addEventListener('click', onClick, true);
    root.addEventListener('keydown', onKey);
    return () => {
      root.removeEventListener('click', onClick, true);
      root.removeEventListener('keydown', onKey);
    };
  }, [book]);

  const element = open ? <LightboxView key={open.shots[0]?.full} initial={open} onClosed={() => setOpen(null)} /> : null;
  return element;
};

const LightboxView: React.FC<{ initial: Open; onClosed: () => void }> = ({ initial, onClosed }) => {
  const { shots } = initial;
  const [index, setIndex] = useState(initial.index);
  const [phase, setPhase] = useState<'in' | 'open' | 'out'>('in');
  const [src, setSrc] = useState(shots[initial.index].thumb);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<Element | null>(typeof document !== 'undefined' ? document.activeElement : null);
  const shot = shots[index];
  const touch = useRef<{ x: number; y: number; t: number } | null>(null);

  // The page's copy stays hidden while it is "lifted" out.
  useEffect(() => {
    shot.el.style.visibility = 'hidden';
    return () => {
      shot.el.style.visibility = '';
    };
  }, [shot]);

  // Show the thumbnail at once, then the full file when it has loaded.
  useEffect(() => {
    let live = true;
    setSrc(shot.thumb);
    setZoom(null);
    const full = new Image();
    full.src = shot.full;
    full.decode().then(() => live && setSrc(shot.full)).catch(() => undefined);
    // Warm the neighbours so stepping through is instant.
    [shots[index - 1], shots[index + 1]].forEach((next) => {
      if (next) new Image().src = next.full;
    });
    return () => {
      live = false;
    };
  }, [shot, shots, index]);

  /** Fly between the thumbnail on the page and the large view. */
  const fly = useCallback((direction: 'in' | 'out') => {
    const img = imgRef.current;
    if (!img) return Promise.resolve();
    const from = rectOf(shot.el);
    const to = rectOf(img);
    if (!from.width || !to.width || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return Promise.resolve();
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    const scale = from.width / to.width;
    const lifted = `translate(${dx}px, ${dy}px) scale(${scale})`;
    const frames = direction === 'in' ? [{ transform: lifted, borderRadius: '10px' }, { transform: 'none', borderRadius: '18px' }] : [{ transform: 'none' }, { transform: lifted, opacity: 0.9 }];
    const animation = img.animate(frames, { duration: MS, easing: EASE, fill: 'forwards' });
    // Once it has landed, drop the held frame so zooming can transform the image.
    return animation.finished.then(() => { if (direction === 'in') animation.cancel(); }).catch(() => undefined);
  }, [shot]);

  useLayoutEffect(() => {
    void fly('in').then(() => setPhase('open'));
    closeRef.current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = useCallback(() => {
    if (phase === 'out') return;
    setPhase('out');
    setZoom(null);
    void fly('out').then(() => {
      onClosed();
      (returnFocus.current as HTMLElement | null)?.focus?.({ preventScroll: true });
    });
  }, [fly, onClosed, phase]);

  const go = useCallback((step: number) => {
    if (shots.length < 2) return;
    setIndex((current) => (current + step + shots.length) % shots.length);
  }, [shots.length]);

  // Keys belong to the viewer while it is open, not the notebook underneath.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      else if (event.key === 'ArrowRight') go(1);
      else if (event.key === 'ArrowLeft') go(-1);
      else if (event.key === 'Tab') {
        const focusable = Array.from(document.querySelectorAll<HTMLElement>('.lb button'));
        const at = focusable.indexOf(document.activeElement as HTMLElement);
        event.preventDefault();
        focusable[(at + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length]?.focus();
      } else return;
      event.stopImmediatePropagation();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [close, go]);

  const toggleZoom = (event: React.MouseEvent<HTMLImageElement>) => {
    event.stopPropagation();
    if (zoom) return setZoom(null);
    const r = event.currentTarget.getBoundingClientRect();
    setZoom({ x: ((event.clientX - r.left) / r.width) * 100, y: ((event.clientY - r.top) / r.height) * 100 });
  };

  const pan = (event: React.PointerEvent<HTMLImageElement>) => {
    if (!zoom || event.pointerType !== 'mouse') return;
    const r = event.currentTarget.getBoundingClientRect();
    setZoom({ x: Math.min(100, Math.max(0, ((event.clientX - r.left) / r.width) * 100)), y: Math.min(100, Math.max(0, ((event.clientY - r.top) / r.height) * 100)) });
  };

  return createPortal(
    <div
      className={`lb lb-${phase}`}
      role="dialog"
      aria-modal="true"
      aria-label={`Screenshot: ${shot.caption}`}
      onClick={close}
      onTouchStart={(event) => {
        const t = event.touches[0];
        touch.current = { x: t.clientX, y: t.clientY, t: Date.now() };
      }}
      onTouchEnd={(event) => {
        const start = touch.current;
        touch.current = null;
        if (!start || zoom) return;
        const t = event.changedTouches[0];
        const dx = t.clientX - start.x;
        const dy = t.clientY - start.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
        else if (dy > 80 && Math.abs(dy) > Math.abs(dx)) close();
      }}
    >
      <div className="lb-stage">
        <img
          ref={imgRef}
          key={index}
          src={src}
          alt={shot.caption}
          className={`lb-img${zoom ? ' zoomed' : ''}`}
          style={zoom ? { transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          onClick={toggleZoom}
          onPointerMove={pan}
          onDoubleClick={(event) => event.stopPropagation()}
          draggable={false}
        />
      </div>
      <div className="lb-bar" onClick={(event) => event.stopPropagation()}>
        <p className="lb-caption">
          <span>{shot.caption}</span>
          {shot.detail && <small>{shot.detail}</small>}
        </p>
        {shots.length > 1 && <p className="lb-count" aria-live="polite">{index + 1} / {shots.length}</p>}
        <p className="lb-hint">{zoom ? 'tap to zoom out' : 'tap the image to zoom · ← → · esc'}</p>
      </div>
      {shots.length > 1 && (
        <>
          <button type="button" className="lb-nav lb-prev" aria-label="Previous screenshot" onClick={(event) => { event.stopPropagation(); go(-1); }}>←</button>
          <button type="button" className="lb-nav lb-next" aria-label="Next screenshot" onClick={(event) => { event.stopPropagation(); go(1); }}>→</button>
        </>
      )}
      <button ref={closeRef} type="button" className="lb-close" aria-label="Close the screenshot" onClick={(event) => { event.stopPropagation(); close(); }}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
    </div>,
    document.body,
  );
};
