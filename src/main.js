/**
 * @fileoverview Main Game Entry Point for Neon Zenith: Tower of Light
 * Initializes CrazyGames SDK v3, starts FluidCleb Splash & Lore Intro,
 * and launches the 60FPS delta-time loop.
 */

import { crazyGames } from './crazygames.js';
import { CinematicIntro } from './splash.js';
import { GameController } from './game.js';
import { sound } from './audio.js';

async function boot() {
  console.log('[Neon Zenith: Tower of Light] Booting up...');

  const appContainer = document.getElementById('app');
  const canvas = document.getElementById('game-canvas');

  // Warmup Web Audio API on first user gesture
  const resumeAudioOnGesture = () => {
    sound.ensureContext();
    window.removeEventListener('pointerdown', resumeAudioOnGesture);
    window.removeEventListener('keydown', resumeAudioOnGesture);
  };
  window.addEventListener('pointerdown', resumeAudioOnGesture);
  window.addEventListener('keydown', resumeAudioOnGesture);

  // Initialize CrazyGames SDK v3 (protected with 600ms watchdog in crazygames.js)
  try {
    await crazyGames.init();
  } catch (err) {
    console.warn('[CrazyGames] SDK init bypassed:', err);
  }

  // Instantiate Central Game Controller immediately so canvas & HUD are live
  const game = new GameController(canvas);

  // High performance Delta-Time Loop
  let lastTime = performance.now();

  function gameLoop(currentTime) {
    const dt = Math.min(0.05, (currentTime - lastTime) / 1000);
    lastTime = currentTime;

    game.update(dt);
    game.render(dt);

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);

  // Start Cinematic Intro Overlay (FluidCleb Interactive Splash -> Lore -> Land in Gameplay)
  if (appContainer) {
    let introFinished = false;
    const onIntroDone = () => {
      if (introFinished) return;
      introFinished = true;
      console.log('[Neon Zenith] Intro complete. Runner ready in gameplay!');
      game.startAfterIntro();
    };

    const intro = new CinematicIntro(appContainer, onIntroDone);
    intro.start();

    // Absolute fallback watchdog: ensure gameplay starts after 5.5s even if intro stalls
    setTimeout(() => {
      if (!introFinished) {
        console.warn('[Neon Zenith] Intro watchdog triggered. Forcing gameplay start.');
        intro.finish();
        onIntroDone();
      }
    }, 5500);
  }
}

// Guaranteed boot execution regardless of script load timing
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
