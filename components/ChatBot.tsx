import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { soundEffects } from '../services/sound';
import { EXPERIENCES, PROJECTS } from '../constants';
import { ChatShell, type ChatTab } from './beautiful-ui/ChatShell';
import { PixelLoader } from './beautiful-ui/PixelLoader';
import { ThinkingTrace, type ThinkingStep } from './beautiful-ui/ThinkingTrace';
import { ToolChips, type ToolChip } from './beautiful-ui/ToolChips';
import { ContextCards, type ContextChunk } from './beautiful-ui/ContextCards';
import { StreamingAnswer } from './beautiful-ui/StreamingAnswer';
import { PromptBar } from './beautiful-ui/PromptBar';
import { SearchEmpty } from './beautiful-ui/SearchEmpty';
import { RecommendationCard } from './beautiful-ui/RecommendationCard';

const ASK_QUERIES = [
  'What is Sidhaarth working on right now?',
  'Walk me through Foodly',
  'Why does ParkAlong matter?',
  'When is he available full-time?',
];

const SLASH_PROMPTS: Record<string, string> = {
  '/work': 'Summarize Sidhaarth\'s active workstreams.',
  '/projects': 'Summarize Foodly and ParkAlong.',
  '/contact': 'How can I contact Sidhaarth, and when is he available?',
};

type MessagePart = {
  type: string;
  text?: string;
  state?: string;
  input?: unknown;
  output?: unknown;
  toolName?: string;
};

function asParts(message: UIMessage): MessagePart[] {
  return (message.parts ?? []) as MessagePart[];
}

function textFrom(parts: MessagePart[]): string {
  return parts.filter((part) => part.type === 'text').map((part) => part.text ?? '').join('');
}

function thinkingFrom(parts: MessagePart[], running: boolean): ThinkingStep[] {
  const steps: ThinkingStep[] = [];
  parts.forEach((part, index) => {
    if (part.type === 'reasoning' && part.text) {
      steps.push({
        id: `reason-${index}`,
        kind: 'reasoning',
        title: 'Reasoning',
        detail: part.text,
        running,
      });
    }
    if (part.type.startsWith('tool-')) {
      const name = part.type.replace(/^tool-/, '');
      const input = part.input && typeof part.input === 'object' ? JSON.stringify(part.input) : '';
      steps.push({
        id: `tool-step-${index}`,
        kind: 'tool',
        title: name,
        detail: input,
        running: part.state === 'input-streaming' || part.state === 'input-available' || part.state === 'running',
      });
    }
  });
  return steps;
}

function chipsFrom(parts: MessagePart[]): ToolChip[] {
  return parts.flatMap((part, index) => {
    if (!part.type.startsWith('tool-')) return [];
    const name = part.type.replace(/^tool-/, '');
    const input = part.input && typeof part.input === 'object' ? Object.values(part.input as Record<string, unknown>)[0] : '';
    const state: ToolChip['state'] =
      part.state === 'output-error' ? 'error' : part.state === 'output-available' ? 'done' : 'running';
    return [{
      id: `${name}-${index}`,
      name,
      label: String(input ?? 'resume'),
      state,
    }];
  });
}

function chunksFrom(parts: MessagePart[]): ContextChunk[] {
  return parts.flatMap((part, index) => {
    if (!part.type.startsWith('tool-') || part.state !== 'output-available') return [];
    const name = part.type.replace(/^tool-/, '');
    const body = typeof part.output === 'string' ? part.output : JSON.stringify(part.output ?? '');
    return [{
      id: `chunk-${index}`,
      title: name,
      source: 'Resume',
      body,
    }];
  });
}

