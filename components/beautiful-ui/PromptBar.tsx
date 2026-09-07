import React from 'react';
import { CHAT_MODEL_LABEL } from '../../lib/chatModel';

const COMMANDS = [
  { id: '/work', label: 'Active workstreams' },
  { id: '/projects', label: 'Foodly & ParkAlong' },
  { id: '/contact', label: 'Contact + availability' },
];

const SOURCES = [
  { id: '@resume', label: 'Resume' },
  { id: '@besmak', label: 'Besmak' },
  { id: '@foodly', label: 'Foodly' },
];

type PromptBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
};

export const PromptBar: React.FC<PromptBarProps> = ({ value, onChange, onSubmit, disabled = false }) => {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="border border-white/15 bg-black"
    >
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            onSubmit();
          }
        }}
        placeholder="Ask about work, Foodly, ParkAlong…"
        rows={2}
        disabled={disabled}
        className="w-full bg-transparent px-3 pt-3 text-[13px] text-white placeholder:text-gray-600 focus:outline-none resize-none font-sans"
      />
      <div className="flex flex-wrap items-center gap-1.5 px-2 pb-2">
        {SOURCES.map((source) => (
          <button
            key={source.id}
            type="button"
            onClick={() => onChange(`${value} ${source.id}`.trim())}
            className="font-mono text-[9px] uppercase tracking-[0.12em] border border-white/10 px-1.5 py-1 text-gray-400 hover:text-white"
          >
            {source.label}
          </button>
        ))}
        {COMMANDS.map((command) => (
          <button
            key={command.id}
            type="button"
            onClick={() => onChange(command.id)}
            className="font-mono text-[9px] uppercase tracking-[0.12em] border border-white/10 px-1.5 py-1 text-gray-500 hover:text-white"
            title={command.label}
          >
            {command.id}
          </button>
        ))}
        <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.14em] text-gray-500">{CHAT_MODEL_LABEL}</span>
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="font-mono text-[9px] uppercase tracking-[0.14em] border border-white bg-white text-black px-2 py-1 disabled:opacity-30"
        >
          Send
        </button>
      </div>
    </form>
  );
};
