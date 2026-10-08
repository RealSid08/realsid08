/**
 * Turns the notebook's pages. React renders the leaves once; this class owns
 * everything that moves, so a page turn never re-renders the book.
 *
 * State: `s` is the number of leaves turned (0 is the closed cover, N the back
 * cover). On a phone (`solo`) one page shows at a time; `p` is that page and the
 * book slides under the frame.
 */

export type NotebookState = {
  spread: number;
  page: number;
  solo: boolean;
  label: string;
  canGoBack: boolean;
  canGoForward: boolean;
  /** names of the pages in view */
  visible: string[];
};

type Listener = (state: NotebookState) => void;

const TURN_MS = 1050;
const RIFFLE_MS = 620;
const RIFFLE_GAP_MS = 85;
const PHONE_BREAKPOINT = 640;

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

export class NotebookEngine {
  private s = 0;
  private p = 0;
  private solo = false;
  private W = 480;
  private H = 640;
  private CW = 1100;
  private riffling = false;
  private settleUntil = 0;
  private revealTimer = 0;
  private drag: null | { solo: true; x: number; y: number } | { solo: false; leaf: HTMLElement; dir: number; x: number; a: number; moved: boolean } = null;
  private listeners = new Set<Listener>();
  private cleanups: Array<() => void> = [];
  readonly pages: HTMLElement[];
  readonly leaves: HTMLElement[];
  readonly N: number;

  constructor(
    private readonly el: {
      stage: HTMLElement;
      fit: HTMLElement;
      canvas: HTMLElement;
      shift: HTMLElement;
      shadow: HTMLElement;
      edgeL: HTMLElement;
      edgeR: HTMLElement;
      ribbon: HTMLElement;
      book: HTMLElement;
      desk: HTMLElement;
    },
  ) {
    this.leaves = Array.from(el.book.querySelectorAll<HTMLElement>(':scope > .leaf'));
    this.pages = Array.from(el.book.querySelectorAll<HTMLElement>('section.pg')).sort(
      (a, b) => Number(a.dataset.page) - Number(b.dataset.page),
    );
    this.N = this.leaves.length;
    this.bind();
    const observer = new ResizeObserver(() => this.fit());
    observer.observe(el.stage);
    this.cleanups.push(() => observer.disconnect());
    this.fit();
    this.paint();
  }

  destroy() {
    this.cleanups.forEach((cleanup) => cleanup());
    window.clearTimeout(this.revealTimer);
    this.listeners.clear();
  }

