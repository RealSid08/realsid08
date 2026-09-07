import React from 'react';

export type ContextChunk = {
  id: string;
  title: string;
  source: string;
  body: string;
};

type ContextCardsProps = {
  chunks: ContextChunk[];
};

export const ContextCards: React.FC<ContextCardsProps> = ({ chunks }) => {
  if (chunks.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-500">
        Retrieved {chunks.length} chunk{chunks.length === 1 ? '' : 's'}
      </p>
      <div className="grid grid-cols-1 gap-2">
        {chunks.map((chunk) => (
          <article key={chunk.id} className="border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h4 className="text-[12px] text-white font-medium">{chunk.title}</h4>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-gray-500">{chunk.source}</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-3 whitespace-pre-wrap">{chunk.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
};
