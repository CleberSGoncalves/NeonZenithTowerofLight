/**
 * @fileoverview Physics & Kinematics Engine for Neon Zenith: Tower of Light
 * Delta-time integration, Coyote Time (120ms), Jump Buffering (150ms),
 * Vertical Moving Platform carrying, Swept Laser Collision, and Anti-NaN Guards.
 */

// Math sanitizer guard to prevent NaN / Infinity physics corruption
function sanitize(val, fallback = 0) {
  return (typeof val === 'number' && Number.isFinite(val) && !Number.isNaN(val)) ? val : fallback;
}

export class PhysicsEngine {
  constructor() {
    this.gravity = 1450; // Pixels / sec²
    this.maxFallSpeed = 950;
    this.coyoteDuration = 0.12; // 120ms
    this.jumpBufferDuration = 0.15; // 150ms
    this.dashDuration = 0.16; // 160ms burst
    this.dashCooldownTime = 1.2; // 1.2s cooldown
    this.onBufferedJump = null; // Callback for buffered jump sound & particles
  }

  createPlayer(startX = 0, startY = 0, startZ = 0) {
    return {
      x: sanitize(startX),
      y: sanitize(startY),
      z: sanitize(startZ),
      vx: 0,
      vy: 0,
      vz: 0,
      w: 24,
      h: 36,
      depth: 24,

      // State flags
      alive: true,
      isGrounded: false,
      facingRight: true,
      hasShield: true,
      invulnerableTimer: 0,

      // Timers & Game Feel
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      isDashing: false,
      dashTimer: 0,
      dashCooldown: 0,

      // Squash & Stretch Spring Simulation
      scaleX: 1.0,
      scaleY: 1.0,
      scaleVelX: 0,
      scaleVelY: 0,

      // Customization
      skin: 'classic',
      trail: 'cyan'
    };
  }

  triggerJump(player, jumpImpulse = 620) {
    if (!player || !player.alive) return false;
    // Can jump if grounded OR within coyote time window
    if (player.isGrounded || player.coyoteTimer > 0) {
      player.vy = -jumpImpulse;
      player.isGrounded = false;
      player.coyoteTimer = 0;
      player.jumpBufferTimer = 0;

      // Squash & stretch on jump: stretch vertically
      player.scaleX = 0.82;
      player.scaleY = 1.28;
      player.scaleVelX = 0;
      player.scaleVelY = 0;
      return true;
    } else {
      // Buffer the jump intent
      player.jumpBufferTimer = this.jumpBufferDuration;
      return false;
    }
  }

  triggerDash(player, dashSpeedBonus = 0) {
    if (!player || !player.alive || player.dashCooldown > 0 || player.isDashing) return false;

    player.isDashing = true;
    player.dashTimer = this.dashDuration;
    player.dashCooldown = Math.max(0.6, this.dashCooldownTime - dashSpeedBonus * 0.1);

    const dir = player.facingRight ? 1 : -1;
    player.vx = dir * 680;
    player.vy = -80; // Slight upward air float during dash

    // Squash & stretch on dash: stretch horizontally
    player.scaleX = 1.35;
    player.scaleY = 0.78;
    player.scaleVelX = 0;
    player.scaleVelY = 0;
    return true;
  }

