import { useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'theme';
const EVENT = 'themechange';

export const readTheme = (): Theme =>
  typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark'
    ? 'dark'
    : 'light';

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'light' ? '#ffffff' : '#050505');
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // storage can be unavailable in private modes; the attribute still applies
  }
  window.dispatchEvent(new CustomEvent<Theme>(EVENT, { detail: theme }));
}

export function useTheme(): [Theme, (theme: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(readTheme);

  useEffect(() => {
    const sync = () => setTheme(readTheme());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  return [theme, applyTheme];
}
