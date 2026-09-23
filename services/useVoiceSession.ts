import { useEffect, useRef, useState } from 'react';
import { LiveSessionManager } from './realtime';
import { soundEffects } from './sound';

/**
 * The realtime voice session, shared by the standalone voice card and the
 * compact in-bar controls.
 */
export const useVoiceSession = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [volume, setVolume] = useState(0);
  const [failed, setFailed] = useState(false);
  const session = useRef<LiveSessionManager | null>(null);

  useEffect(() => () => void session.current?.disconnect(), []);

  const toggle = async () => {
    soundEffects.playClick();
    setFailed(false);

    if (isActive) {
      soundEffects.playDisconnect();
      await session.current?.disconnect();
      session.current = null;
      setIsActive(false);
      setVolume(0);
      return;
    }

    setIsConnecting(true);
    try {
      const manager = new LiveSessionManager((value) => setVolume(value));
      await manager.connect();
      session.current = manager;
      soundEffects.playConnect();
      setIsActive(true);
    } catch (error) {
      console.error('Failed to start the voice demo', error);
      await session.current?.disconnect();
      session.current = null;
      setFailed(true);
    } finally {
      setIsConnecting(false);
    }
  };

  return { isActive, isConnecting, volume, failed, toggle };
};
