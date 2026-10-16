/**
 * @fileoverview High-Performance Floating Cyber Virtual Directional Joystick
 * Inspired by the proven analog touch mechanics of 'Sobrevivente da Névoa'.
 * Features:
 * - Dynamic Floating Joystick: anchors anywhere the player touches on the left half of the screen
 * - Real-time thumb tracking with overflow displacement (base follows finger if dragged beyond radius)
 * - Buttery-smooth analog horizontal movement (-1.0 to +1.0) with micro-deadzone
 * - Upward flick/swipe assist to trigger jumping
 * - Cyberpunk neon aesthetics with laser vector beam and glowing chrome knob
 * - Zero DOM overhead: 60/120FPS canvas rendering
 * - Mouse drag emulation for desktop playtesting
 */

export class VirtualJoystick {
  constructor(options = {}) {
    this.canvas = options.canvas || document.getElementById('game-canvas');
    this.onJump = options.onJump || null;
    this.onStart = options.onStart || null;

    this.maxRadius = 52;  // Calibrated agile radius for snappy mobile thumb response
    this.deadzone = 4;    // Micro deadzone in pixels to prevent jitter
    this.knobRadius = 20; // Knob radius in pixels

    this.viewWidth = 0;
    this.viewHeight = 0;
    this.time = 0;

    // Core Touch State
    this.touch = {
      active: false,
      id: -1,
      startX: 0,
      startY: 0,
      knobX: 0,
      knobY: 0,
      dx: 0,
      dy: 0,
      magnitude: 0,
      moveX: 0,
      jumpTriggered: false
    };

    this.isMouseDown = false;
    this.cachedRect = null;

    // Detect if device supports touch
    this.hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    this.bindEvents();
  }

  updateRect() {
    if (!this.canvas) return;
    this.cachedRect = this.canvas.getBoundingClientRect();
  }

  toCanvas(t) {
    if (!this.cachedRect) this.updateRect();
    const cw = (this.cachedRect && this.cachedRect.width) ? this.cachedRect.width : 1;
    const ch = (this.cachedRect && this.cachedRect.height) ? this.cachedRect.height : 1;
    const vw = this.viewWidth > 0 ? this.viewWidth : cw;
    const vh = this.viewHeight > 0 ? this.viewHeight : ch;

    const left = this.cachedRect ? this.cachedRect.left : 0;
    const top = this.cachedRect ? this.cachedRect.top : 0;

    return {
      x: (t.clientX - left) * (vw / cw),
      y: (t.clientY - top) * (vh / ch)
    };
  }

  getRestingPos() {
    const vw = this.viewWidth > 0 ? this.viewWidth : (window.innerWidth || 400);
    const vh = this.viewHeight > 0 ? this.viewHeight : (window.innerHeight || 800);
    const restingX = Math.round(Math.max(68, Math.min(95, vw * 0.20)));
    const restingY = Math.round(vh - Math.max(135, Math.min(165, vh * 0.18)));
    return { x: restingX, y: restingY };
  }

