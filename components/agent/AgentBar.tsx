import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { JSONUIProvider, Renderer, useJsonRenderMessage, type DataPart } from '@json-render/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { soundEffects } from '../../services/sound';
import { runTool, TOOLS } from '../../services/agent/registry';
import { matchCommands, parseSlash, runSteps, type SlashCommand } from '../../services/agent/commands';
import { pageIntentsFromMessages } from '../../services/agent/pageIntent';
import { registerAgentTools } from '../../services/agent/webmcp';
import { isAgentScrolling } from '../../services/agent/actions';
import { useDictation } from '../../services/useDictation';
import { AgentStatus } from './AgentStatus';
import { AgentSteps } from './AgentSteps';
import { SlashMenu } from './SlashMenu';
import { PortfolioLink } from './PortfolioLink';
import { portfolioEvidenceRegistry } from './PortfolioEvidence';

/** closed: a small launcher. compact: just the composer. open: the conversation too. */
type Mode = 'closed' | 'compact' | 'open';

const STORAGE = { thread: 'agent-thread', closed: 'agent-closed' };

const STARTERS = [
  'What is he working on right now?',
  'Show me his best project',
  'Honest strengths and weaknesses?',
  'Where has he used Convex?',
];

const storage = {
  get: (area: 'local' | 'session', key: string) => {
    try {
      return (area === 'local' ? localStorage : sessionStorage).getItem(key);
    } catch {
      return null;
    }
  },
  set: (area: 'local' | 'session', key: string, value: string | null) => {
    try {
      const store = area === 'local' ? localStorage : sessionStorage;
      if (value === null) store.removeItem(key);
      else store.setItem(key, value);
    } catch {
      /* private mode */
    }
  },
};

const textOf = (message: UIMessage) =>
  (message.parts ?? [])
    .filter((part) => part.type === 'text')
    .map((part) => (part as { text?: string }).text ?? '')
    .join('\n\n');

const AssistantReply: React.FC<{ message: UIMessage; streaming: boolean }> = React.memo(({ message, streaming }) => {
  const { text, spec, hasSpec } = useJsonRenderMessage(message.parts as DataPart[]);
  return (
    <div className="min-w-0 break-words text-[13px] leading-relaxed text-gray-200">
      {text && (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-4 marker:text-gray-500 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-4 marker:text-gray-500 last:mb-0">{children}</ol>,
          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
          a: ({ children, href }) => <PortfolioLink href={href}>{children}</PortfolioLink>,
          code: ({ children }) => <code className="font-mono text-[12px] text-white">{children}</code>,
          pre: ({ children }) => <pre className="my-2 overflow-x-auto border border-white/10 bg-white/[0.04] p-2 text-[11px]">{children}</pre>,
        }}>{text}</ReactMarkdown>
      )}
      {hasSpec && spec && (
        <JSONUIProvider registry={portfolioEvidenceRegistry} initialState={{}}>
          <Renderer spec={spec} registry={portfolioEvidenceRegistry} loading={streaming} />
        </JSONUIProvider>
      )}
    </div>
  );
});

