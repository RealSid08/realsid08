import React, { useEffect, useMemo, useRef, useState } from 'react';
import { paletteEntries, runTool, TOOLS } from '../../services/agent/registry';

type Props = {
  open: boolean;
  onClose: () => void;
};

export const CommandPalette: React.FC<Props> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const entries = useMemo(() => {
    const all = paletteEntries;
    if (!query.trim()) return all;
    const needle = query.toLowerCase();
    return all.filter((entry) => entry.label.toLowerCase().includes(needle) || entry.name.includes(needle));
  }, [query]);

  const toolCount = TOOLS.length;

  useEffect(() => {
    if (open) {
      setQuery('');
      setIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  if (!open) return null;

  const run = (name: string, args: Record<string, unknown>) => {
    runTool(name, args);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-label="Command palette"
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[18vh] px-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card-surface w-full max-w-lg border border-white/15 bg-black/95"
        onClick={(event) => event.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIndex(0);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') onClose();
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setIndex((value) => Math.min(entries.length - 1, value + 1));
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              setIndex((value) => Math.max(0, value - 1));
            }
            if (event.key === 'Enter' && entries[index]) {
              event.preventDefault();
              run(entries[index].name, entries[index].args);
            }
          }}
          placeholder="Run an action"
          className="w-full bg-transparent border-b border-white/10 px-4 py-3 text-[13px] text-white placeholder:text-gray-600 focus:outline-none"
        />
        <ul className="max-h-[46vh] overflow-y-auto py-1">
          {entries.map((entry, position) => (
            <li key={`${entry.name}-${entry.label}`}>
              <button
                type="button"
                onMouseEnter={() => setIndex(position)}
                onClick={() => run(entry.name, entry.args)}
                className={`w-full text-left px-4 py-2 flex items-center justify-between gap-3 ${
                  position === index ? 'bg-white/10' : ''
                }`}
              >
                <span className="text-[13px] text-gray-200">{entry.label}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-600">{entry.name}</span>
              </button>
            </li>
          ))}
          {entries.length === 0 && (
            <li className="px-4 py-3 font-mono text-[11px] text-gray-500">No matching action</li>
          )}
        </ul>
        <p className="border-t border-white/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-gray-600">
          {toolCount} tools available to the agent
        </p>
      </div>
    </div>
  );
};
