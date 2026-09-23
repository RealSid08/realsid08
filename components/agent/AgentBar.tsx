import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { soundEffects } from '../../services/sound';
import { runTool, TOOLS } from '../../services/agent/registry';
import { matchCommands, type SlashCommand } from '../../services/agent/commands';
import { pageIntentsFromMessages } from '../../services/agent/pageIntent';
import { registerAgentTools } from '../../services/agent/webmcp';
import { useVoiceSession } from '../../services/useVoiceSession';
import { AgentActivity } from './AgentActivity';
import { CommandPalette } from './CommandPalette';
import { VoicePulse } from './VoicePulse';

type Mode = 'ask' | 'voice';

const STORAGE = {
  thread: 'agent-thread',
  mode: 'agent-mode',
  minimized: 'agent-minimized',
};

const read = (key: string): string | null => {
  try {
    return sessionStorage.getItem(key) ?? localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string, session = false) => {
  try {
    (session ? sessionStorage : localStorage).setItem(key, value);
  } catch {
    /* private mode */
  }
};

const textOf = (message: UIMessage) =>
  (message.parts ?? [])
    .filter((part) => part.type === 'text')
    .map((part) => (part as { text?: string }).text ?? '')
    .join('');

const stepCountOf = (message: UIMessage) =>
  (message.parts ?? []).filter((part) => part.type.startsWith('tool-')).length;

const clockOf = (id: string) => {
  const stamp = Number(id.split('-')[0]);
  const date = Number.isFinite(stamp) && stamp > 1e12 ? new Date(stamp) : new Date();
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const MarkIcon: React.FC = () => (
  <svg viewBox="0 0 16 16" className="w-4 h-4" aria-hidden="true">
    <circle cx="4" cy="4" r="1.6" fill="currentColor" />
    <circle cx="12" cy="4" r="1.6" fill="currentColor" />
    <circle cx="4" cy="12" r="1.6" fill="currentColor" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" />
  </svg>
);

const MicIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
    <rect x="9" y="3" width="6" height="10" rx="3" />
    <path d="M5 11a7 7 0 0014 0M12 18v3" strokeLinecap="round" />
  </svg>
);

export const AgentBar: React.FC = () => {
  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/chat' }), []);
  const { messages, sendMessage, status, error, stop, setMessages } = useChat({ transport });
  const voice = useVoiceSession();

  const [mode, setMode] = useState<Mode>(() => (read(STORAGE.mode) === 'voice' ? 'voice' : 'ask'));
  const [minimized, setMinimized] = useState(() => read(STORAGE.minimized) === 'true');
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [restored, setRestored] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const executed = useRef<Set<string>>(new Set());

  const busy = status === 'submitted' || status === 'streaming';
  const commands = matchCommands(input);
  const showCommands = !minimized && focused && input === '';
  const showCommandMatches = !minimized && input.startsWith('/') && commands.length > 0;

  useEffect(() => {
    (window as unknown as { portfolioAgent?: unknown }).portfolioAgent = {
      tools: TOOLS.map(({ name, description, kind, inputSchema }) => ({ name, description, kind, inputSchema })),
      run: runTool,
    };
  }, []);

  useEffect(() => {
    let dispose: (() => void) | undefined;
    void registerAgentTools().then((registration) => {
      dispose = registration.unregister;
    });
    return () => dispose?.();
  }, []);

  useEffect(() => {
    const stored = read(STORAGE.thread);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as UIMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
      } catch {
        /* ignore malformed */
      }
    }
    setRestored(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!restored) return;
    write(STORAGE.thread, JSON.stringify(messages), true);
  }, [messages, restored]);

  useEffect(() => write(STORAGE.mode, mode), [mode]);
  useEffect(() => write(STORAGE.minimized, String(minimized)), [minimized]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  useEffect(() => {
    pageIntentsFromMessages(messages, executed.current).forEach((intent) => {
      executed.current.add(intent.id);
      void runTool(intent.name, intent.args);
    });
  }, [messages]);

  useEffect(() => {
    const open = (event: Event) => {
      const detail = (event as CustomEvent<{ tab?: Mode }>).detail;
      if (detail?.tab) setMode(detail.tab);
      setMinimized(false);
    };
    window.addEventListener('open-assistant', open);
    return () => window.removeEventListener('open-assistant', open);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = !!target && ['INPUT', 'TEXTAREA'].includes(target.tagName);

      if (event.key === 'Escape') {
        setMinimized(true);
        setFocused(false);
        return;
      }
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (event.key === '/' && !typing) {
        event.preventDefault();
        setMinimized(false);
        setMode('ask');
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const send = (text: string) => {
    const value = text.trim();
    if (!value || busy) return;
    soundEffects.playClick();
    void sendMessage({ text: value });
    setInput('');
    setMinimized(false);
  };

  const runCommand = (command: SlashCommand) => {
    if (command.local === 'voice') {
      setMode('voice');
      return;
    }
    if (command.local === 'resume') {
      window.open('/Sidhaarth_Krishnan_Resume.pdf', '_blank');
      return;
    }
    command.run?.();
  };

  if (minimized) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center pb-3 md:pb-4 pointer-events-none">
        <button
          type="button"
          onClick={() => setMinimized(false)}
          aria-label="Open the assistant"
          className="card-surface pointer-events-auto grid size-11 place-items-center rounded-full border border-white/15 bg-black/90 text-gray-400 backdrop-blur-md hover:text-white transition-colors"
        >
          <MarkIcon />
        </button>
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-center px-3 pb-2 pointer-events-none md:pb-3">
      <div className="pointer-events-auto w-full max-w-2xl">
        <AgentActivity className="mb-1.5" onStopExternal={() => setMinimized(true)} />

        {(showCommands || showCommandMatches) && (
          <div className="mb-1.5 flex gap-1.5 overflow-x-auto pb-0.5">
            {commands.map((command) => (
              <button
                key={command.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => runCommand(command)}
                className="card-surface shrink-0 border border-white/10 bg-black/90 px-2.5 py-1.5 text-left backdrop-blur-md hover:border-white/40"
              >
                <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-gray-300">
                  /{command.id}
                </span>
                <span className="block text-[11px] text-gray-500">{command.hint}</span>
              </button>
            ))}
          </div>
        )}

        {messages.length > 0 && mode === 'ask' && (
          <div
            ref={scrollRef}
            className="card-surface mb-1.5 max-h-[32vh] overflow-y-auto border border-white/10 bg-black/95 px-3 py-2 backdrop-blur-md"
          >
            {messages.map((message) => (
              <article key={message.id} className="space-y-1 py-1">
                {message.role === 'assistant' && stepCountOf(message) > 0 && (
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-600">
                    Looked up {stepCountOf(message)} {stepCountOf(message) === 1 ? 'thing' : 'things'}
                  </p>
                )}
                <p
                  className={`whitespace-pre-wrap text-[13px] leading-relaxed ${
                    message.role === 'user' ? 'text-white' : 'text-gray-300'
                  }`}
                >
                  {textOf(message)}
                </p>
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 pt-0.5 text-gray-600">
                    <button
                      type="button"
                      aria-label="Copy answer"
                      onClick={() => void navigator.clipboard?.writeText(textOf(message))}
                      className="hover:text-white"
                    >
                      <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={1.6}>
                        <rect x="9" y="9" width="11" height="11" rx="2" />
                        <path d="M5 15V5a2 2 0 012-2h8" strokeLinecap="round" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      aria-label="Read answer aloud"
                      onClick={() => {
                        if (typeof speechSynthesis === 'undefined') return;
                        const utterance = new SpeechSynthesisUtterance(textOf(message));
                        speechSynthesis.speak(utterance);
                      }}
                      className="hover:text-white"
                    >
                      <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={1.6}>
                        <path d="M11 5L6 9H3v6h3l5 4V5z" strokeLinejoin="round" />
                        <path d="M16 9a4 4 0 010 6" strokeLinecap="round" />
                      </svg>
                    </button>
                    <span className="font-mono text-[10px]">{clockOf(message.id)}</span>
                  </div>
                )}
              </article>
            ))}
            {busy && (
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-600 pb-1">Working…</p>
            )}
            {error && <p className="font-mono text-[11px] text-gray-500 pb-1">The assistant is unavailable right now.</p>}
          </div>
        )}

        <form
          toolname="ask_portfolio"
          tooldescription="Ask Sidhaarth Krishnan's portfolio assistant a question about his work, projects or availability."
          onSubmit={(event) => {
            event.preventDefault();
            if (mode === 'ask' && input.startsWith('/') && commands.length > 0) {
              runCommand(commands[0]);
              setInput('');
              return;
            }
            send(input);
          }}
          className="card-surface flex items-center gap-1.5 rounded-full border border-white/15 bg-black/90 pl-3 pr-1.5 py-1.5 backdrop-blur-md"
        >
          {mode === 'voice' ? (
            <div className="flex flex-1 items-center gap-2 py-1">
              <VoicePulse active={voice.isActive} connecting={voice.isConnecting} volume={voice.volume} />
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-500">
                {voice.isConnecting
                  ? 'Connecting'
                  : voice.isActive
                    ? 'Listening'
                    : voice.failed
                      ? 'Voice unavailable'
                      : 'Voice agent idle'}
              </span>
            </div>
          ) : (
            <textarea
              ref={inputRef}
              name="question"
              rows={1}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => window.setTimeout(() => setFocused(false), 120)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  if (input.startsWith('/') && commands.length > 0) {
                    runCommand(commands[0]);
                    setInput('');
                    return;
                  }
                  send(input);
                }
              }}
              placeholder="Ask about the work, or type /"
              className="flex-1 resize-none bg-transparent py-1 text-[13px] text-white placeholder:text-gray-600 focus:outline-none"
            />
          )}

          <div className="flex items-center gap-1">
            {mode === 'ask' && busy && (
              <button
                type="button"
                onClick={() => stop()}
                className="font-mono text-[9px] uppercase tracking-[0.14em] border border-white/40 px-2 py-1 text-white"
              >
                Stop
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (mode === 'voice' && (voice.isActive || voice.isConnecting)) {
                  void voice.toggle();
                  return;
                }
                setMode(mode === 'voice' ? 'ask' : 'voice');
                setMinimized(false);
                if (mode === 'ask') void voice.toggle();
              }}
              aria-label={mode === 'voice' ? 'End voice session' : 'Talk to the agent'}
              aria-pressed={mode === 'voice'}
              className={`grid size-7 place-items-center rounded-full border transition-colors ${
                mode === 'voice'
                  ? 'border-white bg-white text-black'
                  : 'border-white/20 text-gray-400 hover:border-white hover:text-white'
              }`}
            >
              <MicIcon className="w-3.5 h-3.5" />
            </button>

            {mode === 'ask' && (
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label="Send"
                className="grid size-7 place-items-center rounded-full border border-white bg-white text-black disabled:opacity-30"
              >
                <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.2}>
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
        </form>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setMinimized(true)}
            aria-label="Minimise the assistant"
            className="pointer-events-auto grid size-5 place-items-center text-gray-600 hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-700 hover:text-white"
          >
            ⌘K
          </button>
        </div>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
};
