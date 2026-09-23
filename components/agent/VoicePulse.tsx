import React from 'react';

type VoicePulseProps = {
  active: boolean;
  connecting?: boolean;
  volume: number;
  /** compact sits inside the bar; roomy is used on the standalone card */
  bars?: number;
};

const heights = (index: number) => 0.35 + Math.abs(Math.sin(index * 0.7)) * 0.5;

export const VoicePulse: React.FC<VoicePulseProps> = ({ active, connecting = false, volume, bars = 14 }) => (
  <span className="flex items-center gap-[2px] h-5" aria-hidden="true">
    {Array.from({ length: bars }).map((_, index) => {
      const base = heights(index);
      const scale = active ? Math.min(1, base + volume * 0.9) : connecting ? 0.25 : base * 0.35;
      return (
        <span
          key={index}
          className={`w-[2px] rounded-full transition-[height] duration-100 ${
            active ? 'bg-white' : connecting ? 'bg-white/60' : 'bg-white/25'
          }`}
          style={{ height: `${Math.max(3, Math.round(scale * 20))}px` }}
        />
      );
    })}
  </span>
);
