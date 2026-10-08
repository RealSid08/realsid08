import { applyTheme } from '../theme';
import { notebook, whenNotebook } from '../notebook';
import { TOUR, isTargetId, targetName } from '../../lib/portfolioIds';
import { matchingTargets } from '../localKnowledge';

/**
 * What the assistant can do to the notebook. Everything here is reversible or
 * short-lived, and every call is recorded so the visitor can see it and undo it.
 */

export type ActionKind = 'view' | 'navigate' | 'focus';

export type ActionRecord = {
  id: string;
  tool: string;
  label: string;
  kind: ActionKind;
  at: number;
  undo?: () => void;
};

type Listener = (records: ActionRecord[]) => void;

const records: ActionRecord[] = [];
const listeners = new Set<Listener>();
let counter = 0;
let externalAgent = false;
const externalListeners = new Set<(active: boolean) => void>();

export const setExternalAgent = (active: boolean) => {
  externalAgent = active;
  externalListeners.forEach((listener) => listener(active));
};

export const onExternalAgent = (listener: (active: boolean) => void) => {
  externalListeners.add(listener);
  listener(externalAgent);
  return () => {
    externalListeners.delete(listener);
  };
};

export const onActions = (listener: Listener) => {
  listeners.add(listener);
  listener([...records]);
  return () => {
    listeners.delete(listener);
  };
};

const emit = () => listeners.forEach((listener) => listener([...records]));

const record = (entry: Omit<ActionRecord, 'id' | 'at'>) => {
  records.unshift({ ...entry, id: `a${++counter}`, at: Date.now() });
  if (records.length > 25) records.pop();
  emit();
};

export const clearActions = () => {
  records.length = 0;
  emit();
};

export const undoAll = () => {
  [...records].forEach((entry) => entry.undo?.());
  clearActions();
};

/* Page actions arrive one after another; each waits for the previous turn to finish. */
let queue: Promise<unknown> = Promise.resolve();
const serial = <T>(task: () => Promise<T>) => {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
};

const bare = (target: string) => target.replace(/^#/, '');

/* ---------- actions ---------- */

/** Turn the notebook to a page, a role or a project. With `circle`, ring it in pen once it is in view. */
export const turnTo = (target: string, circle = false) =>
  serial(async () => {
    const id = bare(target);
    if (!isTargetId(id)) return { ok: false, error: `Unknown target ${id}` };
    const book = await whenNotebook();
    const shown = await book.show(id);
    if (!shown) return { ok: false, error: `${targetName(id)} is not in the notebook` };
    let undo: (() => void) | undefined;
    if (circle) undo = book.circle(id) ?? undefined;
    record({ tool: 'turn_to', label: `Turned to ${targetName(id)}${circle ? ' and circled it' : ''}`, kind: 'navigate', undo });
    return { ok: true, page: shown.page, pageName: shown.name };
  });

/** Ring something already on the open pages, turning to it first if needed. */
export const circle = (target: string) => turnTo(target, true);

/** Dim everything on the open pages except one target. */
export const focusOn = (target?: string) =>
  serial(async () => {
    const book = await whenNotebook();
    if (target) {
      const id = bare(target);
      if (!isTargetId(id)) return { ok: false, error: `Unknown target ${id}` };
      await book.show(id);
    }
    const undo = book.focus(target ? bare(target) : undefined);
    record({ tool: 'focus', label: target ? `Focused on ${targetName(bare(target))}` : 'Focused the page', kind: 'focus', undo });
    return { ok: true };
  });

/** Turn to the contents and tick every row whose work uses a technology or matches a phrase. */
export const markWork = (query: string) =>
  serial(async () => {
    const book = await whenNotebook();
    const targets = matchingTargets(query);
    await book.home();
    const result = book.tickContents(new Set(targets));
    record({
      tool: 'mark_work',
      label: result.titles.length ? `Ticked ${result.titles.length} of ${result.of} entries for ${query}` : `Nothing in the contents matches ${query}`,
      kind: 'view',
      undo: result.undo,
    });
    return { ok: true, query, ticked: result.titles, of: result.of };
  });

export const setTheme = (theme: 'light' | 'dark') => {
  const previous = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  applyTheme(theme);
  record({ tool: 'set_theme', label: theme === 'dark' ? 'Turned the lamp off' : 'Turned the lamp on', kind: 'view', undo: () => applyTheme(previous) });
  return { ok: true, theme };
};

export const resetView = () => {
  stopTour();
  undoAll();
  return { ok: true };
};

export const getState = () => {
  const book = notebook();
  const state = book?.state();
  return {
    theme: document.documentElement.dataset.theme ?? 'light',
    open: state?.visible ?? [],
    layout: state?.solo ? 'phone, one page at a time' : 'two-page spread',
    focused: document.querySelector('.nb-focus') !== null,
    tour: tourState(),
  };
};

/* ---------- tour ---------- */

let tourIndex = -1;
let tourUndo: (() => void) | undefined;

export type TourState = { step: number; of: number; target: string } | null;
const tourListeners = new Set<(state: TourState) => void>();
const tourState = (): TourState => (tourIndex < 0 ? null : { step: tourIndex + 1, of: TOUR.length, target: TOUR[tourIndex] });
const emitTour = () => tourListeners.forEach((listener) => listener(tourState()));

export const onTour = (listener: (state: TourState) => void) => {
  tourListeners.add(listener);
  listener(tourState());
  return () => {
    tourListeners.delete(listener);
  };
};

const stopTour = () => {
  tourUndo?.();
  tourUndo = undefined;
  tourIndex = -1;
  emitTour();
};

/** Step through the work one entry at a time, circling each title. */
export const tour = (action: 'start' | 'next' | 'prev' | 'stop') =>
  serial(async () => {
    if (action === 'stop') {
      stopTour();
      return { stopped: true };
    }
    tourIndex = action === 'start' ? 0 : action === 'prev' ? Math.max(0, tourIndex - 1) : Math.min(TOUR.length - 1, tourIndex + 1);
    const target = TOUR[tourIndex];
    tourUndo?.();
    const book = await whenNotebook();
    await book.show(target);
    tourUndo = book.circle(target, 60_000) ?? undefined;
    emitTour();
    return { step: tourIndex + 1, of: TOUR.length, target, name: targetName(target) };
  });

/* ---------- peek ---------- */

/** Highlight a target while a chat reference to it is hovered. Not recorded: nothing changed. */
export const peek = (target: string | null) => {
  notebook()?.peek(target ? bare(target) : null);
};
