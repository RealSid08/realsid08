import React from 'react';

type RecommendationCardProps = {
  question: string;
  suggestion: string;
  confidence?: 'high' | 'medium';
  onAccept?: () => void;
  href?: string;
};

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  question,
  suggestion,
  confidence = 'high',
  onAccept,
  href,
}) => {
  return (
    <div className="border border-white/10 bg-black/40 p-3 space-y-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-gray-500">{question}</p>
      <p className="text-[12px] text-gray-200 leading-relaxed">{suggestion}</p>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-gray-500">
          {confidence === 'high' ? 'High confidence' : 'Needs review'}
        </span>
        {href ? (
          <a href={href} className="font-mono text-[10px] uppercase tracking-[0.14em] border border-white px-2 py-1 hover:bg-white hover:text-black transition-colors">
            Accept
          </a>
        ) : (
          <button
            type="button"
            onClick={onAccept}
            className="font-mono text-[10px] uppercase tracking-[0.14em] border border-white px-2 py-1 hover:bg-white hover:text-black transition-colors"
          >
            Accept
          </button>
        )}
      </div>
    </div>
  );
};