  /* ---------- state ---------- */

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.state());
    return () => {
      this.listeners.delete(listener);
    };
  }

  state(): NotebookState {
    const { s, p, N, solo } = this;
    const label = solo
      ? p === 0 ? 'Cover' : p === 2 * N - 1 ? 'Back cover' : `${this.pages[p].dataset.name} · p. ${p}`
      : s === 0 ? 'Cover' : s === N ? 'Back cover' : `${this.pages[2 * s].dataset.name} · pp. ${2 * s - 1}–${2 * s}`;
    return {
      spread: s,
      page: p,
      solo,
      label,
      canGoBack: solo ? p > 0 : s > 0,
      canGoForward: solo ? p < 2 * N - 1 : s < N,
      visible: this.visiblePages().map((page) => page.dataset.name ?? ''),
    };
  }

  private emit() {
    const state = this.state();
    this.listeners.forEach((listener) => listener(state));
  }

  /** The pages a visitor can see right now. */
  visiblePages() {
    if (this.solo) return [this.pages[this.p]];
    return [this.pages[2 * this.s - 1], this.pages[2 * this.s]].filter(Boolean);
  }

  /** Resolves once the last turn and slide have settled. */
  settled() {
    return wait(Math.max(0, this.settleUntil - Date.now()) + 60);
  }

  /* ---------- painting ---------- */

  private paint() {
    const { s, N, W, solo, el } = this;
    this.leaves.forEach((leaf, i) => {
      leaf.classList.toggle('flipped', i < s);
      if (!leaf.classList.contains('turning')) leaf.style.zIndex = String(i < s ? i + 1 : N - i + 1);
    });
    el.book.dataset.s = String(s);
    const left = solo && this.p % 2 === 1;
    el.shift.style.transform = solo
      ? left ? '' : `translateX(-${W}px)`
      : s === 0 ? `translateX(-${W / 2}px)` : s === N ? `translateX(${W / 2}px)` : '';
    el.shadow.style.left = (solo ? !left : s === 0) ? `${W}px` : '0';
    el.shadow.style.right = (solo ? left : s === N) ? `${W}px` : '0';
    el.edgeL.style.width = s === 0 ? '0' : `${2 + s * 1.2}px`;
    el.edgeL.style.left = s === 0 ? `${W}px` : `${W - 2 - s * 1.2}px`;
    el.edgeR.style.width = s === N ? '0' : `${2 + (N - s) * 1.2}px`;
    el.edgeR.style.left = s === N ? `${W}px` : `${2 * W}px`;
    el.ribbon.style.opacity = !solo && s > 0 && s < N ? '1' : '0';
    // Only the pages in view can be focused or read by a screen reader.
    const visible = new Set(this.visiblePages());
    this.pages.forEach((page) => {
      const hidden = !visible.has(page);
      page.toggleAttribute('inert', hidden);
      page.setAttribute('aria-hidden', String(hidden));
    });
    window.clearTimeout(this.revealTimer);
    this.revealTimer = window.setTimeout(() => this.reveal(), 650);
    this.emit();
  }

  /** Replay the figures on the pages that just came into view. */
  private reveal() {
    this.visiblePages().forEach((page) => {
      page.querySelectorAll<HTMLElement>('[data-reveal]').forEach((figure) => {
        figure.classList.remove('is-in');
        void figure.offsetWidth;
        figure.classList.add('is-in');
      });
    });
  }

  private turn(leaf: HTMLElement, ms = TURN_MS, z = 100) {
    leaf.classList.add('turning');
    leaf.style.zIndex = String(z);
    if (ms !== TURN_MS) leaf.style.transitionDuration = `${ms}ms`;
    this.settleUntil = Math.max(this.settleUntil, Date.now() + ms);
    window.setTimeout(() => {
      leaf.classList.remove('turning');
      leaf.style.transitionDuration = '';
      this.paint();
    }, ms + 30);
  }

  private step(dir: number, ms?: number, z?: number) {
    const t = this.s + dir;
    if (t < 0 || t > this.N) return;
    this.turn(this.leaves[dir > 0 ? this.s : this.s - 1], ms, z);
    this.s = t;
    this.p = t === 0 ? 0 : 2 * t - 1;
    this.slid();
    this.paint();
  }

  /** One page at a time: turn a leaf only when leaving a right-hand page forwards or a left-hand page backwards. */
  private stepPage(dir: number) {
    const t = this.p + dir;
    if (t < 0 || t > 2 * this.N - 1) return;
    if (dir > 0 && this.p % 2 === 0) { this.turn(this.leaves[this.s]); this.s += 1; }
    if (dir < 0 && this.p % 2 === 1) { this.turn(this.leaves[this.s - 1]); this.s -= 1; }
    this.p = t;
    this.slid();
    this.paint();
  }

  private slid() {
    this.settleUntil = Math.max(this.settleUntil, Date.now() + 900);
  }

  /* ---------- navigation ---------- */

  next(dir: 1 | -1) {
    if (this.riffling) return;
    if (this.solo) this.stepPage(dir);
    else this.step(dir);
  }

  /**
   * Riffle to a spread. Each later leaf rides above the one before, so the stack
   * fans over cleanly. On a phone, land on `page`, or the spread's first page.
   */
  async go(spread: number, page?: number) {
    const t = Math.max(0, Math.min(this.N, spread));
    if (this.riffling) return;
    const land = () => {
      if (!this.solo) return;
      const target = page ?? (t === 0 ? 0 : 2 * t - 1);
      if (target !== this.p) { this.p = target; this.slid(); this.paint(); }
    };
    if (t === this.s) { land(); return this.settled(); }
    const dir = Math.sign(t - this.s);
    const n = Math.abs(t - this.s);
    if (n === 1) { this.step(dir); land(); return this.settled(); }
    this.riffling = true;
    for (let k = 0; k < n; k += 1) {
      this.step(dir, RIFFLE_MS, 100 + k);
      if (k < n - 1) await wait(RIFFLE_GAP_MS);
    }
    await wait(RIFFLE_MS);
    this.riffling = false;
    land();
    return this.settled();
  }

  /** Turn to the page that holds a target id and resolve when it is in view. */
  async show(id: string) {
    const target = this.find(id);
    if (!target) return null;
    const page = target.closest<HTMLElement>('section.pg');
    if (!page) return null;
    const index = Number(page.dataset.page);
    const spread = index % 2 === 1 ? (index + 1) / 2 : index / 2;
    await this.go(spread, index);
    return { page: index, name: page.dataset.name ?? '' };
  }

  find(id: string) {
    const bare = id.replace(/^#/, '');
    return this.el.book.querySelector<HTMLElement>(`[data-target~="${CSS.escape(bare)}"]`);
  }

  home() {
    return this.go(1, 2);
  }

  /* ---------- marks the assistant leaves on the page ---------- */

  /** The part of a target worth circling: its title if it marks one. */
  private markOf(id: string) {
    const target = this.find(id);
    if (!target) return null;
    return target.matches('[data-mark]') ? target : target.querySelector<HTMLElement>('[data-mark]') ?? target;
  }

  /** Draw a pen circle around a target that is in view. Returns a function that rubs it out. */
  circle(id: string, durationMs = 4200) {
    const mark = this.markOf(id);
    const page = mark?.closest<HTMLElement>('section.pg');
    if (!mark || !page) return null;
    const scale = this.el.canvas.getBoundingClientRect().width / this.CW || 1;
    const r = mark.getBoundingClientRect();
    const pr = page.getBoundingClientRect();
    const pad = 12;
    const x = (r.left - pr.left) / scale - pad;
    const y = (r.top - pr.top) / scale - pad * 0.7;
    const w = r.width / scale + pad * 2;
    const h = r.height / scale + pad * 1.4;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'pen-mark');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    Object.assign(svg.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
    // Two loose loops, like a quick circle drawn twice by hand.
    const loop = (inset: number, tilt: number) => {
      const rx = w / 2 - inset;
      const ry = h / 2 - inset;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute(
        'd',
        `M ${w / 2 - rx * 0.2} ${h / 2 - ry} C ${w / 2 + rx * 0.9} ${h / 2 - ry * 1.05}, ${w / 2 + rx * 1.02} ${h / 2 + ry * 0.95}, ${w / 2} ${h / 2 + ry} ` +
          `S ${w / 2 - rx * 1.04} ${h / 2 + ry * 0.2}, ${w / 2 - rx * 0.86} ${h / 2 - ry * 0.55} S ${w / 2 + rx * 0.3} ${h / 2 - ry * 1.12}, ${w / 2 + rx * 0.62} ${h / 2 - ry * 0.82}`,
      );
      path.setAttribute('transform', `rotate(${tilt} ${w / 2} ${h / 2})`);
      return path;
    };
    svg.append(loop(2, -1.5), loop(5, 1.2));
    page.appendChild(svg);
    let removed = false;
    const remove = () => {
      if (removed) return;
      removed = true;
      svg.classList.add('fading');
      window.setTimeout(() => svg.remove(), 400);
    };
    window.setTimeout(remove, durationMs);
    return remove;
  }

  /** A highlighter swipe while a chat link to the target is hovered. */
  peek(id: string | null) {
    this.el.book.querySelectorAll('[data-agent-peek]').forEach((node) => node.removeAttribute('data-agent-peek'));
    if (id) this.markOf(id)?.setAttribute('data-agent-peek', '');
  }

  /** Dim everything on the open pages except the path to one target. */
  focus(id?: string) {
    const target = id ? this.find(id) : null;
    const dimmed: HTMLElement[] = [];
    const pages = this.visiblePages();
    pages.forEach((page) => {
      if (target && !page.contains(target)) {
        dimmed.push(page);
        return;
      }
      if (!target || target === page) return;
      let node: HTMLElement | null = target;
      while (node && node !== page) {
        const parent: HTMLElement | null = node.parentElement;
        if (!parent) break;
        Array.from(parent.children).forEach((sibling) => {
          if (sibling !== node && sibling instanceof HTMLElement && !sibling.classList.contains('folio')) dimmed.push(sibling);
        });
        node = parent;
      }
    });
    dimmed.forEach((node) => node.setAttribute('data-agent-dim', ''));
    this.el.desk.classList.add('nb-focus');
    return () => {
      dimmed.forEach((node) => node.removeAttribute('data-agent-dim'));
      this.el.desk.classList.remove('nb-focus');
    };
  }

  /** Tick the contents rows that cover any of these targets. Returns the rows ticked. */
  tickContents(targets: Set<string>) {
    const rows = Array.from(this.el.book.querySelectorAll<HTMLElement>('[data-row]'));
    const ticked = rows.filter((row) => (row.dataset.row ?? '').split(' ').some((id) => targets.has(id)));
    ticked.forEach((row, index) => {
      row.style.setProperty('--tick-delay', `${index * 0.18}s`);
      row.setAttribute('data-ticked', '');
    });
    rows.filter((row) => !ticked.includes(row)).forEach((row) => row.setAttribute('data-unticked', ''));
    return {
      titles: ticked.map((row) => row.querySelector('b')?.textContent ?? ''),
      of: rows.length,
      undo: () => rows.forEach((row) => { row.removeAttribute('data-ticked'); row.removeAttribute('data-unticked'); }),
    };
  }

  /* ---------- input ---------- */

  private bind() {
    const { book } = this.el;
    const scale = () => this.el.canvas.getBoundingClientRect().width / this.CW || 1;
    const on = <K extends keyof HTMLElementEventMap>(target: HTMLElement | Window, type: K, handler: (event: HTMLElementEventMap[K]) => void) => {
      target.addEventListener(type, handler as EventListener);
      this.cleanups.push(() => target.removeEventListener(type, handler as EventListener));
    };

    on(book, 'click', (event) => {
      const go = (event.target as HTMLElement).closest<HTMLElement>('[data-go]');
      if (!go) return;
      event.preventDefault();
      void this.go(Number(go.dataset.go));
    });

    on(book, 'pointerdown', (event) => {
      const target = event.target as HTMLElement;
      if (target.closest('[data-go], a[href], button') || this.riffling) return;
      if (this.solo) { this.drag = { solo: true, x: event.clientX, y: event.clientY }; return; }
      const leaf = target.closest<HTMLElement>('.leaf');
      if (!leaf) return;
      const i = this.leaves.indexOf(leaf);
      const dir = i === this.s ? 1 : i === this.s - 1 ? -1 : 0;
      if (!dir) return;
      this.drag = { solo: false, leaf, dir, x: event.clientX, a: dir > 0 ? 0 : -180, moved: false };
      book.setPointerCapture(event.pointerId);
    });

    on(book, 'pointermove', (event) => {
      const drag = this.drag;
      if (!drag || drag.solo) return;
      const dx = (event.clientX - drag.x) / scale();
      if (Math.abs(dx) > 6) drag.moved = true;
      if (!drag.moved) return;
      const base = drag.dir > 0 ? 0 : -180;
      drag.a = Math.max(-180, Math.min(0, base + (dx / (this.W * 1.1)) * 180));
      drag.leaf.style.transition = 'none';
      drag.leaf.style.zIndex = '100';
      drag.leaf.style.transform = `rotateY(${drag.a}deg)`;
      drag.leaf.style.setProperty('--t', String(-drag.a / 180));
    });

    on(book, 'pointerup', (event) => {
      const drag = this.drag;
      this.drag = null;
      if (!drag) return;
      if (drag.solo) {
        const dx = event.clientX - drag.x;
        const dy = event.clientY - drag.y;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) this.next(dx < 0 ? 1 : -1);
        else if (Math.abs(dx) < 8 && Math.abs(dy) < 8) this.next(1);
        return;
      }
      const { leaf, dir, a, moved } = drag;
      leaf.style.transition = '';
      leaf.style.transform = '';
      leaf.style.removeProperty('--t');
      if (!moved) { this.step(dir); return; }
      if (dir > 0 ? a < -55 : a > -125) this.step(dir);
      else this.turn(leaf);
    });

    on(book, 'pointercancel', () => { this.drag = null; });

    on(window, 'keydown', (event) => {
      const target = event.target as HTMLElement | null;
      if (target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'ArrowRight') this.next(1);
      if (event.key === 'ArrowLeft') this.next(-1);
    });
  }

  /* ---------- sizing ---------- */

  /** A two-page spread on wide screens, one tall page on phones. Fits both width and height. */
  fit() {
    const { stage, fit, canvas, shift, desk } = this.el;
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (!width || !height) return;
    const was = this.solo;
    this.solo = width < PHONE_BREAKPOINT;
    desk.classList.toggle('solo', this.solo);
    this.W = this.solo ? 380 : 480;
    this.H = this.solo ? 700 : 640;
    this.CW = this.solo ? this.W + 16 : 1100;
    const CH = this.solo ? this.H + 22 : 730;
    Object.assign(shift.style, this.solo ? { left: '8px', top: '10px' } : { left: '70px', top: '30px' }, { width: `${2 * this.W}px`, height: `${this.H}px` });
    Object.assign(canvas.style, { width: `${this.CW}px`, height: `${CH}px` });
    const controls = 48;
    const k = Math.max(0.3, Math.min(1.15, (width - (this.solo ? 8 : 24)) / this.CW, Math.max(this.solo ? 0.72 : 0.4, (height - controls) / CH)));
    canvas.style.transform = `scale(${k})`;
    fit.style.width = `${this.CW * k}px`;
    fit.style.height = `${CH * k}px`;
    if (this.solo !== was) {
      this.p = this.s === 0 ? 0 : 2 * this.s - 1;
      this.paint();
    }
  }
}
