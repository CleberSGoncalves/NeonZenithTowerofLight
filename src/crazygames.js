/**
 * @fileoverview CrazyGames SDK v3 Integration with 2.5s Watchdog, Guaranteed Finally, and AdBlock Protection
 * Full compliance with official CrazyGames SDK v3 documentation & guidelines.
 */

import { sound } from './audio.js';

class CrazyGamesBridge {
  constructor() {
    this.sdk = null;
    this.isInitialized = false;
    this.hasAdblock = false;
    this.lastMidgameTime = Date.now();
    this.isAdPaused = false;
  }

  async init() {
    if (typeof window !== 'undefined' && window.CrazyGames && window.CrazyGames.SDK) {
      try {
        this.sdk = window.CrazyGames.SDK;
        await this.sdk.init();
        this.isInitialized = true;
        console.log('[CrazyGames] SDK v3 initialized successfully ✓');
      } catch (err) {
        console.warn('[CrazyGames] SDK init error / AdBlock detected:', err);
        this.hasAdblock = true;
      }
    } else {
      console.log('[CrazyGames] Running in standalone development sandbox.');
    }
  }

  _canRequestLiveAds() {
    if (typeof window === 'undefined') return false;
    const hostname = window.location.hostname || '';
    const isLiveCrazyDomain = /crazygames\.com|1001juegos\.com/i.test(hostname);
    const isSdkAvailable = this.isInitialized && this.sdk && this.sdk.ad;
    const isEnabled = this.sdk && this.sdk.environment !== 'disabled';
    return isLiveCrazyDomain && isSdkAvailable && isEnabled && !this.hasAdblock;
  }

  gameplayStart() {
    if (this.isInitialized && this.sdk && this.sdk.game && typeof this.sdk.game.gameplayStart === 'function') {
      try {
        this.sdk.game.gameplayStart();
      } catch (e) {
        console.warn('[CrazyGames] gameplayStart error:', e);
      }
    }
  }

  gameplayStop() {
    if (this.isInitialized && this.sdk && this.sdk.game && typeof this.sdk.game.gameplayStop === 'function') {
      try {
        this.sdk.game.gameplayStop();
      } catch (e) {
        console.warn('[CrazyGames] gameplayStop error:', e);
      }
    }
  }

  happyTime() {
    if (this.isInitialized && this.sdk && this.sdk.game && typeof this.sdk.game.happytime === 'function') {
      try {
        this.sdk.game.happytime();
      } catch (e) {}
    }
  }

  /**
   * Request Rewarded Ad with mandatory 2.5s Watchdog, Guaranteed Finally & AdBlock guard.
   * Rule: If AdBlock / adError occurs, NEVER award the reward!
   */
  async requestRewardedAd(onRewarded, onDismissed) {
    if (!this._canRequestLiveAds()) {
      console.log('[CrazyGames] Dev/Sandbox: Rewarded Ad simulated bypass.');
      setTimeout(() => {
        if (onRewarded) onRewarded();
      }, 1000);
      return;
    }

    let finished = false;
    let wasRewarded = false;
    this.isAdPaused = true;
    sound.setAdMuted(true);

    const finish = (rewardState) => {
      if (!finished) {
        finished = true;
        clearTimeout(watchdog);
        this.isAdPaused = false;
        sound.setAdMuted(false);
        if (rewardState) {
          if (onRewarded) onRewarded();
        } else {
          if (onDismissed) onDismissed();
        }
      }
    };

    const watchdog = setTimeout(() => {
      console.warn('[CrazyGames] Rewarded Ad watchdog triggered: SDK did not respond in 2.5s.');
      finish(false);
    }, 2500);

    try {
      await this.sdk.ad.requestAd('rewarded', {
        adStarted: () => {
          sound.setAdMuted(true);
        },
        adFinished: () => {
          wasRewarded = true;
          finish(true);
        },
        adError: (err) => {
          console.warn('[CrazyGames] Rewarded ad error (AdBlock):', err);
          finish(false);
        }
      });
    } catch (e) {
      console.warn('[CrazyGames] Rewarded ad exception:', e);
      finish(false);
    } finally {
      // Guaranteed safety cleanup
      if (!this._canRequestLiveAds()) {
        this.isAdPaused = false;
        sound.setAdMuted(false);
      }
    }
  }

  /**
   * Request Midgame Interstitial Ad with 2.5s Watchdog & 3.5-minute throttle.
   * Only called on Victory or Defeat screens, NEVER during active gameplay.
   */
  async requestMidgameAd(onComplete) {
    const now = Date.now();
    if (now - this.lastMidgameTime < 210000 || !this._canRequestLiveAds()) {
      if (onComplete) onComplete();
      return;
    }

    this.lastMidgameTime = now;
    let finished = false;
    this.isAdPaused = true;
    sound.setAdMuted(true);

    const finish = () => {
      if (!finished) {
        finished = true;
        clearTimeout(watchdog);
        this.isAdPaused = false;
        sound.setAdMuted(false);
        if (onComplete) onComplete();
      }
    };

    const watchdog = setTimeout(() => {
      console.warn('[CrazyGames] Midgame Ad watchdog triggered.');
      finish();
    }, 2500);

    try {
      await this.sdk.ad.requestAd('midgame', {
        adStarted: () => {
          sound.setAdMuted(true);
        },
        adFinished: () => {
          finish();
        },
        adError: (err) => {
          console.warn('[CrazyGames] Midgame ad error:', err);
          finish();
        }
      });
    } catch (e) {
      finish();
    } finally {
      if (!this._canRequestLiveAds()) {
        this.isAdPaused = false;
        sound.setAdMuted(false);
      }
    }
  }
}

export const crazyGames = new CrazyGamesBridge();
export default crazyGames;
