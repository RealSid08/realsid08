import React, { useState } from 'react';

export type ThinkingStep = {
  id: string;
  kind: 'reasoning' | 'search' | 'tool';
  title: string;
  detail?: string;
  running?: boolean;
};

type ThinkingTraceProps = {
  steps: ThinkingStep[];
  running?: boolean;
};

export const ThinkingTrace: React.FC<ThinkingTraceProps> = ({ steps, running = false }) => {
  const [open, setOpen] = useState(running);
  if (steps.length === 0) return null;

  const headline = running
    ? (steps.find((step) => step.running)?.title ?? 'Thinking')
    : `Ran ${steps.filter((step) => step.kind === 'tool').length || steps.length} ${steps.some((step) => step.kind === 'tool') ? 'tools' : 'steps'}`;

  return (
    <div className="w-full font-mono text-[11px]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <span className={`inline-block w-1.5 h-1.5 ${running ? 'bg-white animate-pulse' : 'bg-white/40'}`} />
        <span className="uppercase tracking-[0.16em]">{headline}</span>
        <span className={`text-gray-600 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="mt-2 ml-1 border-l border-white/15 pl-3 space-y-2">
          {steps.map((step) => (
            <div key={step.id} className="text-gray-400">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 border border-white/50 bg-transparent" />
                <span className="text-white/90">{step.title}</span>
              </div>
              {step.detail && <p className="pl-4 mt-1 text-gray-500 leading-relaxed whitespace-pre-wrap">{step.detail}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
