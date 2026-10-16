/**
 * @fileoverview Procedural FluidCleb Interactive Splash (0.0s to 2.8s) & Lore Intro
 * 100% compliant with Brand Guidelines and CrazyGames "Land in Gameplay" (1-click skip).
 */

import { sound } from './audio.js';
import { i18n } from './i18n.js';

export class CinematicIntro {
  constructor(container, onComplete) {
    this.container = container;
    this.onComplete = onComplete;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;
    this.startTime = null;
    this.finished = false;
    this.soundTriggered = false;

    this.phase = 'splash'; // 'splash' -> 'lore'
    this.loreStartTime = null;

    // Cosmic background particles
    this.particles = [];
    for (let i = 0; i < 65; i++) {
      this.particles.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 2.5 + 0.8,
        color: ['#00f5ff', '#38bdf8', '#0284c7', '#94a3b8'][Math.floor(Math.random() * 4)],
        alpha: Math.random() * 0.7 + 0.3,
        speedY: (Math.random() - 0.5) * 0.035
      });
    }

    this.initDOM();
  }

  initDOM() {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'intro-cinematic-wrapper';
    this.wrapper.innerHTML = `
      <canvas class="intro-canvas" id="intro-canvas"></canvas>
      <div class="intro-lore-overlay hidden" id="intro-lore-box">
        <div class="lore-glass-card">
          <div class="lore-tag">⚡ ${i18n.t('game_title')}</div>
          <h2 class="lore-act-title" id="lore-title">${i18n.t('lore_act1_title')}</h2>
          <p class="lore-act-desc" id="lore-desc">${i18n.t('lore_act1_desc')}</p>
          <div class="lore-controls">
            <button class="lore-btn-primary" id="btn-start-game">
              ${i18n.t('play_now')}
            </button>
            <button class="lore-btn-skip" id="btn-skip-lore">
              ${i18n.t('skip_story')}
            </button>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(this.wrapper);
    this.canvas = this.wrapper.querySelector('#intro-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.loreBox = this.wrapper.querySelector('#intro-lore-box');

    this.wrapper.querySelector('#btn-start-game').onclick = () => this.finish();
    this.wrapper.querySelector('#btn-skip-lore').onclick = () => this.finish();

    // 1-Click Land in Gameplay: Clicking anywhere advances instantly
    this.wrapper.addEventListener('pointerdown', (e) => {
      if (e.target.closest('#btn-start-game') || e.target.closest('#btn-skip-lore')) return;
      if (this.phase === 'splash') {
        this.phase = 'lore';
        if (this.loreBox) this.loreBox.classList.remove('hidden');
      } else {
        this.finish();
      }
    });

    // Keyboard instant skip (Space, Enter, Escape)
    this.keyHandler = (e) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
        this.finish();
      }
    };
    window.addEventListener('keydown', this.keyHandler);

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas || !this.wrapper) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.wrapper.getBoundingClientRect();
    const w = Math.max(300, Math.floor(rect.width || window.innerWidth));
    const h = Math.max(300, Math.floor(rect.height || window.innerHeight));
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  start() {
    this.startTime = performance.now();
    this.animId = requestAnimationFrame((ts) => this.loop(ts));
  }

  finish() {
    if (this.finished) return;
    this.finished = true;
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
    sound.playButtonClick();

    this.wrapper.classList.add('intro-fade-out');
    setTimeout(() => {
      this.wrapper.remove();
      if (this.onComplete) this.onComplete();
    }, 380);
  }

  loop(timestamp) {
    if (this.finished) return;
    const elapsedSec = (timestamp - this.startTime) / 1000;

    // Trigger audio once user interacts or starts
    if (!this.soundTriggered && elapsedSec >= 0.05) {
      this.soundTriggered = true;
      sound.playFluidClebIntro();
    }

    const w = this.canvas.width / (Math.min(window.devicePixelRatio || 1, 2));
    const h = this.canvas.height / (Math.min(window.devicePixelRatio || 1, 2));
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);

    // Deep Dark Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#020617');
    bgGrad.addColorStop(0.5, '#050c26');
    bgGrad.addColorStop(1, '#08051a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Parallax Cosmic Dust
    for (const p of this.particles) {
      p.y += p.speedY * 0.016;
      if (p.y < 0) p.y = 1;
      if (p.y > 1) p.y = 0;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha * (0.6 + 0.4 * Math.sin(elapsedSec * 3 + p.x * 10));
      ctx.fillRect(p.x * w, p.y * h, p.r, p.r);
    }
    ctx.globalAlpha = 1.0;

    // ── PHASE 1: FLUIDCLEB INTERACTIVE PROCEDURAL SPLASH (0.0s to 2.8s) ──
    if (elapsedSec < 2.8) {
      const cx = w * 0.5;
      const cy = h * 0.44;

      // 1. Two Ascending Orbs converging to center (0.0s to 1.2s)
      if (elapsedSec < 1.3) {
        const prog = Math.min(1.0, elapsedSec / 1.1);
        const ease = 1 - Math.pow(1 - prog, 3);
        const dist = (1 - ease) * 160;

        // Orb 1 (#00f5ff)
        ctx.fillStyle = '#00f5ff';
        ctx.shadowColor = '#00f5ff';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(cx - dist, cy, 14 * ease, 0, Math.PI * 2);
        ctx.fill();

        // Orb 2 (#38bdf8)
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.beginPath();
        ctx.arc(cx + dist, cy, 14 * ease, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 2. Fusion & Metallic Droplet Formation (1.2s to 2.8s)
      if (elapsedSec >= 1.1) {
        const dropProg = Math.min(1.0, (elapsedSec - 1.1) / 0.7);
        const dropEase = 1 - Math.pow(1 - dropProg, 3);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(dropEase, dropEase);

        // Core Fusion Flare
        const flareGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 50);
        flareGrad.addColorStop(0, 'rgba(0, 245, 255, 0.9)');
        flareGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.4)');
        flareGrad.addColorStop(1, 'rgba(0, 245, 255, 0)');
        ctx.fillStyle = flareGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 50, 0, Math.PI * 2);
        ctx.fill();

        // Metallic Droplet (#94a3b8)
        ctx.fillStyle = '#94a3b8';
        ctx.shadowColor = '#00f5ff';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(0, 2, 16, 0, Math.PI);
        ctx.quadraticCurveTo(0, -22, 0, -26);
        ctx.quadraticCurveTo(0, -22, -16, 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
      }

      // 3. FluidCleb Interactive Text Appearance (1.4s to 2.8s)
      if (elapsedSec >= 1.4) {
        const textProg = Math.min(1.0, (elapsedSec - 1.4) / 0.6);
        ctx.save();
        ctx.globalAlpha = textProg;
        ctx.textAlign = 'center';

        // Title: FLUIDCLEB
        ctx.font = '800 36px "Montserrat", sans-serif';
        ctx.fillStyle = '#00f5ff';
        ctx.shadowColor = '#00f5ff';
        ctx.shadowBlur = 16;
        ctx.fillText('FLUIDCLEB', cx, cy + 62);

        // Subtitle: INTERACTIVE
        ctx.font = '700 13px "Montserrat", sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.shadowBlur = 0;
        ctx.letterSpacing = '5px';
        ctx.fillText('INTERACTIVE', cx + 2, cy + 84);

        ctx.restore();
      }

      // 4. Subtle Progress Bar at bottom of splash
      const barProg = Math.min(1.0, elapsedSec / 2.7);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(cx - 80, cy + 115, 160, 4);
      ctx.fillStyle = '#00f5ff';
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 6;
      ctx.fillRect(cx - 80, cy + 115, 160 * barProg, 4);
      ctx.shadowBlur = 0;
    } else {
      // ── PHASE 2: LORE OVERLAY & LAND IN GAMEPLAY (>= 2.8s) ──
      if (this.loreBox && this.loreBox.classList.contains('hidden')) {
        this.loreBox.classList.remove('hidden');
        this.loreStartTime = timestamp;
      }
      // Auto-advance to gameplay after 4.5s of lore if user is passive
      if (this.loreStartTime && (timestamp - this.loreStartTime) > 4500) {
        this.finish();
        return;
      }
    }

    this.animId = requestAnimationFrame((ts) => this.loop(ts));
  }
}

export default CinematicIntro;