  update(player, sector, input, dt, speedBonus = 0) {
    if (!player || !player.alive) return;
    dt = Math.min(dt, 0.05); // Cap large frame hitch

    // Sanitize bonus & velocities
    speedBonus = sanitize(speedBonus, 0);
    player.scaleVelX = sanitize(player.scaleVelX, 0);
    player.scaleVelY = sanitize(player.scaleVelY, 0);

    // 1. Update Squash & Stretch Harmonic Spring Damping
    const springStiffness = 180;
    const springDamping = 14;

    const forceX = -springStiffness * (player.scaleX - 1.0) - springDamping * player.scaleVelX;
    player.scaleVelX += forceX * dt;
    player.scaleX += player.scaleVelX * dt;

    const forceY = -springStiffness * (player.scaleY - 1.0) - springDamping * player.scaleVelY;
    player.scaleVelY += forceY * dt;
    player.scaleY += player.scaleVelY * dt;

    // Safety sanitize scales
    player.scaleX = sanitize(player.scaleX, 1.0);
    player.scaleY = sanitize(player.scaleY, 1.0);
    player.scaleVelX = sanitize(player.scaleVelX, 0);
    player.scaleVelY = sanitize(player.scaleVelY, 0);

    // 2. Timers countdown
    if (player.coyoteTimer > 0) player.coyoteTimer -= dt;
    if (player.dashCooldown > 0) player.dashCooldown -= dt;
    if (player.invulnerableTimer > 0) player.invulnerableTimer -= dt;

    // 3. Cyber Dash Processing
    if (player.isDashing) {
      player.dashTimer -= dt;
      if (player.dashTimer <= 0) {
        player.isDashing = false;
        player.vx *= 0.5; // Damp velocity after dash burst
      }
    } else {
      // Standard Directional Horizontal Movement (Framerate-independent exponential decay)
      const moveSpeed = (260 + speedBonus * 20);
      const targetVx = input.moveX * moveSpeed;
      const accel = player.isGrounded ? 18.0 : 10.0;
      const factor = 1 - Math.exp(-accel * dt);
      player.vx += (targetVx - player.vx) * factor;

      if (input.moveX !== 0) {
        player.facingRight = input.moveX > 0;
      }

      // Gravity integration
      player.vy = Math.min(this.maxFallSpeed, player.vy + this.gravity * dt);
    }

    // Sanitize velocities
    player.vx = sanitize(player.vx);
    player.vy = sanitize(player.vy);

    // Apply movement
    const prevY = player.y;
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // 4. Platform Collision Detection & Ground Resolution
    const wasGrounded = player.isGrounded;
    player.isGrounded = false;

    if (sector && sector.platforms) {
      for (const plat of sector.platforms) {
        if (plat.type === 'decay' && plat.decayTimer >= 0.85) {
          continue; // Platform is currently disintegrated
        }

        const halfW = (plat.w || 90) * 0.5;
        const platTop = plat.y;
        const platLeft = plat.x - halfW;
        const platRight = plat.x + halfW;

        // Check horizontal overlap
        if (player.x + player.w * 0.5 > platLeft && player.x - player.w * 0.5 < platRight) {
          // Check if landing on top of platform from above (accounting for vertical platform motion)
          const tolerance = Math.max(12, Math.abs(player.vy * dt) + 6);
          if (prevY <= platTop + 4 && player.y >= platTop - tolerance && player.vy >= -50) {
            player.y = platTop;
            player.vy = 0;
            player.isGrounded = true;

            // Carry moving platform velocity (horizontal & vertical)
            if (plat.vx) player.x += plat.vx * dt;
            if (plat.vy) player.y += plat.vy * dt;

            // Align Z depth to match visual platform depth
            player.z = plat.z || 0;

            // Trigger decay platform timer
            if (plat.type === 'decay' && plat.decayTimer === 0) {
              plat.decayTimer = 0.001; // Start disintegration
            }

            // Squash & stretch on landing impact
            if (!wasGrounded) {
              player.scaleX = 1.30;
              player.scaleY = 0.75;
              player.scaleVelX = 0;
              player.scaleVelY = 0;
            }
          }
        }
      }
    }

    // Coyote time trigger upon leaving ground without jumping
    if (wasGrounded && !player.isGrounded && player.vy >= 0) {
      player.coyoteTimer = this.coyoteDuration;
    }

    // Jump Buffering execution upon touching ground
    if (player.isGrounded && player.jumpBufferTimer > 0) {
      if (this.triggerJump(player)) {
        if (this.onBufferedJump) this.onBufferedJump();
      }
    }

    // Decrement jump buffer timer AFTER ground collision resolution
    if (player.jumpBufferTimer > 0) player.jumpBufferTimer -= dt;

    // Update moving platforms in the sector
    if (sector && sector.platforms) {
      for (const plat of sector.platforms) {
        if (plat.moveRangeX && plat.moveSpeedX) {
          plat.x += (plat.vx || plat.moveSpeedX) * dt;
          if (plat.x > plat.startX + plat.moveRangeX) {
            plat.vx = -Math.abs(plat.moveSpeedX);
          } else if (plat.x < plat.startX - plat.moveRangeX) {
            plat.vx = Math.abs(plat.moveSpeedX);
          }
        }
        if (plat.moveRangeY && plat.moveSpeedY) {
          plat.y += (plat.vy || plat.moveSpeedY) * dt;
          if (plat.y > plat.startY + plat.moveRangeY) {
            plat.vy = -Math.abs(plat.moveSpeedY);
          } else if (plat.y < plat.startY - plat.moveRangeY) {
            plat.vy = Math.abs(plat.moveSpeedY);
          }
        }
        if (plat.type === 'decay' && plat.decayTimer > 0) {
          plat.decayTimer += dt;
          if (plat.decayTimer > 2.2) {
            plat.decayTimer = 0; // Respawn decayed platform
          }
        }
      }
    }

    // Sanitize player coordinates
    player.x = sanitize(player.x);
    player.y = sanitize(player.y);
    player.z = sanitize(player.z);
  }
}

export const physics = new PhysicsEngine();
export default physics;
