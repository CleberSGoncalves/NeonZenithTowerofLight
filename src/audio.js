/**
 * @fileoverview Procedural Web Audio API Sound Synthesizer
 * High-tech Sci-Fi SFX, FluidCleb intro audio & ambient Cyberpunk synth soundtrack.
 * Zero external audio files (0MB bundle size, instantaneous load).
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.isMuted = false;
    this.isAdMuted = false;

    this.musicPlaying = false;
    this.musicTimer = null;
    this.bassIndex = 0;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();

        this.musicGain.gain.value = 0.22;
        this.sfxGain.gain.value = 0.55;
        this.masterGain.gain.value = this.isMuted ? 0 : 1;

        this.musicGain.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setAdMuted(muted) {
    this.isAdMuted = !!muted;
    if (this.masterGain && this.ctx) {
      const target = (this.isMuted || this.isAdMuted) ? 0 : 1;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.04);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const target = (this.isMuted || this.isAdMuted) ? 0 : 1;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  // ── FLUIDCLEB INTERACTIVE INTRO AUDIO (0.0s - 2.8s) ──
  playFluidClebIntro() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.isAdMuted) return;
    const t = this.ctx.currentTime;

    // 1. Dual rising harmonic orbs (0.0s to 1.2s)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const g1 = this.ctx.createGain();
    const g2 = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(220, t);
    osc1.frequency.exponentialRampToValueAtTime(659.25, t + 1.2); // A3 -> E5

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(329.63, t);
    osc2.frequency.exponentialRampToValueAtTime(880, t + 1.2); // E4 -> A5

    g1.gain.setValueAtTime(0.01, t);
    g1.gain.linearRampToValueAtTime(0.25, t + 0.6);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 1.3);

    g2.gain.setValueAtTime(0.01, t);
    g2.gain.linearRampToValueAtTime(0.2, t + 0.6);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 1.3);

    osc1.connect(g1); g1.connect(this.sfxGain);
    osc2.connect(g2); g2.connect(this.sfxGain);
    osc1.start(t); osc1.stop(t + 1.35);
    osc2.start(t); osc2.stop(t + 1.35);

    // 2. Fusion & Metallic Drop resonance (at 1.2s to 2.4s)
    setTimeout(() => {
      if (!this.ctx || this.isMuted || this.isAdMuted) return;
      const t2 = this.ctx.currentTime;

      // Deep metallic drop thud
      const dropOsc = this.ctx.createOscillator();
      const dropGain = this.ctx.createGain();
      dropOsc.type = 'triangle';
      dropOsc.frequency.setValueAtTime(140, t2);
      dropOsc.frequency.exponentialRampToValueAtTime(55, t2 + 0.5);
      dropGain.gain.setValueAtTime(0.4, t2);
      dropGain.gain.exponentialRampToValueAtTime(0.001, t2 + 0.6);
      dropOsc.connect(dropGain); dropGain.connect(this.sfxGain);
      dropOsc.start(t2); dropOsc.stop(t2 + 0.65);

      // Shimmering crystal chime
      [880, 1108.73, 1318.51, 1760].forEach((freq, idx) => {
        const chime = this.ctx.createOscillator();
        const cg = this.ctx.createGain();
        chime.type = 'sine';
        chime.frequency.setValueAtTime(freq, t2 + idx * 0.08);
        cg.gain.setValueAtTime(0.18, t2 + idx * 0.08);
        cg.gain.exponentialRampToValueAtTime(0.001, t2 + idx * 0.08 + 0.9);
        chime.connect(cg); cg.connect(this.sfxGain);
        chime.start(t2 + idx * 0.08);
        chime.stop(t2 + idx * 0.08 + 0.95);
      });
    }, 1200);
  }

  // ── GAMEPLAY SFX ──
  playJump() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.isAdMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const pitch = 0.96 + Math.random() * 0.08;
    osc.frequency.setValueAtTime(220 * pitch, t);
    osc.frequency.exponentialRampToValueAtTime(460 * pitch, t + 0.12);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

    osc.connect(gain); gain.connect(this.sfxGain);
    osc.start(t); osc.stop(t + 0.14);
  }

  playDash() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.isAdMuted) return;
    const t = this.ctx.currentTime;

    // High speed whoosh + electric burst
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(580, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.18);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain); gain.connect(this.sfxGain);
    osc.start(t); osc.stop(t + 0.22);
  }

  playLand() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.isAdMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain); gain.connect(this.sfxGain);
    osc.start(t); osc.stop(t + 0.1);
  }

  playCollectOrb() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.isAdMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const notes = [587.33, 659.25, 783.99, 880, 1046.5];
    const freq = notes[Math.floor(Math.random() * notes.length)];

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.15);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain); gain.connect(this.sfxGain);
    osc.start(t); osc.stop(t + 0.2);
  }

  playBouncePad() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.isAdMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(640, t + 0.22);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

    osc.connect(gain); gain.connect(this.sfxGain);
    osc.start(t); osc.stop(t + 0.26);
  }

  playLaserHit() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.isAdMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.25);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.27);

    osc.connect(gain); gain.connect(this.sfxGain);
    osc.start(t); osc.stop(t + 0.28);
  }

  playShieldBreak() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.isAdMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.3);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

    osc.connect(gain); gain.connect(this.sfxGain);
    osc.start(t); osc.stop(t + 0.35);
  }

  playStarMilestone() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.isAdMuted) return;
    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);
      gain.gain.setValueAtTime(0.25, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.5);
      osc.connect(gain); gain.connect(this.sfxGain);
      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.55);
    });
  }

  playVictory() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.isAdMuted) return;
    const t = this.ctx.currentTime;
    const notes = [392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.09);
      gain.gain.setValueAtTime(0.28, t + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.09 + 0.7);
      osc.connect(gain); gain.connect(this.sfxGain);
      osc.start(t + idx * 0.09);
      osc.stop(t + idx * 0.09 + 0.75);
    });
  }

  playDefeat() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.isAdMuted) return;
    const t = this.ctx.currentTime;
    const notes = [293.66, 277.18, 261.63, 220.00];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + idx * 0.12);
      gain.gain.setValueAtTime(0.22, t + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.12 + 0.4);
      osc.connect(gain); gain.connect(this.sfxGain);
      osc.start(t + idx * 0.12);
      osc.stop(t + idx * 0.12 + 0.45);
    });
  }

  playButtonClick() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.isAdMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc.connect(gain); gain.connect(this.sfxGain);
    osc.start(t); osc.stop(t + 0.05);
  }

  playSpinTick() {
    this.ensureContext();
    if (!this.ctx || this.isMuted || this.isAdMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, t);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    osc.connect(gain); gain.connect(this.sfxGain);
    osc.start(t); osc.stop(t + 0.04);
  }

  // ── PROCEDURAL CYBERPUNK SYNTH BACKGROUND MUSIC ──
  startMusic() {
    if (this.musicPlaying) return;
    this.musicPlaying = true;
    this.ensureContext();

    const bassLine = [55, 55, 65.41, 73.42, 55, 55, 82.41, 73.42]; // A1, C2, D2, E2
    const arpeggio = [220, 261.63, 329.63, 440, 329.63, 261.63];

    const step = () => {
      if (!this.musicPlaying) return;
      if (this.ctx && !this.isMuted && !this.isAdMuted) {
        const t = this.ctx.currentTime;

        // Bass synth note
        const bassFreq = bassLine[this.bassIndex % bassLine.length];
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(bassFreq, t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(280, t);
        filter.frequency.exponentialRampToValueAtTime(120, t + 0.28);

        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start(t);
        osc.stop(t + 0.32);

        // Occasional melody shimmer
        if (this.bassIndex % 2 === 0) {
          const leadFreq = arpeggio[(this.bassIndex / 2) % arpeggio.length];
          const leadOsc = this.ctx.createOscillator();
          const leadGain = this.ctx.createGain();
          leadOsc.type = 'sine';
          leadOsc.frequency.setValueAtTime(leadFreq, t);
          leadGain.gain.setValueAtTime(0.08, t);
          leadGain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
          leadOsc.connect(leadGain);
          leadGain.connect(this.musicGain);
          leadOsc.start(t);
          leadOsc.stop(t + 0.26);
        }

        this.bassIndex++;
      }
      this.musicTimer = setTimeout(step, 320); // ~94 BPM 8th notes
    };

    step();
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const sound = new SoundEngine();
export default sound;
