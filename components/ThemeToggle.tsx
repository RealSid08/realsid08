import React from 'react';
import { useTheme } from '../services/theme';

const SunIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" strokeLinecap="round" />
  </svg>
);

const MoonIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
    <path d="M20 14.5A8.5 8.5 0 019.5 4a7 7 0 1010.5 10.5z" strokeLinejoin="round" />
  </svg>
);

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  const label = next === 'light' ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      title={label}
      aria-label={label}
      className="fixed top-4 right-4 md:top-6 md:right-6 z-50 flex items-center gap-2 border border-white/20 bg-black/70 backdrop-blur px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:border-white/50 hover:text-white transition-colors"
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
    </button>
  );
};
