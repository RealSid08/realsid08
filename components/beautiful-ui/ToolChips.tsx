import React from 'react';

export type ToolChip = {
  id: string;
  name: string;
  label: string;
  state: 'running' | 'done' | 'error';
};

type ToolChipsProps = {
  chips: ToolChip[];
};

export const ToolChips: React.FC<ToolChipsProps> = ({ chips }) => {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-500 self-center">
        {chips.length} tool call{chips.length === 1 ? '' : 's'}
      </span>
      {chips.map((chip) => (
        <span
          key={chip.id}
          className={`font-mono text-[10px] uppercase tracking-[0.12em] border px-2 py-1 ${
            chip.state === 'running'
              ? 'border-white/40 text-white'
              : chip.state === 'error'
                ? 'border-white/20 text-gray-500'
                : 'border-white/15 text-gray-300'
          }`}
        >
          {chip.name}
          <span className="text-gray-500"> · {chip.label}</span>
        </span>
      ))}
    </div>
  );
};
