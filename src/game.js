/**
 * @fileoverview Central Game Coordinator for Neon Zenith: Tower of Light
 * Fixed Timestep Accumulator (60Hz/144Hz/165Hz consistency), Anti-Softlock State Guard,
 * Dynamic Dash Trails, Swept Laser Collision, and Quests Tracking.
 */

import { sectors } from './levels.js';
import { physics } from './physics.js';
import { Engine3D } from './engine3d.js';
import { GameHUD } from './hud.js';
import { sound } from './audio.js';
import { storage } from './storage.js';
import { crazyGames } from './crazygames.js';

export class GameController {
  constructor(canvas) {
    this.canvas = canvas;
    this.engine = new Engine3D(canvas);

    // Game state flags
    this.currentSectorIndex = storage.getUnlockedSector();
    this.currentSector = null;
    this.player = null;
    this.particles = [];

    this.isPaused = false;
    this.isRoundOver = false;
    this.isAdPaused = false;
    this.isHitStopped = false;
    this.hasRevivedThisRound = false;

    // Fixed timestep accumulator for deterministic 60Hz/144Hz/165Hz physics
    this.physicsAccumulator = 0;
    this.FIXED_DT = 1 / 60;

    this.levelTime = 0;
    this.score = 0;
    this.orbsCollected = 0;
    this.firstInputGiven = false;

    this.input = {
      moveX: 0,
      jumpPressed: false,
      dashPressed: false
    };

    this.keys = {};
    this.touchInput = { moveX: 0 };

    // Instantiate HUD
    this.hud = new GameHUD({
      touchInput: this.touchInput,
      onTouchJump: () => this.handleJumpInput(),
      onTouchDash: () => this.handleDashInput(),
      onRestartLevel: () => this.restartLevel(),
      onSelectSector: (id) => this.loadSector(id),
      onClaimStarPass: () => this.handleClaimStarPass(),
      onModalOpen: () => {
        this.isPaused = true;
        crazyGames.gameplayStop();
      },
      onModalClose: () => {
        // ANTI-SOFTLOCK SAFEGUARD: If player was on victory/defeat, restore modal or restart
        if (this.isRoundOver) {
          if (this.player && !this.player.alive) {
            this.handleSectorDefeat();
          } else {
            this.handleSectorVictory();
          }
        } else {
          this.isPaused = false;
          crazyGames.gameplayStart();
        }
      }
    });

    // Connect buffered jump audio/VFX callback
    physics.onBufferedJump = () => {
      sound.playJump();
      this.spawnJumpParticles();
    };

    this.setupKeyboard();
    this.loadSector(this.currentSectorIndex);
  }

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (!this.firstInputGiven && (e.code === 'KeyA' || e.code === 'KeyD' || e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'Space')) {
        this.firstInputGiven = true;
        crazyGames.gameplayStart();
        sound.startMusic();
      }

