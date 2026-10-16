/**
 * @fileoverview High-Performance 3D Oblique Canvas Renderer for Neon Zenith: Tower of Light
 * Real 3D depth extrusion, cybernetic lighting, volumetric light beams,
 * ResizeObserver, Trauma² Screen Shake, Hit-Stop, Squash & Stretch, and procedural particle VFX.
 */

// Safe helper for rounded rectangles across all browsers
function drawRoundedRect(ctx, x, y, width, height, radius) {
  const safeW = Number.isFinite(width) ? width : 10;
  const safeH = Number.isFinite(height) ? height : 10;
  const r = Math.max(0, Math.min(Number.isFinite(radius) ? radius : 0, safeW / 2, safeH / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + safeW - r, y);
  ctx.quadraticCurveTo(x + safeW, y, x + safeW, y + r);
  ctx.lineTo(x + safeW, y + safeH - r);
  ctx.quadraticCurveTo(x + safeW, y + safeH, x + safeW - r, y + safeH);
  ctx.lineTo(x + r, y + safeH);
  ctx.quadraticCurveTo(x, y + safeH, x, y + safeH - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export class JuiceCamera3D {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.trauma = 0;
    this.decay = 1.6; // Decay per second
    this.maxOffset = 18;
    this.maxAngle = 0.05;
    this.offsetX = 0;
    this.offsetY = 0;
    this.angle = 0;
  }

  addTrauma(amount) {
    if (typeof amount === 'number' && Number.isFinite(amount)) {
      this.trauma = Math.min(1.0, this.trauma + amount);
    }
  }

  update(dt, targetX, targetY) {
    const safeTargetX = Number.isFinite(targetX) ? targetX : 0;
    const safeTargetY = Number.isFinite(targetY) ? targetY : 0;

    // Framerate-independent camera exponential smoothing
    const smoothFactor = 1 - Math.exp(-6.5 * dt);
    this.x += (safeTargetX - this.x) * smoothFactor;
    this.y += (safeTargetY - this.y) * smoothFactor;

    // Screen Shake Trauma²
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - this.decay * dt);
      const shake = this.trauma * this.trauma;
      this.offsetX = (Math.random() * 2 - 1) * this.maxOffset * shake;
      this.offsetY = (Math.random() * 2 - 1) * this.maxOffset * shake;
      this.angle = (Math.random() * 2 - 1) * this.maxAngle * shake;
    } else {
      this.offsetX = 0;
      this.offsetY = 0;
      this.angle = 0;
    }
  }
}

