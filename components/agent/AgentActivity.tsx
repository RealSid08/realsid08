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
        <div className="flex items-center gap-2 px-3 py-1 overflow-x-auto">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-600 shrink-0">
            {records.length} {records.length === 1 ? 'action' : 'actions'}
          </span>
          {records.slice(0, 4).map((entry) => (
            <span
              key={entry.id}
              className="flex items-center gap-1.5 border border-white/10 bg-mono-base px-2 py-0.5 shrink-0"
            >
              <span className="font-mono text-[10px] text-gray-400 whitespace-nowrap">{entry.label}</span>
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
            </span>
          ))}
          <span className="flex-1" />
          <button
            type="button"
            onClick={() => undoAll()}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-500 hover:text-white shrink-0"
          >
            Undo all
          </button>
          <button
            type="button"
            onClick={() => clearActions()}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-700 hover:text-white shrink-0"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};
