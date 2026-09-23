/**
 * Page actions the agent can take. Everything here is reversible or
 * short-lived, and every call is recorded so the UI can show what happened.
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

/* ---------- element helpers ---------- */

const byId = (target: string) =>
  document.getElementById(target.replace(/^#/, '')) ??
  document.querySelector<HTMLElement>(`.agent-anchor-${target}`);

/** every top-level block that focus mode can dim */
const blocks = () =>
  Array.from(document.querySelectorAll<HTMLElement>('header, main > section, footer'));

/* ---------- actions ---------- */

export const navigateTo = (section: string) => {
  const el = byId(section);
  if (!el) return false;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  record({ tool: 'navigate_to', label: `Scrolled to ${section}`, kind: 'navigate' });
  return true;
};

export const highlight = (target: string, durationMs = 1800) => {
  const el = byId(target);
  if (!el) return false;
  const previous = el.style.boxShadow;
  const previousTransition = el.style.transition;
  el.style.transition = 'box-shadow 240ms ease';
  el.style.boxShadow = '0 0 0 2px rgb(var(--accent))';
  const undo = () => {
    el.style.boxShadow = previous;
    el.style.transition = previousTransition;
  };
  window.setTimeout(undo, durationMs);
  record({ tool: 'highlight', label: `Highlighted ${target}`, kind: 'focus', undo });
  return true;
};

export const focusMode = (target?: string) => {
  const keep = target ? byId(target) : null;
  const dimmed = blocks().filter((block) => block !== keep && !block.contains(keep ?? null));
  dimmed.forEach((block) => block.setAttribute('data-agent-dim', ''));
  document.body.classList.add('agent-focus');
  const undo = () => {
    dimmed.forEach((block) => block.removeAttribute('data-agent-dim'));
    document.body.classList.remove('agent-focus');
  };
  record({ tool: 'focus_mode', label: keep ? `Focused ${target}` : 'Focused the page', kind: 'focus', undo });
  return true;
};

export const setVisibility = (section: string, visible: boolean) => {
  const el = byId(section);
  if (!el) return false;
  const previous = el.style.display;
  el.style.display = visible ? '' : 'none';
  record({
    tool: 'set_visibility',
    label: `${visible ? 'Showed' : 'Hid'} ${section}`,
    kind: 'view',
    undo: () => {
      el.style.display = previous;
    },
  });
  return true;
};

export const setTheme = (theme: 'light' | 'dark') => {
  const root = document.documentElement;
  const previous = root.dataset.theme === 'dark' ? 'dark' : 'light';
  root.dataset.theme = theme;
  try {
    localStorage.setItem('theme', theme);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent('themechange'));
  record({
    tool: 'set_theme',
    label: `Switched to ${theme}`,
    kind: 'view',
    undo: () => setTheme(previous),
  });
  return true;
};

export const resetView = () => {
  undoAll();
  return true;
};

/* ---------- cards ---------- */

const cards = () =>
  Array.from(document.querySelectorAll<HTMLElement>('[id^="exp-"], [id^="project-"]'));

export const filterWork = (filter: { year?: number; tech?: string; query?: string }) => {
  const snapshot = cards().map((el) => ({ el, hidden: el.hidden }));
  let shown = 0;

  snapshot.forEach(({ el }) => {
    const year = Number(el.dataset.year ?? 0);
    const tech = el.dataset.tech ?? '';
    const text = (el.textContent ?? '').toLowerCase();
    const matches =
      (!filter.year || year === filter.year) &&
      (!filter.tech || tech.includes(filter.tech.toLowerCase())) &&
      (!filter.query || text.includes(filter.query.toLowerCase()));
    el.hidden = !matches;
    if (matches) shown += 1;
  });

  const description = [
    filter.year ? String(filter.year) : null,
    filter.tech ?? null,
    filter.query ? `“${filter.query}”` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  record({
    tool: 'filter_work',
    label: `Filtered to ${shown} of ${snapshot.length} cards${description ? ` (${description})` : ''}`,
    kind: 'view',
    undo: () => snapshot.forEach(({ el, hidden }) => {
      el.hidden = hidden;
    }),
  });

  return { shown, of: snapshot.length };
};

export const sortWork = (by: 'year' | 'title', direction: 'asc' | 'desc' = 'desc') => {
  const snapshot: Array<{ wrapper: HTMLElement; order: string }> = [];
  const containers = new Set<HTMLElement>();

  cards().forEach((el) => {
    const wrapper = el.parentElement;
    const container = wrapper?.parentElement;
    if (!wrapper || !container) return;
    containers.add(container);
    snapshot.push({ wrapper, order: wrapper.style.order });
  });

  const valueOf = (el: HTMLElement) =>
    by === 'year' ? Number(el.dataset.year ?? 0) : (el.dataset.title ?? el.textContent ?? '');

  containers.forEach((container) => {
    const items = Array.from(container.children).filter((child): child is HTMLElement =>
      child instanceof HTMLElement && child.querySelector('[id^="exp-"], [id^="project-"]') !== null,
    );
    items
      .sort((a, b) => {
        const left = valueOf(a.querySelector('[id^="exp-"], [id^="project-"]') as HTMLElement);
        const right = valueOf(b.querySelector('[id^="exp-"], [id^="project-"]') as HTMLElement);
        if (left === right) return 0;
        const result = left > right ? 1 : -1;
        return direction === 'asc' ? result : -result;
      })
      .forEach((item, index) => {
        item.style.order = String(index);
      });
  });

  record({
    tool: 'sort_work',
    label: `Sorted the work by ${by}`,
    kind: 'view',
    undo: () => snapshot.forEach(({ wrapper, order }) => {
      wrapper.style.order = order;
    }),
  });

  return { sorted: snapshot.length };
};

export const expandCard = (target: string, expanded = true) => {
  const el = byId(target);
  const collapsible = el?.querySelector<HTMLElement>('[data-collapsible]');
  if (!collapsible) return false;
  const previous = collapsible.hidden;
  collapsible.hidden = !expanded;
  record({
    tool: 'expand_card',
    label: `${expanded ? 'Expanded' : 'Collapsed'} ${target}`,
    kind: 'view',
    undo: () => {
      collapsible.hidden = previous;
    },
  });
  return true;
};

export const getState = () => ({
  theme: document.documentElement.dataset.theme ?? 'light',
  focused: document.body.classList.contains('agent-focus'),
  hidden: blocks()
    .map((block) => block.id)
    .filter((id) => id && byId(id)?.style.display === 'none'),
  visibleSections: blocks()
    .filter((block) => block.id && block.style.display !== 'none')
    .map((block) => block.id),
});

/* ---------- walkthrough ---------- */

let walkthroughSteps: string[] = [];
let walkthroughIndex = -1;

export const walkthrough = (action: 'start' | 'next' | 'prev' | 'stop') => {
  if (action === 'start') {
    walkthroughSteps = Array.from(
      document.querySelectorAll<HTMLElement>('[id^="project-"], [id^="exp-"]'),
    ).map((el) => el.id);
    walkthroughIndex = -1;
  }
  if (action === 'stop') {
    undoAll();
    walkthroughSteps = [];
    walkthroughIndex = -1;
    return { stopped: true };
  }
  if (walkthroughSteps.length === 0) return { steps: 0 };

  walkthroughIndex =
    action === 'prev'
      ? Math.max(0, walkthroughIndex - 1)
      : Math.min(walkthroughSteps.length - 1, walkthroughIndex + 1);
  const target = walkthroughSteps[walkthroughIndex];
  navigateTo(target);
  focusMode(target);
  return { step: walkthroughIndex + 1, of: walkthroughSteps.length, target };
};
