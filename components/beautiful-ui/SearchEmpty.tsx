import React from 'react';

type SearchEmptyProps = {
  queries: string[];
  onPick: (query: string) => void;
};

export const SearchEmpty: React.FC<SearchEmptyProps> = ({ queries, onPick }) => {
  return (
    <div className="py-4 space-y-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">Search the resume</p>
      <div className="space-y-1">
        {queries.map((query) => (
          <button
            key={query}
            type="button"
            onClick={() => onPick(query)}
            className="w-full text-left text-[13px] text-gray-300 hover:text-white hover:bg-white/5 px-2 py-2 transition-colors"
          >
            {query}
          </button>
        ))}
      </div>
    </div>
  );
};
