import React from 'react';
import ReactMarkdown from 'react-markdown';

type StreamingAnswerProps = {
  text: string;
  streaming?: boolean;
  followUps?: string[];
  onFollowUp?: (prompt: string) => void;
};

export const StreamingAnswer: React.FC<StreamingAnswerProps> = ({
  text,
  streaming = false,
  followUps = [],
  onFollowUp,
}) => {
  if (!text && !streaming) return null;

  return (
    <div className="space-y-3">
      <div className="text-[13px] text-gray-200 leading-relaxed markdown-content">
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="pl-1">{children}</li>,
            strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
            a: ({ href, children }) => (
              <a href={href} className="underline underline-offset-2 hover:text-white" target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
            code: ({ children }) => <code className="bg-white/10 px-1 py-[1px] font-mono text-[11px]">{children}</code>,
          }}
        >
          {text}
        </ReactMarkdown>
        {streaming && <span className="inline-block w-1.5 h-3 bg-white ml-0.5 align-middle animate-pulse" />}
      </div>
      {!streaming && followUps.length > 0 && (
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-500">Follow-ups</p>
          <div className="flex flex-col gap-1.5">
            {followUps.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => onFollowUp?.(prompt)}
                className="w-full text-left text-[11px] border border-white/10 px-3 py-2 text-gray-300 hover:border-white/40 hover:text-white transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