function followUpsFor(text: string): string[] {
  const lower = text.toLowerCase();
  if (lower.includes('foodly')) return ['How does ParkAlong compare?', 'What is he building at Besmak?'];
  if (lower.includes('parkalong')) return ['Tell me about Foodly', 'What stack does he use?'];
  if (lower.includes('besmak') || lower.includes('kenspire') || lower.includes('complete leader')) {
    return ['What are the featured projects?', 'When is he available?'];
  }
  return ['Summarize active workstreams', 'Show contact details'];
}

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [tab, setTab] = useState<ChatTab>('ask');
  const [input, setInput] = useState('');
  const hasAutoOpened = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/chat' }), []);
  const { messages, sendMessage, status, error } = useChat({ transport });

  const busy = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    const timer = window.setTimeout(() => setIsMounted(true), 400);
    const onScroll = () => {
      if (window.scrollY > 300 && !hasAutoOpened.current) {
        setIsOpen(true);
        hasAutoOpened.current = true;
        soundEffects.playClick();
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, status]);

  const submitPrompt = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed || busy) return;
    const text = SLASH_PROMPTS[trimmed] ?? trimmed.replace(/@resume/g, 'from the resume').replace(/@besmak/g, 'Besmak').replace(/@foodly/g, 'Foodly');
    soundEffects.playMessageSent();
    void sendMessage({ text });
    setInput('');
    setTab('ask');
  };

  const lastAssistant = [...messages].reverse().find((message) => message.role === 'assistant');
  const lastText = lastAssistant ? textFrom(asParts(lastAssistant)) : '';

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end pointer-events-none font-sans">
      <div
        className={`
          ${isMounted ? 'transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]' : ''}
          ${isOpen ? 'opacity-100 scale-100 translate-y-0 visible mb-4' : 'opacity-0 scale-75 translate-y-10 invisible h-0 mb-0'}
        `}
      >
        <ChatShell
          tab={tab}
          onTab={setTab}
          onClose={() => setIsOpen(false)}
          footer={
            <PromptBar
              value={input}
              onChange={setInput}
              onSubmit={() => submitPrompt(input)}
              disabled={busy}
            />
          }
        >
          {tab === 'work' && (
            <ContextCards
              chunks={EXPERIENCES.filter((exp) => exp.lane === 'active').map((exp) => ({
                id: exp.id,
                title: exp.company,
                source: exp.period,
                body: `${exp.role} · ${exp.description[0] ?? ''}`,
              }))}
            />
          )}
          {tab === 'projects' && (
            <ContextCards
              chunks={PROJECTS.filter((project) => project.featured || project.id === 'foodly' || project.id === 'parkalong').map((project) => ({
                id: project.id,
                title: project.title,
                source: project.period ?? project.type,
                body: project.bullets?.[0] ?? project.description,
              }))}
            />
          )}

          {tab === 'ask' && messages.length === 0 && (
            <SearchEmpty queries={ASK_QUERIES} onPick={submitPrompt} />
          )}

          {tab === 'ask' && messages.map((message) => {
            const parts = asParts(message);
            const chips = chipsFrom(parts);
            const chunks = chunksFrom(parts);
            const steps = thinkingFrom(parts, message.role === 'assistant' && busy);
            const text = textFrom(parts);
            const isLast = lastAssistant?.id === message.id;

            return (
              <div key={message.id} className={message.role === 'user' ? 'flex justify-end' : 'space-y-3'}>
                {message.role === 'user' ? (
                  <div className="max-w-[85%] bg-white text-black px-3 py-2 text-[13px]">{text}</div>
                ) : (
                  <>
                    <ThinkingTrace steps={steps} running={isLast && busy} />
                    <ToolChips chips={chips} />
                    <ContextCards chunks={chunks} />
                    <StreamingAnswer
                      text={text}
                      streaming={isLast && status === 'streaming' && Boolean(text)}
                      followUps={isLast && !busy ? followUpsFor(text) : []}
                      onFollowUp={submitPrompt}
                    />
                  </>
                )}
              </div>
            );
          })}

          {tab === 'ask' && status === 'submitted' && (
            <PixelLoader label="Thinking" variant="drive" />
          )}
          {tab === 'ask' && error && (
            <p className="text-[12px] text-gray-400">Chat stream failed. Try again, or ask about Besmak, Foodly, or availability.</p>
          )}
          {tab === 'ask' && lastText && !busy && (
            <RecommendationCard
              question="Want me to open the workstreams?"
              suggestion="Jump to Besmak, Complete Leader, and Kenspire on the page."
              href="#experience"
            />
          )}
          <div ref={bottomRef} />
        </ChatShell>
      </div>

      <button
        type="button"
        onClick={() => {
          soundEffects.playClick();
          setIsOpen((open) => !open);
        }}
        className="pointer-events-auto w-14 h-14 bg-black border border-white hover:bg-white hover:text-black transition-colors flex items-center justify-center"
        aria-label="Open assistant"
      >
        <span className="font-mono text-[10px] tracking-[0.14em]">{isOpen ? 'CLS' : 'ASK'}</span>
      </button>
    </div>
  );
};
