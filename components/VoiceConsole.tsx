import React from 'react';
import { AudioVisualizer } from './AudioVisualizer';
import { useVoiceSession } from '../services/useVoiceSession';

type VoiceConsoleProps = {
  /** tighter spacing for use inside the assistant panel */
  compact?: boolean;
};

/**
 * The voice agent: a realtime session over the OpenAI Realtime API.
 * Used inside the assistant panel, and standalone under the work section.
 */
export const VoiceConsole: React.FC<VoiceConsoleProps> = ({ compact = false }) => {
  const { isActive, isConnecting, volume, failed, toggle } = useVoiceSession();

  return (
    <div className={`flex flex-col items-center text-center ${compact ? 'gap-2 py-0' : 'gap-6'}`}>
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
        <span
          className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-400 animate-pulse motion-reduce:animate-none' : 'bg-gray-600'}`}
          aria-hidden="true"
        />
        {isConnecting ? 'Connecting' : isActive ? 'Live — speak normally' : 'Voice agent idle'}
      </div>

      <AudioVisualizer
        isActive={isActive}
        volume={volume}
        className={compact ? 'w-[84px] h-[84px] mx-auto' : undefined}
      />

      <button
        type="button"
        onClick={toggle}
        disabled={isConnecting}
        className={`border font-mono uppercase tracking-widest transition-colors ${
          compact ? 'px-4 py-1.5 text-[10px]' : 'px-10 py-4 text-sm'
        } ${
          isActive
            ? 'bg-white text-black border-white hover:bg-white/80'
            : 'bg-black text-white border-white hover:bg-white hover:text-black'
        }`}
      >
        {isConnecting ? 'Initialising…' : isActive ? 'End session' : 'Start talking'}
      </button>

      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-600 max-w-sm">
        {failed
          ? 'The voice service did not start — it needs an API key on the server.'
          : 'Asks for microphone access so you can talk to it'}
      </p>
    </div>
  );
};
