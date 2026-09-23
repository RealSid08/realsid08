import React, { useEffect, useState } from 'react';
import { clearActions, onActions, onExternalAgent, setExternalAgent, undoAll, type ActionRecord } from '../../services/agent/actions';

type Props = {
  /** called when the visitor asks an external agent to stop driving the page */
  onStopExternal?: () => void;
  className?: string;
};

export const AgentActivity: React.FC<Props> = ({ onStopExternal, className = '' }) => {
  const [records, setRecords] = useState<ActionRecord[]>([]);
  const [external, setExternal] = useState(false);

  useEffect(() => onActions(setRecords), []);
  useEffect(() => onExternalAgent(setExternal), []);

  if (records.length === 0 && !external) return null;

  return (
    <div className={`card-surface border border-white/10 bg-mono-paper ${className}`}>
      {external && (
        <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-white/10">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white">
            An agent is controlling this page
          </p>
          <button
            type="button"
            onClick={() => {
              setExternalAgent(false);
              onStopExternal?.();
            }}
            className="font-mono text-[10px] uppercase tracking-[0.14em] border border-white/40 px-2 py-1 text-white hover:border-white"
          >
            Stop
          </button>
        </div>
      )}

      {records.length > 0 && (
        <div className="px-4 py-2">
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-500">
              {records.length} {records.length === 1 ? 'action' : 'actions'}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => undoAll()}
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-400 hover:text-white"
              >
                Undo all
              </button>
              <button
                type="button"
                onClick={() => clearActions()}
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-600 hover:text-white"
              >
                Clear
              </button>
            </div>
          </div>
          <ul className="flex flex-wrap gap-1.5">
            {records.slice(0, 6).map((entry) => (
              <li
                key={entry.id}
                className="flex items-center gap-2 border border-white/10 bg-mono-base px-2 py-1"
              >
                <span className="font-mono text-[10px] text-gray-400">{entry.label}</span>
                {entry.undo && (
                  <button
                    type="button"
                    onClick={() => entry.undo?.()}
                    aria-label={`Undo ${entry.label}`}
                    className="text-gray-600 hover:text-white text-[10px] leading-none"
                  >
                    ↺
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
