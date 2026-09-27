import { useEffect, useRef, useState } from 'react';

type DictationState = 'idle' | 'requesting' | 'recording' | 'transcribing';

export function useDictation(onTranscript: (text: string) => void) {
  const [state, setState] = useState<DictationState>('idle');
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callback = useRef(onTranscript);
  callback.current = onTranscript;

  const release = () => {
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = null;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    recorder.current = null;
  };

  useEffect(() => () => {
    recorder.current?.stop();
    release();
  }, []);

  const toggle = async () => {
    if (state === 'recording') {
      recorder.current?.stop();
      return;
    }
    if (state !== 'idle') return;
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Microphone recording is unavailable in this browser.');
      return;
    }
    setState('requesting');
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = media;
      const mimeType = ['audio/webm', 'audio/mp4', 'audio/ogg'].find((type) => MediaRecorder.isTypeSupported(type));
      if (!mimeType) throw new Error('This browser cannot record supported audio.');
      const chunks: BlobPart[] = [];
      let failed = false;
      const active = new MediaRecorder(media, { mimeType });
      recorder.current = active;
      active.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      active.onerror = () => {
        failed = true;
        setError('Recording failed. Try again.');
        release();
        setState('idle');
      };
      active.onstop = async () => {
        release();
        if (failed) return;
        const audio = new Blob(chunks, { type: mimeType });
        if (!audio.size) { setState('idle'); return; }
        setState('transcribing');
        try {
          const form = new FormData();
          form.set('file', audio, mimeType === 'audio/mp4' ? 'dictation.mp4' : mimeType === 'audio/ogg' ? 'dictation.ogg' : 'dictation.webm');
          const response = await fetch('/api/transcribe', { method: 'POST', body: form });
          const result = await response.json() as { text?: string; error?: string };
          if (!response.ok || !result.text) throw new Error(result.error ?? 'Dictation failed.');
          callback.current(result.text);
        } catch (failure) {
          setError(failure instanceof Error ? failure.message : 'Dictation failed.');
        } finally { setState('idle'); }
      };
      active.start();
      timeout.current = setTimeout(() => { if (active.state === 'recording') active.stop(); }, 60_000);
      setState('recording');
    } catch (failure) {
      release();
      setError(failure instanceof Error ? failure.message : 'Microphone unavailable.');
      setState('idle');
    }
  };

  return { state, error, toggle };
}
