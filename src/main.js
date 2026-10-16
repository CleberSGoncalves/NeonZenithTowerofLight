/**
 * @fileoverview Main Game Entry Point for Neon Zenith: Tower of Light
 * Initializes CrazyGames SDK v3, starts FluidCleb Splash & Lore Intro,
 * and launches the 60FPS delta-time loop.
 */

import { crazyGames } from './crazygames.js';
import { CinematicIntro } from './splash.js';
import { GameController } from './game.js';
import { sound } from './audio.js';

window.addEventListener('DOMContentLoaded', async () => {
  console.log('[Neon Zenith: Tower of Light] Booting up...');

  // Initialize CrazyGames SDK v3
  await crazyGames.init();

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

  // Start Cinematic Intro (FluidCleb Interactive Splash -> Lore -> Land in Gameplay)
  const intro = new CinematicIntro(appContainer, () => {
    console.log('[Neon Zenith] Intro complete. Starting Gameplay Loop...');

    // Instantiate Central Game Controller
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
  });

  intro.start();
});
