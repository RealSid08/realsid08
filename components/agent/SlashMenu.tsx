import React, { useEffect, useRef } from 'react';
import type { SlashCommand } from '../../services/agent/commands';

type Props = {
  commands: SlashCommand[];
  active: number;
  /** text typed after the command, used to show whether an argument is still needed */
  arg: string;
  query: string;
  onHover: (index: number) => void;
  onPick: (command: SlashCommand) => void;
};

const Mark: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  if (!query || !text.startsWith(query)) return <>{text}</>;
  return (
    <>
      <span className="text-mono-accent">{query}</span>
      {text.slice(query.length)}
    </>
  );
};

/** Keyboard-first command list that opens above the composer when the input starts with `/`. */
export const SlashMenu: React.FC<Props> = ({ commands, active, arg, query, onHover, onPick }) => {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (commands.length === 0) {
    return (
      <div className="border-b border-white/10 px-3 py-2.5 font-mono text-[11px] text-gray-500">
        No command matches <span className="text-gray-300">/{query}</span>. Press Enter to ask it as a question.
      </div>
    );
  }

  let lastGroup = '';
  return (
    <ul
      ref={listRef}
      role="listbox"
      id="agent-slash-menu"
      aria-label="Commands"
      className="max-h-[min(19rem,45vh)] overflow-y-auto overscroll-contain border-b border-white/10 py-1"
    >
      {commands.map((command, index) => {
        const heading = command.group !== lastGroup ? command.group : null;
        lastGroup = command.group;
        const selected = index === active;
        const needsArg = !!command.arg && !arg;
        return (
          <React.Fragment key={command.id}>
            {heading && (
              <li role="presentation" className="px-3 pb-1 pt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-gray-500">
                {heading}
              </li>
            )}
            <li
              role="option"
              id={`agent-slash-${command.id}`}
              aria-selected={selected}
              data-index={index}
              onMouseEnter={() => onHover(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onPick(command)}
              className={`mx-1.5 flex cursor-pointer items-baseline gap-3 rounded-lg px-2 py-1.5 ${selected ? 'bg-white/[0.07]' : ''}`}
            >
              <span className="min-w-[6.5rem] shrink-0 whitespace-nowrap font-mono text-[12px] text-gray-300">
                /<Mark text={command.id} query={query} />
                {command.arg && <span className="text-gray-500"> {arg || `‹${command.arg}›`}</span>}
              </span>
              <span className="min-w-0 flex-1 truncate text-[12px] text-gray-400">{command.hint}</span>
              {selected && (
                <kbd className="shrink-0 font-mono text-[10px] text-gray-500">{needsArg ? 'tab' : '↵'}</kbd>
              )}
            </li>
          </React.Fragment>
        );
      })}
    </ul>
  );
};