export class Engine3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.camera = new JuiceCamera3D();
    this.time = 0;

    // Cached logical dimensions from ResizeObserver
    this.viewWidth = 800;
    this.viewHeight = 600;

    // Depth projection constants
    this.depthScaleX = 0.35;
    this.depthScaleY = -0.25;

    // Parallax background skyscrapers & digital data columns
    this.citySpires = [];
    for (let i = 0; i < 28; i++) {
      this.citySpires.push({
        x: (i / 28) * 1600 - 800,
        width: 40 + Math.random() * 70,
        height: 600 + Math.random() * 1200,
        layer: 0.2 + Math.random() * 0.5,
        color: ['#03071e', '#050a24', '#081035', '#020b20'][Math.floor(Math.random() * 4)],
        accentColor: ['#00f5ff', '#38bdf8', '#a855f7', '#ec4899'][Math.floor(Math.random() * 4)],
        pulsePhase: Math.random() * Math.PI * 2
      });
    }

    // Floating digital dust particles
    this.ambientDust = [];
    for (let i = 0; i < 45; i++) {
      this.ambientDust.push({
        x: (Math.random() - 0.5) * 1200,
        y: (Math.random() - 0.5) * 1800,
        z: (Math.random() - 0.5) * 300,
        size: Math.random() * 2.2 + 0.8,
        speedY: (Math.random() * -30 - 10),
        alpha: Math.random() * 0.6 + 0.2,
        color: ['#00f5ff', '#38bdf8', '#facc15', '#a855f7'][Math.floor(Math.random() * 4)]
      });
    }

    this.setupResizeObserver();
  }

  setupResizeObserver() {
    const parent = this.canvas.parentElement;
    if (typeof ResizeObserver !== 'undefined' && parent) {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const rect = entry.contentRect;
          this.applyResize(rect.width, rect.height);
        }
      });
      this.resizeObserver.observe(parent);
    } else {
      window.addEventListener('resize', () => {
        const rect = parent ? parent.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
        this.applyResize(rect.width, rect.height);
      });
    }
    // Initial resize
    const rect = parent ? parent.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
    this.applyResize(rect.width, rect.height);
  }

  applyResize(w, h) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.viewWidth = Math.max(300, Math.floor(w || window.innerWidth));
    this.viewHeight = Math.max(300, Math.floor(h || window.innerHeight));

    if (this.canvas.width !== this.viewWidth * dpr || this.canvas.height !== this.viewHeight * dpr) {
      this.canvas.width = this.viewWidth * dpr;
      this.canvas.height = this.viewHeight * dpr;
    }
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // 3D Oblique coordinate to 2D Screen projection
  toScreen(x, y, z, cx, cy, viewW, viewH) {
    const safeX = Number.isFinite(x) ? x : 0;
    const safeY = Number.isFinite(y) ? y : 0;
    const safeZ = Number.isFinite(z) ? z : 0;
    const safeCx = Number.isFinite(cx) ? cx : 0;
    const safeCy = Number.isFinite(cy) ? cy : 0;

    const sx = (safeX - safeCx) + safeZ * this.depthScaleX + viewW * 0.5 + this.camera.offsetX;
    const sy = (safeY - safeCy) + safeZ * this.depthScaleY + viewH * 0.62 + this.camera.offsetY;
    return { x: sx, y: sy };
  }

  render(sector, player, particles, dt, boss = null, bossBullets = [], healOrbs = []) {
    this.time += dt;
    const width = this.viewWidth;
    const height = this.viewHeight;
    const ctx = this.ctx;

    // Update camera target smoothly focused on player
    const targetCamX = (player && Number.isFinite(player.x)) ? player.x : 0;
    const targetCamY = (player && Number.isFinite(player.y)) ? player.y : 0;
    this.camera.update(dt, targetCamX, targetCamY);

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Apply Screen Shake rotation around center
    if (this.camera.angle !== 0) {
      ctx.translate(width * 0.5, height * 0.5);
      ctx.rotate(this.camera.angle);
      ctx.translate(-width * 0.5, -height * 0.5);
    }

    // 1. Cyber Sci-Fi Megacity Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#020617');
    bgGrad.addColorStop(0.5, '#050c26');
    bgGrad.addColorStop(1, '#08051a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Parallax Distant Skyscrapers & Data Towers
    for (const spire of this.citySpires) {
      const spCamX = this.camera.x * spire.layer;
      const spCamY = this.camera.y * spire.layer;
      const sx = spire.x - spCamX + width * 0.5;
      const sy = height - (spire.height - spCamY * 0.2);

      // Spire body
      ctx.fillStyle = spire.color;
      ctx.fillRect(sx, sy, spire.width, spire.height);

      // Vertical neon strip
      const pulse = 0.5 + 0.5 * Math.sin(this.time * 2 + spire.pulsePhase);
      ctx.fillStyle = spire.accentColor;
      ctx.globalAlpha = 0.3 * pulse;
      ctx.fillRect(sx + spire.width * 0.5 - 1.5, sy, 3, spire.height);
      ctx.globalAlpha = 1.0;
    }

    // 3. Volumetric Data Dust Particles
    for (const dust of this.ambientDust) {
      dust.y += dust.speedY * dt;
      if (dust.y < -1200) dust.y = 800;
      const p = this.toScreen(dust.x, dust.y, dust.z, this.camera.x, this.camera.y, width, height);
      if (p.x >= -20 && p.x <= width + 20 && p.y >= -20 && p.y <= height + 20) {
        ctx.fillStyle = dust.color;
        ctx.globalAlpha = dust.alpha * (0.6 + 0.4 * Math.sin(this.time * 3 + dust.x));
        ctx.fillRect(p.x, p.y, dust.size, dust.size);
      }
    }
    ctx.globalAlpha = 1.0;

    // 4. Central Volumetric Light Beam (Tower of Light core summit)
    if (sector && sector.summitCore) {
      const coreP = this.toScreen(sector.summitCore.x, sector.summitCore.y, sector.summitCore.z, this.camera.x, this.camera.y, width, height);
      if (Number.isFinite(coreP.x)) {
        const beamGrad = ctx.createLinearGradient(coreP.x - 30, 0, coreP.x + 30, 0);
        beamGrad.addColorStop(0, 'rgba(0, 245, 255, 0)');
        beamGrad.addColorStop(0.5, 'rgba(0, 245, 255, 0.25)');
        beamGrad.addColorStop(1, 'rgba(0, 245, 255, 0)');
        ctx.fillStyle = beamGrad;
        ctx.fillRect(coreP.x - 35, 0, 70, height);
      }
    }

    // 5. Render Platforms (sorted back to front for proper 3D depth)
    if (sector && sector.platforms) {
      const renderables = [...sector.platforms];
      renderables.sort((a, b) => (b.z - a.z) || (b.y - a.y));

      for (const plat of renderables) {
        this.renderPlatform(ctx, plat, width, height);
      }
    }

    // 6. Render Data Orbs
    if (sector && sector.orbs) {
      for (const orb of sector.orbs) {
        if (!orb.collected) {
          this.renderOrb(ctx, orb, width, height);
        }
      }
    }

    // 7. Render Jump Pads & Lasers
    if (sector && sector.jumpPads) {
      for (const pad of sector.jumpPads) {
        this.renderJumpPad(ctx, pad, width, height);
      }
    }

    if (sector && sector.lasers) {
      for (const laser of sector.lasers) {
        this.renderLaser(ctx, laser, width, height);
      }
    }

    // 7b. Render Emergency Heal Orbs (Adaptive Difficulty)
    if (healOrbs && healOrbs.length > 0) {
      for (const orb of healOrbs) {
        if (!orb.collected) this.renderHealOrb(ctx, orb, width, height);
      }
    }

    // 7c. Render Boss & Spiral Bullets (Boss Rush Mode)
    if (boss && boss.hp > 0) {
      this.renderBoss(ctx, boss, width, height);
    }
    if (bossBullets && bossBullets.length > 0) {
      this.renderBossBullets(ctx, bossBullets, width, height);
    }

    // 8. Render Summit Quantum Core
    if (sector && sector.summitCore) {
      this.renderSummitCore(ctx, sector.summitCore, width, height);
    }

    // 9. Render Player Runner with Squash & Stretch
    if (player && player.alive) {
      this.renderPlayer(ctx, player, width, height);
    }

    // 10. Render Procedural Particles (Dash trails, sparks, confetti)
    if (particles && particles.length > 0) {
      this.renderParticles(ctx, particles, width, height);
    }

    ctx.restore();
  }

  // ── EMERGENCY HEAL ORB RENDERING ──
  renderHealOrb(ctx, orb, viewW, viewH) {
    const bob = Math.sin(this.time * 5 + (orb.x || 0)) * 5;
    const p = this.toScreen(orb.x, orb.y - bob, orb.z || 0, this.camera.x, this.camera.y, viewW, viewH);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-2, -7, 4, 14);
    ctx.fillRect(-7, -2, 14, 4);
    ctx.restore();
  }

  // ── BOSS RENDERING (BOSS RUSH MODE) ──
  renderBoss(ctx, boss, viewW, viewH) {
    const p = this.toScreen(boss.x, boss.y, boss.z || 0, this.camera.x, this.camera.y, viewW, viewH);
    ctx.save();
    ctx.translate(p.x, p.y);
    
    // Outer floating aura
    ctx.fillStyle = 'rgba(236, 72, 153, 0.25)';
    ctx.beginPath();
    ctx.arc(0, 0, 50 + Math.sin(this.time * 6) * 4, 0, Math.PI * 2);
    ctx.fill();

    // Cyber Boss Body
    ctx.fillStyle = '#1e112a';
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 3;
    drawRoundedRect(ctx, -38, -38, 76, 76, 16);
    ctx.fill();
    ctx.stroke();

    // Glowing central core
    ctx.fillStyle = '#00f5ff';
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();

    // Boss Health Bar
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(-45, -55, 90, 8);
    const hpPct = Math.max(0, boss.hp / boss.maxHp);
    ctx.fillStyle = '#ec4899';
    ctx.fillRect(-44, -54, 88 * hpPct, 6);
    ctx.restore();
  }

  // ── BOSS SPIRAL BULLETS ──
  renderBossBullets(ctx, bullets, viewW, viewH) {
    for (const b of bullets) {
      const p = this.toScreen(b.x, b.y, b.z || 0, this.camera.x, this.camera.y, viewW, viewH);
      ctx.save();
      ctx.fillStyle = '#ec4899';
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, b.radius || 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ── PLATFORM 3D RENDERING WITH STRICT ANTI-NAN GUARDS ──
  renderPlatform(ctx, plat, viewW, viewH) {
    const extDepth = plat.depth || 40;
    const extH = plat.h || 18;
    const w = plat.w || 90;

    if (plat.type === 'decay' && plat.decayTimer > 0) {
      const alpha = 0.3 + 0.7 * Math.sin(plat.decayTimer * 20);
      ctx.globalAlpha = Math.max(0.1, alpha);
    } else {
      ctx.globalAlpha = 1.0;
    }

    const pFront = this.toScreen(plat.x, plat.y, plat.z, this.camera.x, this.camera.y, viewW, viewH);
    const pBack = this.toScreen(plat.x, plat.y, plat.z + extDepth, this.camera.x, this.camera.y, viewW, viewH);

    if (!Number.isFinite(pFront.x) || !Number.isFinite(pFront.y) || !Number.isFinite(pBack.x) || !Number.isFinite(pBack.y)) {
      return; // Prevent canvas gradient crash
    }

    // Front Face
    ctx.fillStyle = plat.type === 'bounce' ? '#3d2504' : (plat.type === 'decay' ? '#3b0d24' : '#0b162c');
    ctx.strokeStyle = plat.type === 'bounce' ? '#f59e0b' : (plat.type === 'decay' ? '#f43f5e' : '#00f5ff');
    ctx.lineWidth = 1.5;

    ctx.fillRect(pFront.x - w * 0.5, pFront.y, w, extH);
    ctx.strokeRect(pFront.x - w * 0.5, pFront.y, w, extH);

    // Side Depth Face (Right side 3D extrusion)
    ctx.beginPath();
    ctx.moveTo(pFront.x + w * 0.5, pFront.y);
    ctx.lineTo(pBack.x + w * 0.5, pBack.y);
    ctx.lineTo(pBack.x + w * 0.5, pBack.y + extH);
    ctx.lineTo(pFront.x + w * 0.5, pFront.y + extH);
    ctx.closePath();
    ctx.fillStyle = plat.type === 'bounce' ? '#261602' : '#060d1a';
    ctx.fill();
    ctx.stroke();

    // Top Face (Walkable surface with glowing grid)
    ctx.beginPath();
    ctx.moveTo(pFront.x - w * 0.5, pFront.y);
    ctx.lineTo(pBack.x - w * 0.5, pBack.y);
    ctx.lineTo(pBack.x + w * 0.5, pBack.y);
    ctx.lineTo(pFront.x + w * 0.5, pFront.y);
    ctx.closePath();

    const topGrad = ctx.createLinearGradient(pFront.x, pFront.y, pBack.x, pBack.y);
    if (plat.type === 'bounce') {
      topGrad.addColorStop(0, '#f59e0b');
      topGrad.addColorStop(1, '#b45309');
    } else if (plat.type === 'decay') {
      topGrad.addColorStop(0, '#f43f5e');
      topGrad.addColorStop(1, '#9f1239');
    } else {
      topGrad.addColorStop(0, '#0284c7');
      topGrad.addColorStop(1, '#0369a1');
    }
    ctx.fillStyle = topGrad;
    ctx.fill();
    ctx.stroke();

    // Grid lines highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pFront.x - w * 0.2, pFront.y);
    ctx.lineTo(pBack.x - w * 0.2, pBack.y);
    ctx.moveTo(pFront.x + w * 0.2, pFront.y);
    ctx.lineTo(pBack.x + w * 0.2, pBack.y);
    ctx.stroke();

    ctx.globalAlpha = 1.0;
  }

  // ── DATA ORB RENDERING ──
  renderOrb(ctx, orb, viewW, viewH) {
    const bob = Math.sin(this.time * 4 + orb.x * 0.1) * 6;
    const p = this.toScreen(orb.x, orb.y - bob, orb.z, this.camera.x, this.camera.y, viewW, viewH);

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(this.time * 2.5);

    ctx.fillStyle = '#00f5ff';
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(10, 0);
    ctx.lineTo(0, 11);
    ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-12, -12, 24, 24);

    ctx.restore();
  }

  // ── JUMP PAD RENDERING ──
  renderJumpPad(ctx, pad, viewW, viewH) {
    const p = this.toScreen(pad.x, pad.y, pad.z, this.camera.x, this.camera.y, viewW, viewH);
    ctx.save();
    ctx.translate(p.x, p.y);

    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 10;
    ctx.fillRect(-22, -4, 44, 8);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    const bouncePulse = Math.sin(this.time * 8) * 3;
    ctx.beginPath();
    ctx.moveTo(0, -14 + bouncePulse);
    ctx.lineTo(9, -7 + bouncePulse);
    ctx.lineTo(-9, -7 + bouncePulse);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // ── LASER BARRIER RENDERING ──
  renderLaser(ctx, laser, viewW, viewH) {
    if (!laser.active) return;
    const p1 = this.toScreen(laser.x1, laser.y1, laser.z1, this.camera.x, this.camera.y, viewW, viewH);
    const p2 = this.toScreen(laser.x2, laser.y2, laser.z2, this.camera.x, this.camera.y, viewW, viewH);

    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 14;
    ctx.lineWidth = 4 + Math.sin(this.time * 15) * 1.5;

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  // ── SUMMIT QUANTUM CORE RENDERING ──
  renderSummitCore(ctx, core, viewW, viewH) {
    const bob = Math.sin(this.time * 2.5) * 8;
    const p = this.toScreen(core.x, core.y - bob, core.z, this.camera.x, this.camera.y, viewW, viewH);

    ctx.save();
    ctx.translate(p.x, p.y);

    const radGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 65);
    radGrad.addColorStop(0, 'rgba(0, 245, 255, 0.9)');
    radGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.5)');
    radGrad.addColorStop(1, 'rgba(0, 245, 255, 0)');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 65, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#00f5ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 32, this.time * 2, this.time * 2 + Math.PI * 1.5);
    ctx.stroke();

    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 22, -this.time * 2.8, -this.time * 2.8 + Math.PI * 1.4);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ── PLAYER RUNNER RENDERING ──
  renderPlayer(ctx, player, viewW, viewH) {
    const p = this.toScreen(player.x, player.y, player.z, this.camera.x, this.camera.y, viewW, viewH);

    ctx.save();
    ctx.translate(p.x, p.y);

    const scaleX = (player.scaleX || 1.0) * (player.facingRight ? 1 : -1);
    const scaleY = (player.scaleY || 1.0);
    ctx.scale(scaleX, scaleY);

    const skinColors = {
      classic: { body: '#0284c7', visor: '#00f5ff', accent: '#38bdf8' },
      purple: { body: '#7e22ce', visor: '#ec4899', accent: '#c084fc' },
      gold: { body: '#b45309', visor: '#facc15', accent: '#fef08a' },
      emerald: { body: '#047857', visor: '#10b981', accent: '#6ee7b7' }
    };
    const pal = skinColors[player.skin] || skinColors.classic;

    if (player.hasShield) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, -22, 28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    if (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer * 12) % 2 === 0) {
      ctx.globalAlpha = 0.35;
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    const runCycle = Math.sin(this.time * 16) * 10;
    const legOffset = player.isGrounded && Math.abs(player.vx) > 10 ? runCycle : 0;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-6 - legOffset * 0.4, -14, 4, 14);
    ctx.fillRect(2 + legOffset * 0.4, -14, 4, 14);

    ctx.fillStyle = pal.body;
    ctx.shadowColor = pal.visor;
    ctx.shadowBlur = 8;
    drawRoundedRect(ctx, -10, -32, 20, 20, 5);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = pal.visor;
    drawRoundedRect(ctx, -1, -30, 10, 5, 2);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-13, -28, 5, 14);

    if (!player.isGrounded || player.isDashing) {
      ctx.fillStyle = pal.visor;
      ctx.beginPath();
      ctx.moveTo(-13, -20);
      ctx.lineTo(-20 - Math.random() * 8, -21);
      ctx.lineTo(-13, -22);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  // ── PROCEDURAL PARTICLES RENDERING ──
  renderParticles(ctx, particles, viewW, viewH) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      const screenPos = this.toScreen(p.x, p.y, p.z || 0, this.camera.x, this.camera.y, viewW, viewH);

      const lifeRatio = Math.max(0, p.life / p.maxLife);
      const alpha = lifeRatio * lifeRatio;

      ctx.save();
      ctx.fillStyle = p.color || '#00f5ff';
      ctx.globalAlpha = alpha;

      if (p.shape === 'spark') {
        ctx.fillRect(screenPos.x, screenPos.y, Math.max(0.5, p.size * 2), Math.max(0.5, p.size * 0.8));
      } else {
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, Math.max(0.1, p.size || 2), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
