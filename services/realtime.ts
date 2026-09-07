type TokenApiResponse = {
  value?: unknown;
  error?: unknown;
};

export class LiveSessionManager {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private localStream: MediaStream | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private outputAudioContext: AudioContext | null = null;
  private outputAnalyser: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private animationFrameId: number | null = null;
  private onVolumeChange: (volume: number) => void;
  private greetingSent = false;

  constructor(onVolumeChange: (volume: number) => void) {
    this.onVolumeChange = onVolumeChange;
  }

  async connect() {
    const tokenResponse = await fetch('/api/token', { method: 'POST' });
    const payload = (await tokenResponse.json().catch(() => ({}))) as TokenApiResponse;

    if (!tokenResponse.ok || typeof payload.value !== 'string' || payload.value.length === 0) {
      throw new Error('Voice session unavailable');
    }

    const ephemeralKey = payload.value;

    this.pc = new RTCPeerConnection();

    this.audioEl = document.createElement('audio');
    this.audioEl.autoplay = true;
    this.audioEl.setAttribute('playsinline', 'true');
    this.pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (this.audioEl && remoteStream) {
        this.audioEl.srcObject = remoteStream;
      }
      if (remoteStream) {
        this.startVolumeAnalysis(remoteStream);
      }
    };

    this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    for (const track of this.localStream.getTracks()) {
      this.pc.addTrack(track, this.localStream);
    }

    this.dc = this.pc.createDataChannel('oai-events');
    this.dc.addEventListener('open', () => {
      this.sendGreeting();
    });
    this.dc.addEventListener('message', (event) => {
      this.handleServerEvent(event.data);
    });

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    const sdpResponse = await fetch('https://api.openai.com/v1/realtime/calls', {
      method: 'POST',
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${ephemeralKey}`,
        'Content-Type': 'application/sdp',
      },
    });

    if (!sdpResponse.ok) {
      const details = await sdpResponse.text();
      console.error('Realtime SDP exchange failed:', sdpResponse.status, details.slice(0, 200));
      throw new Error('Voice session unavailable');
    }

    const answer: RTCSessionDescriptionInit = {
      type: 'answer',
      sdp: await sdpResponse.text(),
    };
    await this.pc.setRemoteDescription(answer);
  }

  private sendGreeting() {
    if (!this.dc || this.dc.readyState !== 'open' || this.greetingSent) {
      return;
    }

    this.greetingSent = true;
    this.dc.send(
      JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text: 'Hello' }],
        },
      }),
    );
    this.dc.send(JSON.stringify({ type: 'response.create' }));
  }

  private handleServerEvent(raw: string) {
    try {
      const event = JSON.parse(raw) as { type?: unknown; error?: { message?: unknown } };
      if (event.type === 'error') {
        const message = typeof event.error?.message === 'string' ? event.error.message : 'session error';
        console.error('Realtime error:', message);
      }
    } catch {
      // Ignore malformed data-channel payloads.
    }
  }

  private startVolumeAnalysis(remoteStream: MediaStream) {
    const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.outputAudioContext = new AudioContextCtor();
    if (this.outputAudioContext.state === 'suspended') {
      void this.outputAudioContext.resume();
    }

    this.outputAnalyser = this.outputAudioContext.createAnalyser();
    this.outputAnalyser.fftSize = 32;
    this.outputAnalyser.smoothingTimeConstant = 0.1;

    this.sourceNode = this.outputAudioContext.createMediaStreamSource(remoteStream);
    this.sourceNode.connect(this.outputAnalyser);

    const analyze = () => {
      let outputVol = 0;
      if (this.outputAnalyser) {
        const data = new Uint8Array(this.outputAnalyser.frequencyBinCount);
        this.outputAnalyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          sum += data[i] ?? 0;
        }
        outputVol = sum / data.length / 255;
      }
      this.onVolumeChange(outputVol * 1.5);
      this.animationFrameId = requestAnimationFrame(analyze);
    };

    analyze();
  }

  async disconnect() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }

    if (this.pc) {
      this.pc.getSenders().forEach((sender) => {
        sender.track?.stop();
      });
      this.pc.close();
      this.pc = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.srcObject = null;
      this.audioEl = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    this.outputAnalyser = null;

    if (this.outputAudioContext) {
      await this.outputAudioContext.close();
      this.outputAudioContext = null;
    }

    this.greetingSent = false;
    this.onVolumeChange(0);
  }
}
