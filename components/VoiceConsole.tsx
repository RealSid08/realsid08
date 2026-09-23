import React, { useEffect, useRef, useState } from 'react';
import { LiveSessionManager } from '../services/realtime';
import { AudioVisualizer } from './AudioVisualizer';
import { soundEffects } from '../services/sound';

type VoiceConsoleProps = {
  /** tighter spacing for use inside the assistant panel */
  compact?: boolean;
};

/**
 * The voice agent: a realtime session over the OpenAI Realtime API.
 * Used inside the assistant panel, and standalone under the work section.
 */
export const VoiceConsole: React.FC<VoiceConsoleProps> = ({ compact = false }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [volume, setVolume] = useState(0);
  const [failed, setFailed] = useState(false);
  const sessionManager = useRef<LiveSessionManager | null>(null);

  const toggleSession = async () => {
    soundEffects.playClick();
    setFailed(false);

    if (isActive) {
      soundEffects.playDisconnect();
      await sessionManager.current?.disconnect();
      sessionManager.current = null;
      setIsActive(false);
      setVolume(0);
      return;
    }

    setIsConnecting(true);
    try {
      const manager = new LiveSessionManager((value) => setVolume(value));
      await manager.connect();
      sessionManager.current = manager;
      soundEffects.playConnect();
      setIsActive(true);
    } catch (error) {
      console.error('Failed to start the voice demo', error);
      await sessionManager.current?.disconnect();
      sessionManager.current = null;
      setFailed(true);
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => () => void sessionManager.current?.disconnect(), []);

  return (
    <div className={`flex flex-col items-center text-center ${compact ? 'gap-3 py-2' : 'gap-6'}`}>
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
        <span
          className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-400 animate-pulse motion-reduce:animate-none' : 'bg-gray-600'}`}
          aria-hidden="true"
        />
        {isConnecting ? 'Connecting' : isActive ? 'Live — speak normally' : 'Voice agent idle'}
      </div>

      <AudioVisualizer isActive={isActive} volume={volume} />

      <button
        type="button"
        onClick={toggleSession}
        disabled={isConnecting}
        className={`border font-mono uppercase tracking-widest transition-colors ${
          compact ? 'px-5 py-2.5 text-[10px]' : 'px-10 py-4 text-sm'
        } ${
          isActive
            ? 'bg-white text-black border-white hover:bg-white/80'
            : 'bg-black text-white border-white hover:bg-white hover:text-black'
        }`}
      >
        {isConnecting ? 'Initialising…' : isActive ? 'End session' : 'Start talking'}
      </button>

      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-600 max-w-sm">
        {failed
          ? 'The voice service did not start — it needs an API key on the server.'
          : 'Asks for microphone access so you can talk to it'}
      </p>
    </div>
  );
};
