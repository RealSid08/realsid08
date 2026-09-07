import React, { useEffect, useState } from 'react';

type PixelLoaderProps = {
  label?: string;
  variant?: 'drive' | 'dots' | 'orbit';
};

export const PixelLoader: React.FC<PixelLoaderProps> = ({ label = 'Churning', variant = 'drive' }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      setElapsed((Date.now() - started) / 1000);
    }, 80);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-3 font-mono text-[11px] text-gray-400">
      <div className="relative grid grid-cols-4 gap-[3px] w-8 h-8">
        {Array.from({ length: 16 }).map((_, index) => (
          <span
            key={index}
            className="block w-[6px] h-[6px] bg-white/15"
            style={{
              animation: variant === 'orbit'
                ? `bui-orbit 1.2s linear ${index * 40}ms infinite`
                : `bui-pixel 1s ease-in-out ${index * 55}ms infinite`,
            }}
          />
        ))}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-white uppercase tracking-[0.18em]">{label}</span>
        <span className="text-gray-500 tabular-nums">{elapsed.toFixed(1)}s</span>
      </div>
      <style>{`
        @keyframes bui-pixel {
          0%, 100% { opacity: 0.15; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1); background: #fff; }
        }
        @keyframes bui-orbit {
          0% { opacity: 0.2; }
          40% { opacity: 1; background: #fff; }
          100% { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
};
