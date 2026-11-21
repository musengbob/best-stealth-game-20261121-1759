// Night Shift: The Quiet Courier — WebAudio sounds, generated in code.
// No audio files: every sound is a short oscillator envelope. The audio
// context is created lazily on the first user gesture (browsers require it),
// and M toggles mute at any time.

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }

  // One short tone: frequency slide from `from` to `to` over `seconds`.
  blip(from, to, seconds, type, volume) {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + seconds);
    gain.gain.setValueAtTime(volume || 0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + seconds);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + seconds + 0.02);
  }

  step() {
    this.blip(140, 90, 0.06, 'triangle', 0.05);
  }

  pickup() {
    this.blip(660, 660, 0.09, 'sine', 0.14);
    setTimeout(() => this.blip(990, 990, 0.12, 'sine', 0.14), 80);
  }

  alert() {
    this.blip(220, 440, 0.28, 'sawtooth', 0.16);
    setTimeout(() => this.blip(330, 660, 0.28, 'sawtooth', 0.14), 140);
  }

  dash() {
    this.blip(300, 90, 0.14, 'triangle', 0.09);
  }

  win() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => setTimeout(() => this.blip(n, n, 0.22, 'sine', 0.15), i * 110));
  }

  lose() {
    this.blip(392, 130, 0.5, 'sawtooth', 0.12);
  }
}
