import React from 'react';

export type ChatTab = 'ask' | 'work' | 'projects';

type ChatShellProps = {
  tab: ChatTab;
  onTab: (tab: ChatTab) => void;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
};

export const ChatShell: React.FC<ChatShellProps> = ({ tab, onTab, onClose, children, footer }) => {
  const tabs: Array<{ id: ChatTab; label: string }> = [
    { id: 'ask', label: 'Ask' },
    { id: 'work', label: 'Work' },
    { id: 'projects', label: 'Projects' },
  ];

  return (
    <div className="pointer-events-auto w-[calc(100vw-2rem)] md:w-[420px] h-[min(640px,calc(100vh-7rem))] bg-black/95 border border-white/10 shadow-2xl flex flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="flex gap-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onTab(item.id)}
              className={`font-mono text-[10px] uppercase tracking-[0.16em] px-2.5 py-1.5 transition-colors ${
                tab === item.id ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={onClose} className="text-gray-500 hover:text-white p-1" aria-label="Close chat">
          ×
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-4">{children}</div>
      <div className="border-t border-white/10 p-3 bg-[#0a0a0a]">{footer}</div>
    </div>
  );
};
