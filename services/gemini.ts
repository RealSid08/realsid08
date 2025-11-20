import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION_CHAT, SYSTEM_INSTRUCTION_LIVE } from "../constants";

// --- Chat Service ---

export const createChatSession = () => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_CHAT,
    },
  });
};

// --- Live API Service Utils ---

// Audio Encoding/Decoding Utils
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// Live Session Manager
export class LiveSessionManager {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private onVolumeChange: (volume: number) => void;

  // Analysers for visualization
  private outputAnalyser: AnalyserNode | null = null;
  private animationFrameId: number | null = null;

  constructor(onVolumeChange: (volume: number) => void) {
    // Use v1alpha to support affective dialog
    this.ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY, apiVersion: 'v1alpha' });
    this.onVolumeChange = onVolumeChange;
  }

  async connect() {
    // 1. Initialize AudioContexts immediately to be ready
    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

    this.outputAnalyser = this.outputAudioContext.createAnalyser();
    this.outputAnalyser.fftSize = 32;
    this.outputAnalyser.smoothingTimeConstant = 0.1;

    // 2. Start Microphone Request in Parallel (Don't await yet)
    const streamPromise = navigator.mediaDevices.getUserMedia({ audio: true });

    // 3. Connect to Gemini Immediately
    this.sessionPromise = this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => {
          console.log('Gemini Live Session Opened');
          // Start visuals immediately upon connection
          this.startVolumeAnalysis();
        },
        onmessage: async (message: LiveServerMessage) => {
          const base64EncodedAudioString = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64EncodedAudioString && this.outputAudioContext && this.outputAnalyser) {
            this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);

            const audioBuffer = await decodeAudioData(
              decode(base64EncodedAudioString),
              this.outputAudioContext,
              24000,
              1
            );

            const source = this.outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;

            source.connect(this.outputAnalyser);
            this.outputAnalyser.connect(this.outputAudioContext.destination);

            source.addEventListener('ended', () => {
              this.sources.delete(source);
            });

            source.start(this.nextStartTime);
            this.nextStartTime = this.nextStartTime + audioBuffer.duration;
            this.sources.add(source);
          }

          const interrupted = message.serverContent?.interrupted;
          if (interrupted) {
            this.stopAudioPlayback();
            this.nextStartTime = 0;
          }
        },
        onclose: () => console.log('Gemini Live Session Closed'),
        onerror: (e) => console.error('Gemini Live Error', e),
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
        systemInstruction: SYSTEM_INSTRUCTION_LIVE,
        tools: [{ googleSearch: {} }],
        enableAffectiveDialog: true
      },
    });

    // 4. Trigger Initial Greeting IMMEDIATELY when session resolves
    this.sessionPromise.then(async (session) => {
      try {
        // Send a dummy user turn to force the model to speak its instruction
        await (session as any).sendClientContent({
          turns: [{ role: 'user', parts: [{ text: "." }] }],
          turnComplete: true
        });
      } catch (e) {
        console.warn("Failed to trigger initial greeting:", e);
      }
    });

    // 5. Handle Microphone Stream Asynchronously (Don't block connection)
    streamPromise.then((stream) => {
      this.stream = stream;
      this.startAudioStreaming();
    }).catch((err) => {
      console.error("Microphone access denied or failed:", err);
    });

    // Return as soon as the session connection is established
    // We do NOT wait for the microphone stream here, allowing UI to show "connected" state instantly
    await this.sessionPromise;
  }

  private startAudioStreaming() {
    if (!this.inputAudioContext || !this.stream) return;

    this.sourceNode = this.inputAudioContext.createMediaStreamSource(this.stream);
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = createBlob(inputData);

      if (this.sessionPromise) {
        this.sessionPromise.then((session) => {
          session.sendRealtimeInput({ media: pcmBlob });
        });
      }
    };

    this.sourceNode.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private startVolumeAnalysis() {
    const analyze = () => {
      let outputVol = 0;

      if (this.outputAnalyser) {
        const data = new Uint8Array(this.outputAnalyser.frequencyBinCount);
        this.outputAnalyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        outputVol = sum / data.length / 255;
      }

      this.onVolumeChange(outputVol * 1.5);
      this.animationFrameId = requestAnimationFrame(analyze);
    };

    analyze();
  }

  private stopAudioPlayback() {
    for (const source of this.sources.values()) {
      source.stop();
      this.sources.delete(source);
    }
  }

  async disconnect() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.sessionPromise) {
      const session = await this.sessionPromise;
      // No explicit close method on session object in current SDK version, 
      // but standard cleanup is to stop sending and close context.
      this.sessionPromise = null;
    }

    this.stopAudioPlayback();

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.inputAudioContext) {
      this.inputAudioContext.close();
      this.inputAudioContext = null;
    }
    if (this.outputAudioContext) {
      this.outputAudioContext.close();
      this.outputAudioContext = null;
    }

    this.outputAnalyser = null;
  }
}