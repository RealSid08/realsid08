import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { VoiceConsole } from '../VoiceConsole';
import { soundEffects } from '../../services/sound';
import { runTool } from '../../services/agent/registry';
import { TOOLS } from '../../services/agent/registry';
import { AgentActivity } from './AgentActivity';
import { CommandPalette } from './CommandPalette';
import { registerAgentTools } from '../../services/agent/webmcp';

type Mode = 'ask' | 'voice';

const STORAGE = {
  thread: 'agent-thread',
  mode: 'agent-mode',
  expanded: 'agent-expanded',
  hint: 'agent-hint-seen',
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

export const AgentBar: React.FC = () => {
  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/chat' }), []);
  const { messages, sendMessage, status, error, stop, setMessages } = useChat({ transport });

  const [mode, setMode] = useState<Mode>(() => (read(STORAGE.mode) === 'voice' ? 'voice' : 'ask'));
  const [expanded, setExpanded] = useState(() => read(STORAGE.expanded) === 'true');
  const [input, setInput] = useState('');
  const [hintSeen, setHintSeen] = useState(() => read(STORAGE.hint) === 'true');
  const [restored, setRestored] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const executed = useRef<Set<string>>(new Set());

  const busy = status === 'submitted' || status === 'streaming';

  // The same registry the assistant and the palette use, reachable from the
  // page context (which is also how an external agent drives the site).
  useEffect(() => {
    (window as unknown as { portfolioAgent?: unknown }).portfolioAgent = {
      tools: TOOLS.map(({ name, description, kind, inputSchema }) => ({ name, description, kind, inputSchema })),
      run: runTool,
    };
  }, []);

  // Publish the same tools to the browser for external agents.
  useEffect(() => {
    let dispose: (() => void) | undefined;
    void registerAgentTools().then((registration) => {
      dispose = registration.unregister;
    });
    return () => dispose?.();
  }, []);

  // Restore the thread for this tab session, then keep it up to date.
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
  useEffect(() => write(STORAGE.expanded, String(expanded)), [expanded]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status, expanded]);

  // Page actions the assistant asked for are executed here, once per tool call.
  useEffect(() => {
    messages.forEach((message) => {
      (message.parts ?? []).forEach((part, partIndex) => {
        const type = (part as { type: string }).type;
        if (!type.startsWith('tool-')) return;
        const state = (part as { state?: string }).state;
        const toolCallId = `${message.id}:${partIndex}`;
        if (state !== 'output-available' || executed.current.has(toolCallId)) return;
        executed.current.add(toolCallId);
        const name = type.replace(/^tool-/, '');
        const input = ((part as { input?: unknown }).input ?? {}) as Record<string, unknown>;
        runTool(name, input);
      });
    });
  }, [messages]);

  useEffect(() => {
    const open = (event: Event) => {
      const detail = (event as CustomEvent<{ tab?: Mode }>).detail;
      if (detail?.tab) setMode(detail.tab);
      setExpanded(true);
      setHintSeen(true);
      write(STORAGE.hint, 'true');
    };
    window.addEventListener('open-assistant', open);
    return () => window.removeEventListener('open-assistant', open);
  }, []);

  // `/` or ⌘K opens and focuses; Escape collapses.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = !!target && ['INPUT', 'TEXTAREA'].includes(target.tagName);
      if (event.key === 'Escape') {
        setExpanded(false);
        return;
      }
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (event.key === '/' && !typing) {
        event.preventDefault();
        setExpanded(true);
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
    setExpanded(true);
  };

  const lastAssistant = [...messages].reverse().find((message) => message.role === 'assistant');
  const showHint = !hintSeen && !expanded;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-center px-3 pb-3 md:pb-5 pointer-events-none">
      {expanded && (
        <div
          role="dialog"
          aria-label="Agent"
          className="card-surface pointer-events-auto w-full max-w-3xl mb-2 border border-white/10 bg-black/95 backdrop-blur-md overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
            <div className="flex items-center gap-1">
              {(['ask', 'voice'] as Mode[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  aria-pressed={mode === item}
                  className={`font-mono text-[10px] uppercase tracking-[0.16em] px-2.5 py-1.5 transition-colors ${
                    mode === item ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMessages([])}
                  className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-500 hover:text-white px-2 py-1"
                >
                  New chat
                </button>
              )}
              <button
                type="button"
                onClick={() => setExpanded(false)}
                aria-label="Collapse agent"
                className="text-gray-500 hover:text-white px-2 py-1"
              >
                ×
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="max-h-[46vh] min-h-[96px] overflow-y-auto px-4 py-3 space-y-4">
            {mode === 'voice' ? (
              <VoiceConsole compact />
            ) : messages.length === 0 ? (
              <p className="font-mono text-[11px] text-gray-500">
                Ask about the work: a role, a project, the stack, availability.
              </p>
            ) : (
              messages.map((message) => (
                <article key={message.id} className="space-y-1.5">
                  {message.role === 'assistant' && stepCountOf(message) > 0 && (
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-500">
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
                </article>
              ))
            )}
            {busy && mode === 'ask' && (
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-500">Working…</p>
            )}
            {error && <p className="font-mono text-[11px] text-gray-500">The assistant is unavailable right now.</p>}
          </div>

        </div>
      )}

      <div className="pointer-events-auto relative w-full max-w-3xl">
        <AgentActivity className="mb-2" onStopExternal={() => setExpanded(false)} />
        {showHint && (
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-2 border border-white/10 bg-black/90 px-3 py-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-400">
              Ask about the work
            </span>
            <button
              type="button"
              aria-label="Dismiss hint"
              onClick={() => {
                setHintSeen(true);
                write(STORAGE.hint, 'true');
              }}
              className="text-gray-600 hover:text-white text-[11px] leading-none"
            >
              ×
            </button>
          </div>
        )}

        <form
          toolname="ask_portfolio"
          tooldescription="Ask Sidhaarth Krishnan's portfolio assistant a question about his work, projects or availability."
          onSubmit={(event) => {
            event.preventDefault();
            send(input);
          }}
          className="card-surface flex items-center gap-2 border border-white/15 bg-black/90 backdrop-blur-md px-2 py-2"
        >
          <span className="grid size-8 place-items-center text-gray-500" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.6}>
              <path d="M12 3v18M3 12h18" strokeLinecap="round" />
            </svg>
          </span>

          <textarea
            ref={inputRef}
            name="question"
            rows={1}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onFocus={() => setExpanded(true)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                send(input);
              }
            }}
            placeholder={mode === 'voice' ? 'Voice mode — tap the mic to start' : 'Ask about the work'}
            disabled={mode === 'voice'}
            className="flex-1 resize-none bg-transparent py-1.5 text-[13px] text-white placeholder:text-gray-600 focus:outline-none disabled:opacity-50"
          />

          <div className="flex items-center gap-1">
            {(['ask', 'voice'] as Mode[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setMode(item);
                  setExpanded(true);
                }}
                aria-pressed={mode === item}
                className={`font-mono text-[9px] uppercase tracking-[0.14em] px-2 py-1 border transition-colors ${
                  mode === item
                    ? 'border-white text-white'
                    : 'border-white/10 text-gray-500 hover:text-white hover:border-white/40'
                }`}
              >
                {item}
              </button>
            ))}

            {mode === 'ask' && busy ? (
              <button
                type="button"
                onClick={() => stop()}
                className="font-mono text-[9px] uppercase tracking-[0.14em] border border-white/40 px-2 py-1 text-white"
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={mode === 'voice' || !input.trim()}
                aria-label="Send"
                className="grid size-8 place-items-center border border-white bg-white text-black disabled:opacity-30"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
        </form>

        <div className="flex items-center justify-center gap-3 mt-1">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-600 hover:text-white"
          >
            ⌘K actions
          </button>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-label={expanded ? 'Collapse agent' : 'Expand agent'}
          className="pointer-events-auto mx-auto mt-1 grid size-6 place-items-center text-gray-600 hover:text-white"
        >
          <svg viewBox="0 0 24 24" className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path d="M6 15l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
};
