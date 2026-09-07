import React, { useState, useEffect, useRef } from 'react';
import { LiveSessionManager } from '../services/realtime';
import { AudioVisualizer } from './AudioVisualizer';
import { soundEffects } from '../services/sound';

export const LiveDemo: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [volume, setVolume] = useState(0);
  const sessionManager = useRef<LiveSessionManager | null>(null);

  const toggleSession = async () => {
    soundEffects.playClick();
    
    if (isActive) {
      soundEffects.playDisconnect();
      if (sessionManager.current) {
        await sessionManager.current.disconnect();
        sessionManager.current = null;
      }
      setIsActive(false);
      setVolume(0);
    } else {
      setIsConnecting(true);
      try {
        sessionManager.current = new LiveSessionManager((v) => setVolume(v));
        await sessionManager.current.connect();
        soundEffects.playConnect();
        setIsActive(true);
      } catch (error) {
        console.error('Failed to connect to Voice Hub', error);
        if (sessionManager.current) {
            await sessionManager.current.disconnect();
            sessionManager.current = null;
        }
        alert('Could not start Voice Hub. Try again in a moment.');
      } finally {
        setIsConnecting(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (sessionManager.current) {
        sessionManager.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="relative bg-black border border-mono-border p-4 md:p-8 max-w-2xl mx-auto shadow-2xl">
      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white"></div>
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-white"></div>
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-white"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white"></div>

      <div className="flex flex-col items-center text-center">
        <div className="mb-8">
            <div className="flex items-center justify-center gap-4 mb-2">
                <h2 className="text-3xl font-light text-white tracking-widest">VOICE HUB</h2>
                <a href="https://github.com/RealSid08/AuraHub" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
                    <svg fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                </a>
            </div>
          <p className="text-gray-500 text-xs font-mono uppercase">OpenAI Realtime Voice Connection</p>
        </div>

        <div className="relative w-full flex justify-center mb-12">
          <AudioVisualizer isActive={isActive} volume={volume} />
        </div>

        <button
          onClick={toggleSession}
          disabled={isConnecting}
          className={`
            w-full md:w-auto px-10 py-4 text-sm font-mono uppercase tracking-widest transition-all duration-300 flex justify-center items-center gap-3 border
            ${isActive 
              ? 'bg-white text-black border-white hover:bg-gray-200' 
              : 'bg-black text-white border-white hover:bg-white hover:text-black'}
          `}
        >
          {isConnecting ? (
            <span>INITIALIZING...</span>
          ) : isActive ? (
            <>
              <span className="w-2 h-2 bg-black rounded-full animate-pulse" />
              END SESSION
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
              Talk to Voice Hub
            </>
          )}
        </button>

        <p className="mt-6 text-[10px] text-gray-600 font-mono uppercase">
          Microphone access required for voice telemetry
        </p>
      </div>
    </div>
  );
};