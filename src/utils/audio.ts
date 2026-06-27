/**
 * Web Audio API Ambient Synthesizer
 * Generates soothing background soundscapes (Forest, Rain, Library) dynamically.
 */

class AmbientSynthesizer {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;
  private currentTheme: 'forest' | 'rain' | 'library' = 'forest';
  private timerId: any = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Create pink buffer for natural organic hums / wind / rain
  private createNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11; // scale down
      b6 = white * 0.115926;
    }
    return buffer;
  }

  public start(theme: 'forest' | 'rain' | 'library') {
    this.stop();
    this.initCtx();
    if (!this.ctx) return;

    this.currentTheme = theme;
    this.isPlaying = true;

    const buffer = this.createNoiseBuffer();
    if (!buffer) return;

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    this.filterNode = this.ctx.createBiquadFilter();
    this.gainNode = this.ctx.createGain();

    if (theme === 'rain') {
      // Lowpass + Bandpass for steady rain pitter-patter
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(800, this.ctx.currentTime);
      this.gainNode.gain.setValueAtTime(0.25, this.ctx.currentTime);
    } else if (theme === 'forest') {
      // Gentle wind breeze
      this.filterNode.type = 'bandpass';
      this.filterNode.frequency.setValueAtTime(400, this.ctx.currentTime);
      this.filterNode.Q.setValueAtTime(0.8, this.ctx.currentTime);
      this.gainNode.gain.setValueAtTime(0.18, this.ctx.currentTime);

      // Random synthetic bird chirps
      this.timerId = setInterval(() => {
        if (this.isPlaying && this.ctx && Math.random() > 0.6) {
          this.chirp();
        }
      }, 3500);
    } else if (theme === 'library') {
      // Warm low quiet room rumble
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(250, this.ctx.currentTime);
      this.gainNode.gain.setValueAtTime(0.15, this.ctx.currentTime);
    }

    src.connect(this.filterNode);
    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    src.start();
    this.noiseNode = src;
  }

  private chirp() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    const now = this.ctx.currentTime;
    const freq = 1800 + Math.random() * 1200;
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq + 600, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(freq - 300, now + 0.25);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.noiseNode) {
      try {
        (this.noiseNode as AudioBufferSourceNode).stop();
        this.noiseNode.disconnect();
      } catch (e) {}
      this.noiseNode = null;
    }
  }

  public getIsPlaying() {
    return this.isPlaying;
  }
}

export const ambientAudio = new AmbientSynthesizer();