  bindEvents() {
    if (!this.canvas) return;

    const passiveOpts = { passive: false };

    // ── TOUCH START ──
    const handleTouchStart = (e) => {
      if (this.touch.active) return;
      this.updateRect();

      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];

        // Valid touch zone: Left 55% of screen, below header (clientY > 65)
        const isLeftZone = t.clientX < window.innerWidth * 0.55;
        const isBelowHeader = t.clientY > 65;

        if (isLeftZone && isBelowHeader) {
          e.preventDefault();
          this.touch.id = t.identifier;
          this.touch.active = true;

          const pos = this.toCanvas(t);
          const resting = this.getRestingPos();
          const distToResting = Math.hypot(pos.x - resting.x, pos.y - resting.y);

          // If touching within 75px of resting anchor, snap to resting base
          if (distToResting < 75) {
            this.touch.startX = resting.x;
            this.touch.startY = resting.y;
          } else {
            this.touch.startX = pos.x;
            this.touch.startY = pos.y;
          }

          this.touch.knobX = pos.x;
          this.touch.knobY = pos.y;
          this.touch.dx = 0;
          this.touch.dy = 0;
          this.touch.magnitude = 0;
          this.touch.moveX = 0;
          this.touch.jumpTriggered = false;

          if (this.onStart) this.onStart();
          break;
        }
      }
    };

    // ── TOUCH MOVE ──
    const handleTouchMove = (e) => {
      if (!this.touch.active) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === this.touch.id) {
          e.preventDefault();
          this.updatePosition(t);
          break;
        }
      }
    };

    // ── TOUCH END / CANCEL ──
    const handleTouchEnd = (e) => {
      if (!this.touch.active) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === this.touch.id) {
          this.reset();
          break;
        }
      }
    };

    // Attach listeners
    this.canvas.addEventListener('touchstart', handleTouchStart, passiveOpts);
    window.addEventListener('touchmove', handleTouchMove, passiveOpts);
    window.addEventListener('touchend', handleTouchEnd, passiveOpts);
    window.addEventListener('touchcancel', handleTouchEnd, passiveOpts);

    // ── MOUSE DESKTOP EMULATION ──
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (e.clientX < window.innerWidth * 0.55 && e.clientY > 65) {
        this.updateRect();
        this.isMouseDown = true;
        this.touch.active = true;
        this.touch.id = 9999;

        const pos = this.toCanvas(e);
        const resting = this.getRestingPos();
        const distToResting = Math.hypot(pos.x - resting.x, pos.y - resting.y);

        if (distToResting < 75) {
          this.touch.startX = resting.x;
          this.touch.startY = resting.y;
        } else {
          this.touch.startX = pos.x;
          this.touch.startY = pos.y;
        }

        this.touch.knobX = pos.x;
        this.touch.knobY = pos.y;
        this.touch.dx = 0;
        this.touch.dy = 0;
        this.touch.magnitude = 0;
        this.touch.moveX = 0;
        this.touch.jumpTriggered = false;

        if (this.onStart) this.onStart();
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isMouseDown || !this.touch.active) return;
      this.updatePosition(e);
    });

    window.addEventListener('mouseup', (e) => {
      if (this.isMouseDown) {
        this.isMouseDown = false;
        this.reset();
      }
    });

    window.addEventListener('resize', () => {
      this.updateRect();
    });
  }

  updatePosition(t) {
    const pos = this.toCanvas(t);
    const rawDx = pos.x - this.touch.startX;
    const rawDy = pos.y - this.touch.startY;
    const dist = Math.hypot(rawDx, rawDy);
    const R = this.maxRadius;

    if (!Number.isFinite(dist) || dist < this.deadzone) {
      // Deadzone prevents jitter
      this.touch.knobX = this.touch.startX;
      this.touch.knobY = this.touch.startY;
      this.touch.dx = 0;
      this.touch.dy = 0;
      this.touch.magnitude = 0;
      this.touch.moveX = 0;
    } else {
      const ndx = rawDx / dist;
      const ndy = rawDy / dist;
      this.touch.dx = Number.isFinite(ndx) ? ndx : 0;
      this.touch.dy = Number.isFinite(ndy) ? ndy : 0;

      if (dist <= R) {
        this.touch.knobX = pos.x;
        this.touch.knobY = pos.y;
      } else {
        // Floating Joystick mechanics: the base smoothly trails the thumb
        const overflow = dist - R;
        this.touch.startX += this.touch.dx * overflow;
        this.touch.startY += this.touch.dy * overflow;
        this.touch.knobX = this.touch.startX + this.touch.dx * R;
        this.touch.knobY = this.touch.startY + this.touch.dy * R;
      }

      // Analog magnitude and movement calculations
      const intensity = Math.min(1.0, (dist - this.deadzone) / (R - this.deadzone));
      this.touch.magnitude = intensity;

      // Analog horizontal velocity component (-1.0 to 1.0)
      this.touch.moveX = Math.max(-1.0, Math.min(1.0, this.touch.dx * intensity));

      // Upward Jump Flick Assist: pushing thumb upwards triggers jump
      if (this.touch.dy < -0.72 && intensity > 0.65 && !this.touch.jumpTriggered) {
        this.touch.jumpTriggered = true;
        if (this.onJump) this.onJump();
      } else if (this.touch.dy > -0.35) {
        this.touch.jumpTriggered = false;
      }
    }
  }

  reset() {
    this.touch.active = false;
    this.touch.id = -1;
    this.touch.dx = 0;
    this.touch.dy = 0;
    this.touch.magnitude = 0;
    this.touch.moveX = 0;
    this.touch.jumpTriggered = false;
  }

  getMoveX() {
    return this.touch.moveX;
  }

  update(dt, viewWidth, viewHeight) {
    this.time += dt;
    if (viewWidth > 0) this.viewWidth = viewWidth;
    if (viewHeight > 0) this.viewHeight = viewHeight;
  }

  render(ctx, viewWidth, viewHeight) {
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;

    ctx.save();

    const R = this.maxRadius;
    const knobR = this.knobRadius;

    if (this.touch.active) {
      // ─── ACTIVE FLOATING JOYSTICK (Under player's thumb) ───
      const cx = this.touch.startX;
      const cy = this.touch.startY;
      const kx = this.touch.knobX;
      const ky = this.touch.knobY;

      // 1. Outer Base Halo Ring
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.45)';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = 'rgba(5, 10, 30, 0.5)';
      ctx.fill();

      // 2. Cardinal Tech Notches (Chevrons / Crosshairs)
      const notches = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.7)';
      ctx.lineWidth = 2;
      for (const ang of notches) {
        const nx1 = cx + Math.cos(ang) * (R - 6);
        const ny1 = cy + Math.sin(ang) * (R - 6);
        const nx2 = cx + Math.cos(ang) * (R + 4);
        const ny2 = cy + Math.sin(ang) * (R + 4);
        ctx.beginPath();
        ctx.moveTo(nx1, ny1);
        ctx.lineTo(nx2, ny2);
        ctx.stroke();
      }

      // 3. Laser Vector Connecting Beam
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(kx, ky);
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.75)';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 4. Glowing Cyber Knob (Thumbstick Head)
      ctx.beginPath();
      ctx.arc(kx, ky, knobR, 0, Math.PI * 2);
      const knobGrad = ctx.createRadialGradient(kx - 4, ky - 4, 2, kx, ky, knobR);
      knobGrad.addColorStop(0, '#ffffff');
      knobGrad.addColorStop(0.35, 'rgba(0, 245, 255, 0.95)');
      knobGrad.addColorStop(1, 'rgba(2, 132, 199, 0.9)');
      ctx.fillStyle = knobGrad;
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Knob Chrome Rim
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Direction Indicator Arrow inside Knob
      if (this.touch.magnitude > 0.2) {
        ctx.save();
        ctx.translate(kx, ky);
        ctx.rotate(Math.atan2(this.touch.dy, this.touch.dx));
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-4, -5);
        ctx.lineTo(-2, 0);
        ctx.lineTo(-4, 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    } else {
      // ─── IDLE RESTING JOYSTICK BASE (Bottom Left Anchor) ───
      const resting = this.getRestingPos();
      const restingX = resting.x;
      const restingY = resting.y;
      const idlePulse = Math.sin(this.time * 2.5) * 0.05 + 0.95;

      // Base Resting Ring
      ctx.beginPath();
      ctx.arc(restingX, restingY, R * 0.88, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.22)';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(5, 10, 30, 0.22)';
      ctx.fill();
      ctx.stroke();

      // Cardinal Subtle Chevrons
      const restingNotches = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.35)';
      ctx.lineWidth = 1.5;
      for (const ang of restingNotches) {
        const nx1 = restingX + Math.cos(ang) * (R * 0.88 - 5);
        const ny1 = restingY + Math.sin(ang) * (R * 0.88 - 5);
        const nx2 = restingX + Math.cos(ang) * (R * 0.88 + 3);
        const ny2 = restingY + Math.sin(ang) * (R * 0.88 + 3);
        ctx.beginPath();
        ctx.moveTo(nx1, ny1);
        ctx.lineTo(nx2, ny2);
        ctx.stroke();
      }

      // Resting Center Knob with subtle heartbeat pulse
      ctx.beginPath();
      ctx.arc(restingX, restingY, knobR * 0.72 * idlePulse, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 245, 255, 0.25)';
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();

      // Directional Arrows Text (◀  ▶)
      ctx.font = '700 11px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(0, 245, 255, 0.45)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('◀  ▶', restingX, restingY);
    }

    ctx.restore();
  }
}
