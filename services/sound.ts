
export class SoundService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private getCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3; // Global volume
      this.masterGain.connect(this.ctx.destination);
    }
    // Browsers often suspend AudioContext until first user interaction
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playClick() {
    const ctx = this.getCtx();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // High tech blip
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.05);
    
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(t + 0.05);
  }

  playMessageSent() {
    const ctx = this.getCtx();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Subtle swoosh
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.linearRampToValueAtTime(900, t + 0.1);
    
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(t + 0.1);
  }

  playMessageReceived() {
    const ctx = this.getCtx();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    
    // Glassy ping using two oscillators
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(800, t);
    gain1.gain.setValueAtTime(0, t);
    gain1.gain.linearRampToValueAtTime(0.1, t + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1200, t);
    gain2.gain.setValueAtTime(0, t);
    gain2.gain.linearRampToValueAtTime(0.05, t + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(this.masterGain);
    gain2.connect(this.masterGain);
    
    osc1.start();
    osc2.start();
    osc1.stop(t + 0.5);
    osc2.stop(t + 0.5);
  }

  playConnect() {
    const ctx = this.getCtx();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Power up
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.linearRampToValueAtTime(440, t + 0.3);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.1);
    gain.gain.linearRampToValueAtTime(0, t + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(t + 0.3);
  }

  playDisconnect() {
    const ctx = this.getCtx();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Power down
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.linearRampToValueAtTime(220, t + 0.3);
    
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(t + 0.3);
  }
}

export const soundEffects = new SoundService();
