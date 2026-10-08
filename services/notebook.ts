import type { NotebookEngine } from '../components/notebook/engine';

/** The mounted notebook, so page actions can turn it without importing React. */
let current: NotebookEngine | null = null;
const waiters = new Set<(engine: NotebookEngine) => void>();

export const setNotebook = (engine: NotebookEngine | null) => {
  current = engine;
  if (engine) {
    waiters.forEach((resolve) => resolve(engine));
    waiters.clear();
  }
};

export const notebook = () => current;

/** Resolves with the notebook once it has mounted; an action that runs early waits for it. */
export const whenNotebook = (): Promise<NotebookEngine> =>
  current ? Promise.resolve(current) : new Promise((resolve) => waiters.add(resolve));