const Icon = {
  mark: (
    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
      <circle cx="4" cy="4" r="1.6" fill="currentColor" />
      <circle cx="12" cy="4" r="1.6" fill="currentColor" />
      <circle cx="4" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </svg>
  ),
  mic: (
    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0014 0M12 18v3" strokeLinecap="round" />
    </svg>
  ),
  send: (
    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
      <path d="M12 19V5M6 11l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  stop: <span className="block size-2.5 bg-current" aria-hidden="true" />,
  close: (
    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  ),
  down: (
    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  up: (
    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="M6 15l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  copy: (
    <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="1.5" />
      <path d="M5 15V5a2 2 0 012-2h8" strokeLinecap="round" />
    </svg>
  ),
};

const iconButton =
  'grid size-7 shrink-0 place-items-center text-gray-400 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/60';

const Thinking: React.FC = () => (
  <p className="flex items-center gap-1 py-1" aria-label="Thinking">
    {[0, 150, 300].map((delay) => (
      <span key={delay} className="size-1 animate-pulse rounded-full bg-gray-400" style={{ animationDelay: `${delay}ms` }} />
    ))}
  </p>
);

export const AgentBar: React.FC = () => {
  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/chat' }), []);
  const { messages, sendMessage, status, error, stop, setMessages, regenerate } = useChat({ transport });
  const [mode, setMode] = useState<Mode>(() => (storage.get('local', STORAGE.closed) === 'true' ? 'closed' : 'compact'));
  const [input, setInput] = useState('');
  const [menuIndex, setMenuIndex] = useState(0);
  const [menuDismissed, setMenuDismissed] = useState(false);
  const [unread, setUnread] = useState(false);
  const [focused, setFocused] = useState(false);
  const [restored, setRestored] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const executed = useRef<Set<string>>(new Set());
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const dictation = useDictation((text) => {
    setInput((current) => `${current.trim()} ${text}`.trim());
    setMode((current) => (current === 'closed' ? 'compact' : current));
    requestAnimationFrame(() => inputRef.current?.focus());
  });

  const busy = status === 'submitted' || status === 'streaming';
  const slash = parseSlash(input);
  const commands = slash ? matchCommands(input) : [];
  const menuOpen = !!slash && !menuDismissed && mode !== 'closed';
  const activeIndex = Math.min(menuIndex, Math.max(0, commands.length - 1));

  const focusInput = useCallback((text?: string) => {
    if (text !== undefined) setInput(text);
    setMenuDismissed(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  /* ---------- wiring for external agents ---------- */

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

  /* ---------- thread persistence ---------- */

  useEffect(() => {
    const stored = storage.get('session', STORAGE.thread);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as UIMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Page actions from an earlier visit already happened; never replay them on reload.
          pageIntentsFromMessages(parsed, new Set()).forEach((intent) => executed.current.add(intent.id));
          setMessages(parsed);
        }
      } catch {
        /* ignore malformed */
      }
    }
    setRestored(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!restored || busy) return;
    storage.set('session', STORAGE.thread, messages.length > 0 ? JSON.stringify(messages) : null);
  }, [messages, restored, busy]);

  useEffect(() => storage.set('local', STORAGE.closed, mode === 'closed' ? 'true' : null), [mode]);

  /* ---------- run the page actions the assistant asks for ---------- */

  useEffect(() => {
    pageIntentsFromMessages(messages, executed.current).forEach((intent) => {
      executed.current.add(intent.id);
      void runTool(intent.name, intent.args);
    });
  }, [messages]);

  /* ---------- thread scrolling ---------- */

  useLayoutEffect(() => {
    const el = threadRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages, status, mode]);

  /* ---------- a finished reply while collapsed is flagged, not forced open ---------- */

  const previousStatus = useRef(status);
  useEffect(() => {
    if (previousStatus.current !== 'ready' && status === 'ready' && modeRef.current !== 'open' && messages.length > 0) {
      setUnread(true);
    }
    previousStatus.current = status;
  }, [status, messages.length]);

  useEffect(() => {
    if (mode === 'open') setUnread(false);
  }, [mode]);

  /* ---------- collapse when the visitor scrolls the page themselves ---------- */

  useEffect(() => {
    if (mode !== 'open') return;
    let origin = window.scrollY;
    const onScroll = () => {
      if (isAgentScrolling()) {
        origin = window.scrollY;
        return;
      }
      if (Math.abs(window.scrollY - origin) > 120) {
        setMode('compact');
        inputRef.current?.blur();
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [mode]);

  /* ---------- global shortcuts ---------- */

  useEffect(() => {
    const open = () => {
      setMode('open');
      focusInput();
    };
    window.addEventListener('open-assistant', open);
    return () => window.removeEventListener('open-assistant', open);
  }, [focusInput]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = !!target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable);
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setMode((current) => (current === 'closed' ? 'compact' : current));
        focusInput('/');
        return;
      }
      if (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        setMode((current) => (current === 'closed' ? 'compact' : current));
        focusInput('/');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusInput]);

  /* ---------- actions ---------- */

  const send = (text: string) => {
    const value = text.trim();
    if (!value || busy) return;
    soundEffects.playClick();
    stickToBottom.current = true;
    void sendMessage({ text: value });
    setInput('');
    setMode('open');
  };

  const clearThread = () => {
    if (busy) stop();
    setMessages([]);
    executed.current.clear();
    storage.set('session', STORAGE.thread, null);
  };

  const runCommand = (command: SlashCommand, arg: string) => {
    if (command.arg && !arg) {
      focusInput(`/${command.id} `);
      return;
    }
    setInput('');
    setMenuIndex(0);
    if (command.local === 'resume') window.open('/Sidhaarth_Krishnan_Resume.pdf', '_blank', 'noopener');
    if (command.local === 'clear') clearThread();
    if (command.steps) void runSteps(command.steps(arg));
    if (command.prompt) send(command.prompt(arg));
  };

  const submit = () => {
    if (slash && menuOpen) {
      const command = commands[activeIndex];
      if (command) {
        runCommand(command, slash.arg);
        return;
      }
    }
    send(input);
  };

  const onComposerKey = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (menuOpen && commands.length > 0) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        setMenuIndex((activeIndex + step + commands.length) % commands.length);
        return;
      }
      if (event.key === 'Tab') {
        event.preventDefault();
        const command = commands[activeIndex];
        focusInput(`/${command.id}${command.arg ? ' ' : ''}`);
        return;
      }
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      if (menuOpen) {
        setMenuDismissed(true);
        if (input === '/') setInput('');
        return;
      }
      if (mode === 'open') setMode('compact');
      else inputRef.current?.blur();
      return;
    }
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  // Grow the composer with its content, up to a few lines.
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input, mode]);

  /* ---------- render ---------- */

  const shell = 'fixed z-50 inset-x-0 bottom-3 md:bottom-5 flex flex-col items-center px-3 pointer-events-none';

  if (mode === 'closed') {
    return (
      <div className={shell}>
        <button
          type="button"
          onClick={() => {
            setMode(messages.length > 0 ? 'open' : 'compact');
            focusInput();
          }}
          aria-label="Open the portfolio assistant"
          className="card-surface pointer-events-auto flex items-center gap-2 border border-white/20 bg-black/90 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-gray-300 backdrop-blur-md transition-colors hover:border-white/50 hover:text-white"
        >
          {Icon.mark}
          Ask
          <kbd className="text-gray-500">/</kbd>
        </button>
      </div>
    );
  }

  const placeholder =
    dictation.state === 'requesting' ? 'Waiting for microphone…'
      : dictation.state === 'recording' ? 'Listening… tap the mic to finish'
        : dictation.state === 'transcribing' ? 'Transcribing…'
          : 'Ask about his work, or type /';

  const open = mode === 'open';
  const lastId = messages.at(-1)?.id;
  const waiting = busy && (messages.at(-1)?.role === 'user' || (messages.at(-1)?.parts ?? []).length === 0);

  return (
    <div className={shell}>
      <div className={`flex w-full flex-col items-stretch gap-2 transition-[max-width] duration-300 ${open ? 'max-w-[40rem]' : 'max-w-[34rem]'}`}>
      <AgentStatus />

      <div className={`agent-glow pointer-events-auto ${open || focused || busy ? '' : 'agent-glow-idle'}`}>
      <section
        aria-label="Portfolio assistant"
        className="card-surface relative flex max-h-[min(34rem,calc(100dvh-5rem))] flex-col overflow-hidden border border-white/15 bg-black/95 backdrop-blur-md md:max-h-[min(36rem,calc(100vh-7rem))]"
      >
        {open && (
          <>
            <header className="flex items-center gap-2 border-b border-white/10 py-1.5 pl-3 pr-1.5">
              <span className="text-gray-400">{Icon.mark}</span>
              <p className="flex-1 font-mono text-[10px] uppercase tracking-[0.2em] text-gray-300">Ask about Sidhaarth</p>
              {messages.length > 0 && (
                <button type="button" onClick={clearThread} className="px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-gray-400 hover:text-white">
                  New
                </button>
              )}
              <button type="button" onClick={() => setMode('compact')} aria-label="Minimise the assistant" title="Minimise (Esc)" className={iconButton}>
                {Icon.down}
              </button>
              <button type="button" onClick={() => setMode('closed')} aria-label="Close the assistant" title="Close" className={iconButton}>
                {Icon.close}
              </button>
            </header>

            <div
              ref={threadRef}
              onScroll={(event) => {
                const el = event.currentTarget;
                stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
              }}
              aria-busy={busy}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3"
            >
              {messages.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-[13px] leading-relaxed text-gray-300">
                    Ask anything about his work. Answers are checked against his roles, projects and public GitHub, and the page moves to show you.
                  </p>
                  <div className="flex flex-col items-start gap-1.5">
                    {STARTERS.map((starter) => (
                      <button
                        key={starter}
                        type="button"
                        onClick={() => send(starter)}
                        className="border border-white/15 px-2.5 py-1.5 text-left text-[12px] text-gray-300 transition-colors hover:border-white/50 hover:text-white"
                      >
                        {starter}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) =>
                    message.role === 'user' ? (
                      <p key={message.id} className="ml-auto w-fit max-w-[85%] whitespace-pre-wrap break-words bg-white/[0.07] px-3 py-2 text-[13px] leading-relaxed text-white">
                        {textOf(message)}
                      </p>
                    ) : (
                      <article key={message.id} className="group">
                        <AgentSteps message={message} streaming={busy && message.id === lastId} />
                        <AssistantReply message={message} streaming={busy && message.id === lastId} />
                        {!(busy && message.id === lastId) && textOf(message) && (
                          <button
                            type="button"
                            onClick={() => void navigator.clipboard?.writeText(textOf(message))}
                            className="mt-1 flex items-center gap-1 font-mono text-[10px] text-gray-500 opacity-0 transition-opacity hover:text-white focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                          >
                            {Icon.copy} Copy
                          </button>
                        )}
                      </article>
                    ),
                  )}
                  {waiting && <Thinking />}
                  {error && !busy && (
                    <p className="flex items-center gap-3 text-[12px] text-gray-300">
                      The assistant couldn&apos;t answer that.
                      <button type="button" onClick={() => void regenerate()} className="font-mono text-[10px] uppercase tracking-[0.14em] text-white underline underline-offset-4">
                        Retry
                      </button>
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {menuOpen && (
          <SlashMenu
            commands={commands}
            active={activeIndex}
            arg={slash?.arg ?? ''}
            query={slash?.name ?? ''}
            onHover={setMenuIndex}
            onPick={(command) => runCommand(command, slash?.arg ?? '')}
          />
        )}

        <form
          toolname="ask_portfolio"
          tooldescription="Ask Sidhaarth Krishnan's portfolio assistant a question about his work, projects or availability."
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          className={`flex items-end gap-1 py-1.5 pl-3 pr-1.5 ${open ? 'border-t border-white/10' : ''}`}
        >
          <textarea
            ref={inputRef}
            name="question"
            rows={1}
            value={input}
            aria-label="Ask the portfolio assistant"
            aria-controls={menuOpen ? 'agent-slash-menu' : undefined}
            aria-activedescendant={menuOpen && commands[activeIndex] ? `agent-slash-${commands[activeIndex].id}` : undefined}
            onChange={(event) => {
              setInput(event.target.value);
              setMenuIndex(0);
              setMenuDismissed(false);
            }}
            onKeyDown={onComposerKey}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            className="max-h-[120px] min-w-0 flex-1 resize-none bg-transparent py-1.5 text-[13px] leading-5 text-white placeholder:text-gray-500 focus:outline-none"
          />

          {!open && messages.length > 0 && (
            <button
              type="button"
              onClick={() => setMode('open')}
              aria-label={unread ? 'Show the new reply' : 'Show the conversation'}
              title="Show the conversation"
              className={`${iconButton} relative`}
            >
              {Icon.up}
              {(unread || busy) && (
                <span className={`absolute right-1 top-1 size-1.5 rounded-full bg-white ${busy ? 'animate-pulse' : ''}`} />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => void dictation.toggle()}
            disabled={dictation.state === 'requesting' || dictation.state === 'transcribing'}
            aria-label={dictation.state === 'recording' ? 'Finish dictation' : 'Dictate a message'}
            aria-pressed={dictation.state === 'recording'}
            className={dictation.state === 'recording' ? `${iconButton} bg-white text-black hover:bg-white hover:text-black` : iconButton}
          >
            {Icon.mic}
          </button>

          {busy ? (
            <button type="button" onClick={() => stop()} aria-label="Stop the answer" className={`${iconButton} text-white`}>
              {Icon.stop}
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send"
              className="grid size-7 shrink-0 place-items-center bg-white text-black transition-opacity disabled:opacity-25"
            >
              {Icon.send}
            </button>
          )}

          {!open && (
            <button type="button" onClick={() => setMode('closed')} aria-label="Close the assistant" title="Close" className={iconButton}>
              {Icon.close}
            </button>
          )}
        </form>
      </section>
      </div>

      {dictation.error && (
        <p role="alert" className="pointer-events-auto card-surface border border-white/10 bg-black/95 px-3 py-1.5 text-[11px] text-gray-300">
          {dictation.error}
        </p>
      )}
      </div>
    </div>
  );
};