      if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
        this.handleJumpInput();
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyJ') {
        this.handleDashInput();
      }
      if (e.code === 'KeyR') {
        this.restartLevel();
      }
      if (e.code === 'Escape' || e.code === 'KeyP') {
        this.hud.showPauseModal();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  handleJumpInput() {
    if (this.isPaused || this.isRoundOver || this.isAdPaused) return;
    if (physics.triggerJump(this.player)) {
      sound.playJump();
      this.spawnJumpParticles();
    }
  }

  handleDashInput() {
    if (this.isPaused || this.isRoundOver || this.isAdPaused) return;
    const dashBonus = storage.data.upgrades.dash || 1;
    if (physics.triggerDash(this.player, dashBonus)) {
      sound.playDash();
      this.engine.camera.addTrauma(0.2);
      this.spawnDashTrail();
      // Track Air Dashes Quest (Daily 2)
      storage.addQuestProgress('daily2', 1);
    }
  }

  // ── ANTI-SOFTLOCK MANDATORY RESET IN LOADSECTOR() ──
  loadSector(sectorId) {
    this.isRoundOver = false;
    this.isPaused = false;
    this.isAdPaused = false;
    this.isHitStopped = false;
    this.hasRevivedThisRound = false;
    this.physicsAccumulator = 0;

    if (sound && sound.setAdMuted) sound.setAdMuted(false);
    this.hud.closeAll();

    const target = sectors.find(s => s.id === sectorId) || sectors[0];
    this.currentSectorIndex = target.id;

    this.currentSector = JSON.parse(JSON.stringify(target));
    this.levelTime = 0;
    this.score = 0;
    this.orbsCollected = 0;
    this.particles = [];

    const startPos = this.currentSector.spawn;
    this.player = physics.createPlayer(startPos.x, startPos.y, startPos.z);
    this.player.skin = storage.data.skins.equipped || 'classic';
    this.player.hasShield = (storage.data.upgrades.shield || 1) >= 2;

    this.hud.updateHUD(this.currentSector, this.player, 0, 0);
    this.hud.updateStarProgress(0, this.currentSector.orbs.length, 0, this.currentSector.parTime, false);
    crazyGames.gameplayStart();
  }

  restartLevel() {
    sound.playButtonClick();
    this.loadSector(this.currentSectorIndex);
  }

  triggerHitStop(durationMs = 60) {
    this.isHitStopped = true;
    setTimeout(() => {
      this.isHitStopped = false;
    }, durationMs);
  }

  handleClaimStarPass() {
    if (this.isRoundOver) return;
    this.handleSectorVictory();
  }

  handleSectorVictory() {
    if (this.isRoundOver) return;
    this.isRoundOver = true;
    crazyGames.gameplayStop();

    const totalOrbs = this.currentSector.orbs.length;
    const starsEarned = this.hud.updateStarProgress(
      this.orbsCollected,
      totalOrbs,
      this.levelTime,
      this.currentSector.parTime,
      true
    );

    const timeBonus = Math.max(0, Math.floor((this.currentSector.parTime - this.levelTime) * 15));
    const finalScore = this.score + 500 + timeBonus + starsEarned * 200;
    const baseBits = 50 + starsEarned * 30 + this.orbsCollected * 10;

    storage.recordSectorClear(this.currentSectorIndex, starsEarned, this.levelTime, finalScore, baseBits);
    this.hud.updateBitsDisplay();

    sound.playVictory();
    if (starsEarned === 3) {
      crazyGames.happyTime();
    }
    this.spawnSummitFireworks();

    setTimeout(() => {
      this.hud.showVictoryModal({
        sector: this.currentSector,
        stars: starsEarned,
        time: this.levelTime,
        score: finalScore,
        bitsEarned: baseBits,
        onNext: () => {
          crazyGames.requestMidgameAd(() => {
            const next = Math.min(15, this.currentSectorIndex + 1);
            this.loadSector(next);
          });
        },
        onRetry: () => {
          this.restartLevel();
        }
      });
    }, 600);
  }

  handleSectorDefeat() {
    if (this.isRoundOver) return;
    this.isRoundOver = true;
    this.player.alive = false;
    crazyGames.gameplayStop();
    sound.playDefeat();
    this.engine.camera.addTrauma(0.6);

    setTimeout(() => {
      this.hud.showDefeatModal({
        sector: this.currentSector,
        canRevive: !this.hasRevivedThisRound,
        onRetry: () => {
          crazyGames.requestMidgameAd(() => {
            this.restartLevel();
          });
        },
        onRevive: () => {
          this.hasRevivedThisRound = true;
          this.player.alive = true;
          this.player.hasShield = true;
          this.player.invulnerableTimer = 3.0;
          this.player.y = this.currentSector.spawn.y;
          this.player.x = this.currentSector.spawn.x;
          this.player.vy = -350;
          this.isRoundOver = false;
          crazyGames.gameplayStart();
        }
      });
    }, 450);
  }

  spawnJumpParticles() {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: this.player.x + (Math.random() - 0.5) * 16,
        y: this.player.y,
        z: this.player.z,
        size: Math.random() * 3 + 2,
        life: 0.35,
        maxLife: 0.35,
        color: '#00f5ff'
      });
    }
  }

  spawnDashTrail() {
    // Dynamic color from equipped trail
    const trailColors = {
      cyan: '#00f5ff',
      magenta: '#ec4899',
      gold: '#facc15',
      green: '#10b981'
    };
    const color = trailColors[storage.data.trails.equipped] || '#00f5ff';

    for (let i = 0; i < 9; i++) {
      this.particles.push({
        x: this.player.x + (Math.random() - 0.5) * 20,
        y: this.player.y - 15 + (Math.random() - 0.5) * 15,
        z: this.player.z,
        size: Math.random() * 4 + 2,
        life: 0.45,
        maxLife: 0.45,
        color,
        shape: 'spark'
      });
    }
  }

  spawnOrbSparkles(x, y, z) {
    for (let i = 0; i < 14; i++) {
      this.particles.push({
        x,
        y,
        z,
        size: Math.random() * 3.5 + 1.5,
        life: 0.5,
        maxLife: 0.5,
        color: '#facc15'
      });
    }
  }

  spawnSummitFireworks() {
    const core = this.currentSector.summitCore;
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        x: core.x + (Math.random() - 0.5) * 150,
        y: core.y - 40 + (Math.random() - 0.5) * 150,
        z: core.z,
        size: Math.random() * 5 + 2,
        life: 1.2,
        maxLife: 1.2,
        color: ['#00f5ff', '#facc15', '#ec4899', '#10b981'][Math.floor(Math.random() * 4)]
      });
    }
  }

  // ── FIXED TIMESTEP INTEGRATION (DETERMINISTIC 60Hz/144Hz/165Hz) ──
  update(rawDt) {
    if (this.isPaused || this.isAdPaused || this.isHitStopped) return;

    // Cap maximum frame delay to prevent spiral of death
    const clampedDt = Math.min(0.05, rawDt);
    this.physicsAccumulator += clampedDt;

    while (this.physicsAccumulator >= this.FIXED_DT) {
      this.physicsStep(this.FIXED_DT);
      this.physicsAccumulator -= this.FIXED_DT;
    }
  }

  physicsStep(dt) {
    if (this.isPaused || this.isAdPaused || this.isHitStopped) return;

    this.levelTime += dt;

    let moveX = this.touchInput.moveX;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;
    this.input.moveX = Math.max(-1, Math.min(1, moveX));

    const prevY = this.player.y;

    const speedBonus = storage.data.upgrades.speed || 1;
    physics.update(this.player, this.currentSector, this.input, dt, speedBonus);

    // 1. Check Death Boundary
    if (this.player.y > (this.currentSector.deathY || 200)) {
      this.handleSectorDefeat();
      return;
    }

    // 2. Check Jump Pads (Works during Dash as well)
    if (this.currentSector.jumpPads) {
      for (const pad of this.currentSector.jumpPads) {
        const dist = Math.hypot(this.player.x - pad.x, this.player.y - pad.y);
        if (dist < 36 && this.player.vy >= -120) {
          this.player.vy = -pad.impulse;
          sound.playBouncePad();
          this.engine.camera.addTrauma(0.3);
          this.player.scaleX = 0.75;
          this.player.scaleY = 1.45;
        }
      }
    }

    // 3. Swept Laser Collision (Anti-tunneling during frame drops)
    if (this.currentSector.lasers) {
      const pTop = Math.min(prevY, this.player.y) - 34;
      const pBottom = Math.max(prevY, this.player.y);

      for (const laser of this.currentSector.lasers) {
        laser.cycleTimer = (laser.cycleTimer || 0) + dt;
        laser.active = (laser.cycleTimer % laser.cycleDuration) < (laser.cycleDuration * 0.65);

        if (laser.active && this.player.invulnerableTimer <= 0) {
          const inX = this.player.x + this.player.w * 0.5 >= laser.x1 && this.player.x - this.player.w * 0.5 <= laser.x2;
          const inY = laser.y1 >= pTop && laser.y1 <= pBottom + 10;

          if (inX && inY) {
            if (this.player.hasShield) {
              this.player.hasShield = false;
              this.player.invulnerableTimer = 1.5;
              sound.playShieldBreak();
              this.engine.camera.addTrauma(0.5);
              this.triggerHitStop(60);
              this.player.vy = -350;
            } else {
              sound.playLaserHit();
              this.handleSectorDefeat();
              return;
            }
          }
        }
      }
    }

    // 4. Data Orbs
    if (this.currentSector.orbs) {
      const magnetLevel = storage.data.upgrades.magnet || 1;
      const collectRadius = 24 + magnetLevel * 10;

      for (const orb of this.currentSector.orbs) {
        if (!orb.collected) {
          const dist = Math.hypot(this.player.x - orb.x, (this.player.y - 15) - orb.y);
          if (dist < collectRadius) {
            orb.collected = true;
            this.orbsCollected++;
            this.score += 100;
            sound.playCollectOrb();
            this.spawnOrbSparkles(orb.x, orb.y, orb.z);
            storage.addQuestProgress('daily3', 1);
          }
        }
      }
    }

    // 5. Summit Core
    if (this.currentSector.summitCore && !this.isRoundOver) {
      const core = this.currentSector.summitCore;
      const dist = Math.hypot(this.player.x - core.x, this.player.y - core.y);
      if (dist < 48) {
        this.handleSectorVictory();
        return;
      }
    }

    // 6. Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].life -= dt;
      if (this.particles[i].life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 7. HUD
    this.hud.updateHUD(this.currentSector, this.player, this.levelTime, this.score);
    this.hud.updateStarProgress(
      this.orbsCollected,
      this.currentSector.orbs.length,
      this.levelTime,
      this.currentSector.parTime,
      false
    );
  }

  render(dt) {
    this.engine.render(this.currentSector, this.player, this.particles, dt);
  }
}
