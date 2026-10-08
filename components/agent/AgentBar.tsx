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
import { useDictation } from '../../services/useDictation';
import { AgentStatus } from './AgentStatus';
import { AgentSteps } from './AgentSteps';
import { SlashMenu } from './SlashMenu';
import { PortfolioLink } from './PortfolioLink';
import { portfolioEvidenceRegistry } from './PortfolioEvidence';
import { withoutCitationTokens } from '../../lib/replyText';

/** closed: a small pen button. compact: just the composer card. open: the conversation too. */
type Mode = 'closed' | 'compact' | 'open';
/** desk: wide enough to dock the conversation beside the book. sheet: it rises from the bottom. */
type Layout = 'desk' | 'tablet' | 'phone';

const STORAGE = { thread: 'agent-thread', closed: 'agent-closed' };
const PANEL_WIDTH = 400;

const STARTERS = [
  'What is he working on right now?',
  'Which project best shows how he thinks?',
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

const layoutFor = (width: number): Layout => (width >= 1024 ? 'desk' : width >= 640 ? 'tablet' : 'phone');

const useLayout = () => {
  const [layout, setLayout] = useState<Layout>(() => (typeof window === 'undefined' ? 'desk' : layoutFor(window.innerWidth)));
  useEffect(() => {
    const onResize = () => setLayout(layoutFor(window.innerWidth));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return layout;
};

const textOf = (message: UIMessage) =>
  withoutCitationTokens(
    (message.parts ?? [])
      .filter((part) => part.type === 'text')
      .map((part) => (part as { text?: string }).text ?? '')
      .join('\n\n'),
  );

const AssistantReply: React.FC<{ message: UIMessage; streaming: boolean }> = React.memo(({ message, streaming }) => {
  const { text: raw, spec, hasSpec } = useJsonRenderMessage(message.parts as DataPart[]);
  const text = raw ? withoutCitationTokens(raw) : raw;
  return (
    <div className="min-w-0 break-words text-[13.5px] leading-[1.6] text-gray-200">
      {text && (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
          p: ({ children }) => <p className="mb-2.5 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-2.5 list-disc space-y-1 pl-4 marker:text-gray-500 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2.5 list-decimal space-y-1 pl-4 marker:text-gray-500 last:mb-0">{children}</ol>,
          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
          a: ({ children, href }) => <PortfolioLink href={href}>{children}</PortfolioLink>,
          code: ({ children }) => <code className="rounded bg-white/[0.06] px-1 font-mono text-[12px] text-white">{children}</code>,
          pre: ({ children }) => <pre className="my-2 overflow-x-auto rounded-md border border-white/10 bg-white/[0.04] p-2 text-[11px]">{children}</pre>,
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
  pen: (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15.5 4.5l4 4L9 19l-5 1 1-5z" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  ),
  mic: (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0014 0M12 18v3" strokeLinecap="round" />
    </svg>
  ),
  send: (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
      <path d="M12 19V5M6 11l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  stop: <span className="block size-2.5 rounded-[2px] bg-current" aria-hidden="true" />,
  close: (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  ),
  tuck: (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  open: (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="M6 15l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  /** A fresh sheet with a pencil: start a new conversation. */
  newPage: (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13 3H6.5A1.5 1.5 0 005 4.5v15A1.5 1.5 0 006.5 21h11a1.5 1.5 0 001.5-1.5V12" />
      <path d="M17.6 3.4a1.6 1.6 0 012.3 2.3L13 12.6l-3 .7.7-3z" />
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
  'grid size-8 shrink-0 place-items-center rounded-full text-gray-400 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-mono-accent disabled:opacity-40';

/** A pen squiggle that keeps drawing while the assistant works. */
const Thinking: React.FC = () => (
  <p className="agent-thinking py-1" aria-label="Thinking">
    <svg viewBox="0 0 120 16" className="h-4 w-24" aria-hidden="true">
      <path d="M2 10 C 12 2, 18 14, 28 8 S 44 4, 52 10 S 70 14, 78 7 S 96 3, 104 9 S 114 12, 118 8" />
    </svg>
  </p>
);

export const AgentBar: React.FC = () => {
  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/chat' }), []);
  const { messages, sendMessage, status, error, stop, setMessages, regenerate } = useChat({ transport });
  const layout = useLayout();
  const [mode, setMode] = useState<Mode>(() => {
    if (storage.get('local', STORAGE.closed) === 'true') return 'closed';
    return typeof window !== 'undefined' && layoutFor(window.innerWidth) === 'phone' ? 'closed' : 'compact';
  });
  const [input, setInput] = useState('');
  const [menuIndex, setMenuIndex] = useState(0);
  const [menuDismissed, setMenuDismissed] = useState(false);
  const [unread, setUnread] = useState(false);
  const [restored, setRestored] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const executed = useRef<Set<string>>(new Set());
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

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
  const docked = layout === 'desk' && mode === 'open';
  const sheet = layout !== 'desk' && mode === 'open';

  const focusInput = useCallback((text?: string) => {
    if (text !== undefined) setInput(text);
    setMenuDismissed(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  /* ---------- make room for the conversation on the desk ---------- */

  useLayoutEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--agent-right', docked ? `${PANEL_WIDTH + 12}px` : '0px');
    root.setProperty('--agent-bottom', mode === 'compact' ? '64px' : '0px');
    document.documentElement.classList.toggle('agent-launcher', mode === 'closed' || layout === 'phone');
  }, [docked, mode, layout]);

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

  useEffect(() => storage.set('local', STORAGE.closed, mode === 'closed' && layout !== 'phone' ? 'true' : null), [mode, layout]);

  /* ---------- run the page actions the assistant asks for ---------- */

  useEffect(() => {
    const intents = pageIntentsFromMessages(messages, executed.current);
    intents.forEach((intent) => {
      executed.current.add(intent.id);
      void runTool(intent.name, intent.args);
    });
    // On a phone the sheet covers the book, so tuck it away to let the visitor watch the page turn.
    if (intents.length > 0 && layoutRef.current === 'phone' && modeRef.current === 'open') {
      setMode('closed');
      setUnread(true);
    }
  }, [messages]);

  /* ---------- thread scrolling ---------- */

  useLayoutEffect(() => {
    const el = threadRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages, status, mode]);

  /* ---------- a finished reply while tucked away is flagged, not forced open ---------- */

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
      const open = () => setMode((current) => (current === 'closed' ? (layoutRef.current === 'phone' ? 'open' : 'compact') : current));
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        open();
        focusInput('/');
        return;
      }
      if (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        open();
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
    if (command.steps) {
      if (layoutRef.current === 'phone') setMode('closed');
      void runSteps(command.steps(arg));
    }
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
      if (mode === 'open') setMode(layoutRef.current === 'phone' ? 'closed' : 'compact');
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

  if (mode === 'closed') {
    return (
      <div className="agent-paper agent-launch">
        <div className="agent-toast"><AgentStatus /></div>
        <button
          type="button"
          onClick={() => {
            setMode(layout === 'phone' || messages.length > 0 ? 'open' : 'compact');
            focusInput();
          }}
          aria-label={unread ? 'Open the assistant: a new reply is waiting' : 'Ask about my work'}
          className="agent-launch-button"
        >
          {Icon.pen}
          <span className="agent-launch-label">Ask about my work</span>
          {unread && <span className="agent-unread" aria-hidden="true" />}
        </button>
      </div>
    );
  }

  const placeholder =
    dictation.state === 'requesting' ? 'Waiting for the microphone…'
      : dictation.state === 'recording' ? 'Listening… tap the mic to finish'
        : dictation.state === 'transcribing' ? 'Writing it down…'
          : 'Ask about my work, or type /';

  const open = mode === 'open';
  const lastId = messages.at(-1)?.id;
  const waiting = busy && (messages.at(-1)?.role === 'user' || (messages.at(-1)?.parts ?? []).length === 0);
  const shellClass = docked ? 'agent-shell agent-docked' : sheet ? 'agent-shell agent-sheet' : 'agent-shell agent-strip';

  return (
    <div className={`agent-paper ${shellClass}`}>
      {sheet && <button type="button" className="agent-scrim" aria-label="Close the assistant" onClick={() => setMode(layout === 'phone' ? 'closed' : 'compact')} />}
      {!docked && <div className="agent-toast"><AgentStatus /></div>}
      <section aria-label="Portfolio assistant" className="agent-card">
        {open && (
          <>
            <header className="flex items-start gap-2 border-b border-white/10 px-4 pb-3 pt-3.5">
              <div className="min-w-0 flex-1">
                <h2 className="font-serif text-[23px] leading-none text-white">Ask about my work</h2>
                <p className="mt-1.5 font-hand text-[16px] leading-none text-mono-accent">answers come from my roles, projects and public GitHub</p>
              </div>
              {messages.length > 0 && (
                <button type="button" onClick={clearThread} aria-label="Start a new conversation" title="New conversation" className={iconButton}>
                  {Icon.newPage}
                </button>
              )}
              <button
                type="button"
                onClick={() => setMode(layout === 'phone' ? 'closed' : 'compact')}
                aria-label="Tuck the conversation away"
                title="Tuck away (Esc)"
                className={iconButton}
              >
                {Icon.tuck}
              </button>
              {layout !== 'phone' && (
                <button type="button" onClick={() => setMode('closed')} aria-label="Close the assistant" title="Close" className={iconButton}>
                  {Icon.close}
                </button>
              )}
            </header>

            {docked && <AgentStatus />}

            <div
              ref={threadRef}
              onScroll={(event) => {
                const el = event.currentTarget;
                stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
              }}
              aria-busy={busy}
              aria-live="polite"
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4"
            >
              {messages.length === 0 ? (
                <div className="space-y-4">
                  <p className="text-[13.5px] leading-relaxed text-gray-300">
                    Ask anything about what I’ve built. The notebook turns to whatever the answer is about.
                  </p>
                  <div className="flex flex-col items-start gap-2">
                    {STARTERS.map((starter) => (
                      <button key={starter} type="button" onClick={() => send(starter)} className="agent-starter">
                        {starter}
                      </button>
                    ))}
                  </div>
                  <p className="font-mono text-[10.5px] text-gray-500">Tip: type / for shortcuts like /parkalong or /find swift</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {messages.map((message) =>
                    message.role === 'user' ? (
                      <p key={message.id} className="agent-question">{textOf(message)}</p>
                    ) : (
                      <article key={message.id} className="group">
                        <AgentSteps message={message} streaming={busy && message.id === lastId} />
                        <AssistantReply message={message} streaming={busy && message.id === lastId} />
                        {!(busy && message.id === lastId) && textOf(message) && (
                          <button
                            type="button"
                            onClick={() => void navigator.clipboard?.writeText(textOf(message))}
                            className="mt-1.5 flex items-center gap-1 font-mono text-[10px] text-gray-500 opacity-0 transition-opacity hover:text-white focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                          >
                            {Icon.copy} Copy
                          </button>
                        )}
                      </article>
                    ),
                  )}
                  {waiting && <Thinking />}
                  {error && !busy && (
                    <p className="flex items-center gap-3 text-[12.5px] text-gray-300">
                      That one didn’t come through.
                      <button type="button" onClick={() => void regenerate()} className="font-mono text-[10px] uppercase tracking-[0.12em] text-white underline underline-offset-4">
                        Try again
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
          className={`agent-composer ${open ? 'border-t border-white/10' : ''}`}
        >
          {!open && <span className="text-mono-accent" aria-hidden="true">{Icon.pen}</span>}
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
            placeholder={placeholder}
            className="max-h-[120px] min-w-0 flex-1 resize-none bg-transparent py-1.5 text-[14px] leading-5 text-white placeholder:text-gray-500 focus:outline-none"
          />

          {!open && messages.length > 0 && (
            <button type="button" onClick={() => setMode('open')} aria-label={unread ? 'Show the new reply' : 'Show the conversation'} title="Show the conversation" className={`${iconButton} relative`}>
              {Icon.open}
              {(unread || busy) && <span className={`agent-unread ${busy ? 'animate-pulse' : ''}`} />}
            </button>
          )}

          <button
            type="button"
            onClick={() => void dictation.toggle()}
            disabled={dictation.state === 'requesting' || dictation.state === 'transcribing'}
            aria-label={dictation.state === 'recording' ? 'Finish dictation' : 'Dictate a message'}
            aria-pressed={dictation.state === 'recording'}
            className={dictation.state === 'recording' ? `${iconButton} bg-mono-accent text-black hover:bg-mono-accent hover:text-black` : iconButton}
          >
            {Icon.mic}
          </button>

          {busy ? (
            <button type="button" onClick={() => stop()} aria-label="Stop the answer" className={`${iconButton} text-white`}>
              {Icon.stop}
            </button>
          ) : (
            <button type="submit" disabled={!input.trim()} aria-label="Send" className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-black transition-opacity disabled:opacity-25">
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

      {dictation.error && (
        <p role="alert" className="agent-note">{dictation.error}</p>
      )}
    </div>
  );
};
