/**
 * @fileoverview HUD & Modal Controller for Neon Zenith: Tower of Light
 * Manages 3-Row flex UI, 3-Star Live Progress Bar, Modal Stack Machine (Anti-Softlock),
 * Mobile Drawer Menu, Touch Controls, Meta-Shop with Skins & Trails, and Quests with 2X Ads.
 */

import { i18n } from './i18n.js';
import { sound } from './audio.js';
import { storage } from './storage.js';
import { crazyGames } from './crazygames.js';
import { sectors } from './levels.js';

export class GameHUD {
  constructor(callbacks) {
    this.callbacks = callbacks || {};
    this.modalStack = [];
    this.currentModal = null;
    this.isDrawerOpen = false;

    // Cache DOM elements
    this.sectorNameEl = document.getElementById('hud-sector-name');
    this.bitsCountEl = document.getElementById('hud-bits-count');
    this.timerTextEl = document.getElementById('hud-timer-text');
    this.scoreTextEl = document.getElementById('hud-score-text');

    this.starFillEl = document.getElementById('hud-star-fill');
    this.starMs1El = document.getElementById('star-ms-1');
    this.starMs2El = document.getElementById('star-ms-2');
    this.starMs3El = document.getElementById('star-ms-3');
    this.starInfoEl = document.getElementById('hud-star-info');
    this.claimStarBtn = document.getElementById('btn-claim-star-pass');

    this.shieldIndicator = document.getElementById('hud-shield-indicator');
    this.shieldText = document.getElementById('hud-shield-text');
    this.dashFillEl = document.getElementById('hud-dash-fill');

    this.modalBackdrop = document.getElementById('hud-modal');
    this.modalContent = document.getElementById('hud-modal-content');
    this.drawerMenu = document.getElementById('hud-drawer-menu');

    this.setupListeners();
    this.updateTexts();
  }

  show() {
    const el = document.getElementById('in-game-hud');
    if (el) el.classList.remove('hidden');
  }

  hide() {
    const el = document.getElementById('in-game-hud');
    if (el) el.classList.add('hidden');
  }

  setupListeners() {
    document.getElementById('btn-sector-select').onclick = () => {
      sound.playButtonClick();
      this.showSectorSelectModal();
    };

    document.getElementById('btn-toggle-sound').onclick = (e) => {
      const isMuted = sound.toggleMute();
      e.target.textContent = isMuted ? '🔇' : '🔊';
      sound.playButtonClick();
    };

    document.getElementById('btn-toggle-pause').onclick = () => {
      sound.playButtonClick();
      this.showPauseModal();
    };

    document.getElementById('btn-open-shop').onclick = () => {
      sound.playButtonClick();
      this.showShopModal();
    };

    document.getElementById('btn-open-spin').onclick = () => {
      sound.playButtonClick();
      this.showLuckySpinModal();
    };

    document.getElementById('btn-open-quests').onclick = () => {
      sound.playButtonClick();
      this.showQuestsModal();
    };

    document.getElementById('btn-open-daily').onclick = () => {
      sound.playButtonClick();
      this.showDailyLoginModal();
    };

    this.claimStarBtn.onclick = () => {
      sound.playButtonClick();
      if (this.callbacks.onClaimStarPass) {
        this.callbacks.onClaimStarPass();
      }
    };

    document.getElementById('btn-drawer-toggle').onclick = () => {
      sound.playButtonClick();
      this.toggleDrawer();
    };
    document.getElementById('btn-drawer-close').onclick = () => {
      sound.playButtonClick();
      this.toggleDrawer(false);
    };

    document.getElementById('drawer-btn-sectors').onclick = () => {
      this.toggleDrawer(false);
      this.showSectorSelectModal();
    };
    document.getElementById('drawer-btn-shop').onclick = () => {
      this.toggleDrawer(false);
      this.showShopModal();
    };
    document.getElementById('drawer-btn-spin').onclick = () => {
      this.toggleDrawer(false);
      this.showLuckySpinModal();
    };
    document.getElementById('drawer-btn-quests').onclick = () => {
      this.toggleDrawer(false);
      this.showQuestsModal();
    };
    document.getElementById('drawer-btn-daily').onclick = () => {
      this.toggleDrawer(false);
      this.showDailyLoginModal();
    };
    document.getElementById('drawer-btn-sound').onclick = () => {
      const isMuted = sound.toggleMute();
      document.getElementById('btn-toggle-sound').textContent = isMuted ? '🔇' : '🔊';
      sound.playButtonClick();
    };
    document.getElementById('drawer-btn-restart').onclick = () => {
      this.toggleDrawer(false);
      if (this.callbacks.onRestartLevel) this.callbacks.onRestartLevel();
    };
    document.getElementById('drawer-btn-lang').onclick = () => {
      i18n.toggleLocale();
      sound.playButtonClick();
      this.updateTexts();
      this.toggleDrawer(false);
    };

    const setupTouchBtn = (id, onDown, onUp) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart', (e) => { e.preventDefault(); el.classList.add('pressed'); onDown(); }, { passive: false });
      el.addEventListener('touchend', (e) => { e.preventDefault(); el.classList.remove('pressed'); onUp(); }, { passive: false });
      el.addEventListener('mousedown', (e) => { el.classList.add('pressed'); onDown(); });
      el.addEventListener('mouseup', (e) => { el.classList.remove('pressed'); onUp(); });
      el.addEventListener('mouseleave', (e) => { el.classList.remove('pressed'); onUp(); });
    };

    if (this.callbacks.touchInput) {
      setupTouchBtn('touch-left', () => { this.callbacks.touchInput.moveX = -1; }, () => { if (this.callbacks.touchInput.moveX === -1) this.callbacks.touchInput.moveX = 0; });
      setupTouchBtn('touch-right', () => { this.callbacks.touchInput.moveX = 1; }, () => { if (this.callbacks.touchInput.moveX === 1) this.callbacks.touchInput.moveX = 0; });
      setupTouchBtn('touch-jump', () => { if (this.callbacks.onTouchJump) this.callbacks.onTouchJump(); }, () => {});
      setupTouchBtn('touch-dash', () => { if (this.callbacks.onTouchDash) this.callbacks.onTouchDash(); }, () => {});
    }
  }

  toggleDrawer(forceState) {
    this.isDrawerOpen = typeof forceState === 'boolean' ? forceState : !this.isDrawerOpen;
    if (this.isDrawerOpen) {
      this.drawerMenu.classList.remove('hidden');
    } else {
      this.drawerMenu.classList.add('hidden');
    }
  }

  updateBitsDisplay() {
    if (this.bitsCountEl) {
      this.bitsCountEl.textContent = storage.data.bits || 0;
    }
  }

  updateTexts() {
    const unlocked = storage.getUnlockedSector();
    if (this.sectorNameEl) this.sectorNameEl.textContent = `${i18n.t('sector')} ${unlocked < 10 ? '0' + unlocked : unlocked}`;
    if (this.claimStarBtn) this.claimStarBtn.textContent = i18n.t('clear_sector_btn');

    // Drawer menu buttons translation
    const dSectors = document.getElementById('drawer-btn-sectors');
    const dShop = document.getElementById('drawer-btn-shop');
    const dSpin = document.getElementById('drawer-btn-spin');
    const dQuests = document.getElementById('drawer-btn-quests');
    const dDaily = document.getElementById('drawer-btn-daily');
    const dSound = document.getElementById('drawer-btn-sound');
    const dRestart = document.getElementById('drawer-btn-restart');
    const dLang = document.getElementById('drawer-btn-lang');

    if (dSectors) dSectors.textContent = `🗺️ ${i18n.t('sectors_title')}`;
    if (dShop) dShop.textContent = `🛍️ ${i18n.t('shop_title')}`;
    if (dSpin) dSpin.textContent = `🎰 ${i18n.t('spin_title')}`;
    if (dQuests) dQuests.textContent = `📜 ${i18n.t('quests_title')}`;
    if (dDaily) dDaily.textContent = `🎁 ${i18n.t('daily_title')}`;
    if (dSound) dSound.textContent = `🔊 ${i18n.t('sound')}`;
    if (dRestart) dRestart.textContent = `🔄 ${i18n.t('restart')}`;
    if (dLang) dLang.textContent = `🌐 ${i18n.t('language')} (${i18n.locale.toUpperCase()})`;

    this.updateBitsDisplay();
  }

  updateHUD(sector, player, elapsedSec, score, boss = null, gameMode = 'standard', bossTimer = 0, scoreMultiplier = 1.0, adaptiveRate = 1.0) {
    if (this.sectorNameEl && sector) {
      if (gameMode === 'boss_rush') {
        const nextBossIn = Math.max(0, 60 - bossTimer);
        this.sectorNameEl.textContent = boss ? `👹 BOSS: ${boss.hp}/${boss.maxHp}` : `👹 RUSH • ${nextBossIn.toFixed(0)}s (x${scoreMultiplier.toFixed(1)})`;
      } else {
        const pacingText = adaptiveRate > 1.0 ? ' ⚡+15%' : (adaptiveRate < 1.0 ? ' 💚EMERGENCY' : '');
        this.sectorNameEl.textContent = `${i18n.t('sector')} ${sector.id < 10 ? '0' + sector.id : sector.id}${pacingText}`;
      }
    }

    if (this.timerTextEl) {
      const m = Math.floor(elapsedSec / 60);
      const s = Math.floor(elapsedSec % 60);
      this.timerTextEl.textContent = `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
    }

    if (this.scoreTextEl) {
      const multText = scoreMultiplier > 1.0 ? ` (x${scoreMultiplier.toFixed(1)})` : '';
      this.scoreTextEl.textContent = `${score} PTS${multText}`;
    }

    if (player && this.shieldIndicator && this.shieldText) {
      if (player.hasShield) {
        this.shieldIndicator.classList.remove('depleted');
        this.shieldText.textContent = 'SHIELD READY';
      } else {
        this.shieldIndicator.classList.add('depleted');
        this.shieldText.textContent = 'OFFLINE';
      }
    }

    if (player && this.dashFillEl) {
      if (player.dashCooldown <= 0) {
        this.dashFillEl.style.width = '100%';
      } else {
        const pct = Math.max(0, 1 - (player.dashCooldown / 1.2)) * 100;
        this.dashFillEl.style.width = `${pct}%`;
      }
    }
  }

  // ── 3-STAR LIVE PROGRESS BAR ──
  updateStarProgress(orbsCollected, totalOrbs, elapsedSec, parTime, reachedSummit) {
    let starsCount = 0;
    const orbRatio = totalOrbs > 0 ? (orbsCollected / totalOrbs) : 0;

    const star1Achieved = reachedSummit || orbRatio >= 0.5;
    if (star1Achieved) {
      starsCount++;
      this.starMs1El.classList.add('achieved');
      this.claimStarBtn.classList.remove('hidden');
    } else {
      this.starMs1El.classList.remove('achieved');
      this.claimStarBtn.classList.add('hidden');
    }

    const star2Achieved = star1Achieved && elapsedSec <= parTime;
    if (star2Achieved) {
      starsCount++;
      this.starMs2El.classList.add('achieved');
    } else {
      this.starMs2El.classList.remove('achieved');
    }

    const star3Achieved = star1Achieved && orbsCollected >= totalOrbs;
    if (star3Achieved) {
      starsCount++;
      this.starMs3El.classList.add('achieved');
    } else {
      this.starMs3El.classList.remove('achieved');
    }

    const fillPct = Math.min(100, Math.round((orbRatio * 0.4 + (reachedSummit ? 0.3 : 0) + (star2Achieved ? 0.3 : 0)) * 100));
    this.starFillEl.style.width = `${fillPct}%`;
    this.starInfoEl.textContent = `★ ${starsCount}/3 • ${orbsCollected}/${totalOrbs} ORBS`;

    return starsCount;
  }

  // ══════════════════════════════════════════════════════════════════
  // MODAL CONTROLLER & ANTI-SOFTLOCK MACHINE
  // ══════════════════════════════════════════════════════════════════
  openModal(htmlContent, modalType = 'general', rebindCallback = null) {
    this.modalStack.push({ type: modalType, render: rebindCallback || (() => this.modalContent.innerHTML = htmlContent) });
    this.currentModal = modalType;
    this.modalContent.innerHTML = htmlContent;
    this.modalBackdrop.classList.remove('hidden');
    if (this.callbacks.onModalOpen) this.callbacks.onModalOpen();
  }

  closeModal() {
    this.modalStack.pop();
    if (this.modalStack.length > 0) {
      const prev = this.modalStack[this.modalStack.length - 1];
      this.currentModal = prev.type;
      if (typeof prev.render === 'function') {
        prev.render();
      }
    } else {
      this.currentModal = null;
      this.modalBackdrop.classList.add('hidden');
      if (this.callbacks.onModalClose) this.callbacks.onModalClose();
    }
  }

  closeAll() {
    this.modalStack = [];
    this.currentModal = null;
    this.modalBackdrop.classList.add('hidden');
  }

  // ── SECTOR SELECT MODAL (3-STAR CARDS & BOSS RUSH TOGGLE) ──
  showSectorSelectModal() {
    const render = () => {
      const unlocked = storage.getUnlockedSector();
      const isBossRush = this.callbacks.getGameMode ? (this.callbacks.getGameMode() === 'boss_rush') : false;
      const totalStars = storage.getTotalStars();
      let cardsHtml = '';

      for (let i = 1; i <= 15; i++) {
        const isLocked = i > unlocked;
        const stars = storage.getSectorStars(i);
        const bestTime = storage.data.sectorBestTimes[i] || 9999;
        const secCfg = sectors.find(s => s.id === i) || { name: `Setor ${i}`, parTime: 30, orbCount: 6, difficulty: 'Normal' };
        const starsIcons = [1, 2, 3].map(s => `<span class="${s <= stars ? 'star-gold' : ''}">★</span>`).join('');

        // Preview gradient theme based on difficulty
        const previewGradients = [
          'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          'linear-gradient(135deg, #0f766e 0%, #047857 100%)',
          'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
          'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)'
        ];
        const grad = previewGradients[(i - 1) % 4];

        cardsHtml += `
          <div class="sector-card ${isLocked ? 'locked' : ''}" data-sector="${i}" style="min-width: 140px;">
            <div style="width: 100%; height: 38px; border-radius: 8px; background: ${isLocked ? '#1e293b' : grad}; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: inset 0 0 10px rgba(0,0,0,0.5);">
              ${isLocked ? '🔒' : (isBossRush ? '👹' : '⚡')}
            </div>
            <div class="sector-card-num" style="font-size: 13px; font-weight: 900; margin-top: 4px;">
              S${i < 10 ? '0' + i : i}: ${secCfg.name}
            </div>
            <div class="sector-card-stars" style="font-size: 16px;">${starsIcons}</div>
            <div style="font-size: 10px; color: #94a3b8; text-align: center; line-height: 1.3;">
              <div>1★ Cume • 2★ &lt;${secCfg.parTime}s</div>
              <div>3★ ${secCfg.orbCount} Orbes</div>
            </div>
            <div style="font-size: 11px; font-weight: 800; color: #facc15; margin-top: 2px;">
              ${bestTime < 9000 ? `⏱ Record: ${bestTime}s` : '⏱ Sem Recorde'}
            </div>
            <button class="btn-primary-action" style="padding: 4px 10px; font-size: 11px; margin-top: 4px; width: 100%;" ${isLocked ? 'disabled' : ''}>
              ${isLocked ? 'BLOQUEADO' : 'JOGAR ➔'}
            </button>
          </div>
        `;
      }

      this.modalContent.innerHTML = `
        <div class="modal-header-row">
          <div>
            <span class="modal-title">🗺️ ${i18n.t('sectors_title')}</span>
            <div style="font-size: 12px; color: #facc15; font-weight: 800;">
              Total de Estrelas: ${totalStars} / 45 ★
            </div>
          </div>
          <button class="modal-close-btn" id="modal-close-x">✕</button>
        </div>
        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
          <button class="btn-primary-action" id="btn-toggle-boss-rush" style="flex: 1; padding: 8px; font-size: 13px; background: ${isBossRush ? 'linear-gradient(135deg, #ef4444, #991b1b)' : 'linear-gradient(135deg, #0284c7, #00f5ff)'}; color: #fff;">
            Modo: ${isBossRush ? '👹 BOSS RUSH (Invasão 60s)' : '⚡ MODO NORMAL'}
          </button>
        </div>
        <div class="sector-cards-grid" style="grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); max-height: 52vh; overflow-y: auto;">
          ${cardsHtml}
        </div>
      `;

      document.getElementById('modal-close-x').onclick = () => {
        sound.playButtonClick();
        this.closeModal();
      };

      const bossToggleBtn = document.getElementById('btn-toggle-boss-rush');
      if (bossToggleBtn) {
        bossToggleBtn.onclick = () => {
          sound.playButtonClick();
          if (this.callbacks.onToggleGameMode) {
            this.callbacks.onToggleGameMode();
          }
          render();
        };
      }

      this.modalContent.querySelectorAll('.sector-card:not(.locked)').forEach((card) => {
        card.onclick = () => {
          sound.playButtonClick();
          const secId = parseInt(card.getAttribute('data-sector'), 10);
          this.closeAll();
          if (this.callbacks.onSelectSector) {
            this.callbacks.onSelectSector(secId);
          }
        };
      });
    };

    render();
    this.modalStack.push({ type: 'sector_select', render });
    this.currentModal = 'sector_select';
    this.modalBackdrop.classList.remove('hidden');
    if (this.callbacks.onModalOpen) this.callbacks.onModalOpen();
  }

  // ── 7-DAY DAILY LOGIN REWARD MODAL (FIXED STATUS BUG) ──
  showDailyLoginModal() {
    const render = () => {
      const status = storage.getDailyLoginStatus();
      const rewards = [
        { day: 1, bits: 150, desc: '150 Bits' },
        { day: 2, bits: 250, desc: '250 Bits + Shield' },
        { day: 3, bits: 400, desc: '400 Bits' },
        { day: 4, bits: 600, desc: '600 Bits' },
        { day: 5, bits: 800, desc: '800 Bits' },
        { day: 6, bits: 1000, desc: '1000 Bits' },
        { day: 7, bits: 2000, desc: 'Solar Zenith Skin!' }
      ];

      let slotsHtml = '';
      rewards.forEach((r) => {
        const isClaimed = !status.canClaim ? (r.day <= status.currentDay) : (r.day < status.currentDay);
        const isReady = status.canClaim && (r.day === status.currentDay);

        slotsHtml += `
          <div class="daily-slot ${isClaimed ? 'claimed' : (isReady ? 'active' : '')}">
            <div style="font-size: 11px; font-weight: 800; color: #94a3b8;">DAY ${r.day}</div>
            <div style="font-size: 20px;">${r.day === 7 ? '👑' : '💎'}</div>
            <div style="font-size: 12px; font-weight: 900; color: #facc15;">${r.desc}</div>
            <div style="font-size: 10px; color: ${isClaimed ? '#10b981' : (isReady ? '#facc15' : '#64748b')};">
              ${isClaimed ? i18n.t('claimed') : (isReady ? 'READY!' : 'LOCKED')}
            </div>
          </div>
        `;
      });

      this.modalContent.innerHTML = `
        <div class="modal-header-row">
          <span class="modal-title">🎁 ${i18n.t('daily_title')}</span>
          <button class="modal-close-btn" id="modal-close-x">✕</button>
        </div>
        <div class="daily-grid">${slotsHtml}</div>
        <div class="modal-buttons-row">
          ${status.canClaim ? `
            <button class="btn-primary-action" id="btn-claim-daily">
              ${i18n.t('claim')} DAY ${status.currentDay} REWARD!
            </button>
          ` : `
            <div style="text-align: center; font-size: 13px; color: #94a3b8;">
              Next daily reward in ${status.hoursUntilNext}h!
            </div>
          `}
        </div>
      `;

      document.getElementById('modal-close-x').onclick = () => {
        sound.playButtonClick();
        this.closeModal();
      };

      const claimBtn = document.getElementById('btn-claim-daily');
      if (claimBtn) {
        claimBtn.onclick = () => {
          const reward = storage.claimDailyLogin();
          if (reward) {
            sound.playStarMilestone();
            this.updateBitsDisplay();
            render();
          }
        };
      }
    };

    render();
    this.modalStack.push({ type: 'daily_login', render });
    this.currentModal = 'daily_login';
    this.modalBackdrop.classList.remove('hidden');
    if (this.callbacks.onModalOpen) this.callbacks.onModalOpen();
  }

  // ── QUESTS MODAL (WITH 2X REWARDED AD BUTTON) ──
  showQuestsModal() {
    const render = () => {
      const q = storage.data.quests;
      const questsList = [
        { key: 'daily1', title: i18n.t('quest_daily_1'), cur: q.daily1.progress, target: q.daily1.target, reward: q.daily1.reward, claimed: q.daily1.claimed },
        { key: 'daily2', title: i18n.t('quest_daily_2'), cur: q.daily2.progress, target: q.daily2.target, reward: q.daily2.reward, claimed: q.daily2.claimed },
        { key: 'daily3', title: i18n.t('quest_daily_3'), cur: q.daily3.progress, target: q.daily3.target, reward: q.daily3.reward, claimed: q.daily3.claimed },
        { key: 'weekly1', title: i18n.t('quest_weekly_1'), cur: q.weekly1.progress, target: q.weekly1.target, reward: q.weekly1.reward, claimed: q.weekly1.claimed },
        { key: 'weekly2', title: i18n.t('quest_weekly_2'), cur: q.weekly2.progress, target: q.weekly2.target, reward: q.weekly2.reward, claimed: q.weekly2.claimed }
      ];

      let itemsHtml = '';
      questsList.forEach((item) => {
        const isComplete = item.cur >= item.target;
        itemsHtml += `
          <div class="quest-item">
            <div>
              <div class="quest-desc">${item.title}</div>
              <div class="quest-progress-text">${item.cur}/${item.target} • ${item.reward} Bits</div>
            </div>
            <div style="display: flex; gap: 6px; align-items: center;">
              ${item.claimed ? `
                <span style="font-size: 12px; color: #10b981; font-weight: 800;">✓ ${i18n.t('claimed')}</span>
              ` : (isComplete ? `
                <button class="btn-primary-action quest-claim-btn" data-quest="${item.key}" style="padding: 6px 10px; font-size: 12px;">
                  ${i18n.t('claim')}
                </button>
                <button class="btn-rewarded-ad quest-double-btn" data-quest="${item.key}" style="padding: 6px 10px; font-size: 12px;">
                  🎬 2X (AD)
                </button>
              ` : `
                <span style="font-size: 12px; color: #64748b; font-weight: 700;">${item.cur}/${item.target}</span>
              `)}
            </div>
          </div>
        `;
      });

      this.modalContent.innerHTML = `
        <div class="modal-header-row">
          <span class="modal-title">📜 ${i18n.t('quests_title')}</span>
          <button class="modal-close-btn" id="modal-close-x">✕</button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">${itemsHtml}</div>
      `;

      document.getElementById('modal-close-x').onclick = () => {
        sound.playButtonClick();
        this.closeModal();
      };

      this.modalContent.querySelectorAll('.quest-claim-btn').forEach((btn) => {
        btn.onclick = () => {
          const key = btn.getAttribute('data-quest');
          storage.claimQuest(key, 1);
          sound.playCollectOrb();
          this.updateBitsDisplay();
          render();
        };
      });

      this.modalContent.querySelectorAll('.quest-double-btn').forEach((btn) => {
        btn.onclick = () => {
          const key = btn.getAttribute('data-quest');
          crazyGames.requestRewardedAd(() => {
            storage.claimQuest(key, 2);
            sound.playStarMilestone();
            this.updateBitsDisplay();
            render();
          });
        };
      });
    };

    render();
    this.modalStack.push({ type: 'quests', render });
    this.currentModal = 'quests';
    this.modalBackdrop.classList.remove('hidden');
    if (this.callbacks.onModalOpen) this.callbacks.onModalOpen();
  }

  // ── META-SHOP MODAL (UPGRADES, SKINS & TRAILS) ──
  showShopModal() {
    let currentTab = 'upgrades';

    const render = () => {
      let contentHtml = '';

      if (currentTab === 'upgrades') {
        const upgrades = [
          { key: 'speed', title: i18n.t('speed_upgrade'), icon: '⚡' },
          { key: 'dash', title: i18n.t('dash_upgrade'), icon: '💨' },
          { key: 'shield', title: i18n.t('shield_upgrade'), icon: '🛡️' },
          { key: 'magnet', title: i18n.t('magnet_upgrade'), icon: '🧲' }
        ];

        upgrades.forEach((u) => {
          const lvl = storage.data.upgrades[u.key] || 1;
          const isMax = lvl >= 5;
          const cost = storage.getUpgradeCost(u.key);
          const canAfford = storage.data.bits >= cost;

          contentHtml += `
            <div class="quest-item">
              <div>
                <div class="quest-desc">${u.icon} ${u.title} (Lv. ${lvl}/5)</div>
                <div class="quest-progress-text">${isMax ? 'MAX' : `${cost} Bits 💎`}</div>
              </div>
              <div>
                ${isMax ? `
                  <span style="color: #facc15; font-size: 12px; font-weight: 800;">MAX</span>
                ` : `
                  <button class="btn-primary-action btn-buy-upgrade ${!canAfford ? 'locked' : ''}" data-type="${u.key}" style="padding: 6px 12px; font-size: 13px;">
                    ${i18n.t('buy')}
                  </button>
                `}
              </div>
            </div>
          `;
        });
      } else if (currentTab === 'skins') {
        const skins = [
          { id: 'classic', title: i18n.t('skin_classic'), cost: 0, icon: '🟦' },
          { id: 'purple', title: i18n.t('skin_purple'), cost: 600, icon: '🟪' },
          { id: 'gold', title: i18n.t('skin_gold'), cost: 1200, icon: '🟨' },
          { id: 'emerald', title: i18n.t('skin_emerald'), cost: 1800, icon: '🟩' }
        ];

        skins.forEach((s) => {
          const isUnlocked = storage.data.skins.unlocked.includes(s.id);
          const isEquipped = storage.data.skins.equipped === s.id;
          const canAfford = storage.data.bits >= s.cost;

          contentHtml += `
            <div class="quest-item">
              <div>
                <div class="quest-desc">${s.icon} ${s.title}</div>
                <div class="quest-progress-text">${isUnlocked ? 'UNLOCKED' : `${s.cost} Bits 💎`}</div>
              </div>
              <div>
                ${isEquipped ? `
                  <span style="color: #00f5ff; font-size: 12px; font-weight: 800;">✓ ${i18n.t('equipped')}</span>
                ` : (isUnlocked ? `
                  <button class="btn-primary-action btn-equip-skin" data-skin="${s.id}" style="padding: 6px 12px; font-size: 12px;">
                    ${i18n.t('equip')}
                  </button>
                ` : `
                  <button class="btn-primary-action btn-buy-skin ${!canAfford ? 'locked' : ''}" data-skin="${s.id}" data-cost="${s.cost}" style="padding: 6px 12px; font-size: 12px;">
                    ${i18n.t('buy')}
                  </button>
                `)}
              </div>
            </div>
          `;
        });
      } else if (currentTab === 'trails') {
        const trails = [
          { id: 'cyan', title: i18n.t('trail_cyan'), cost: 0, icon: '💠' },
          { id: 'magenta', title: i18n.t('trail_magenta'), cost: 400, icon: '✨' },
          { id: 'gold', title: i18n.t('trail_gold'), cost: 800, icon: '⚡' },
          { id: 'green', title: i18n.t('trail_green'), cost: 1200, icon: '✳️' }
        ];

        trails.forEach((t) => {
          const isUnlocked = storage.data.trails.unlocked.includes(t.id);
          const isEquipped = storage.data.trails.equipped === t.id;
          const canAfford = storage.data.bits >= t.cost;

          contentHtml += `
            <div class="quest-item">
              <div>
                <div class="quest-desc">${t.icon} ${t.title}</div>
                <div class="quest-progress-text">${isUnlocked ? 'UNLOCKED' : `${t.cost} Bits 💎`}</div>
              </div>
              <div>
                ${isEquipped ? `
                  <span style="color: #00f5ff; font-size: 12px; font-weight: 800;">✓ ${i18n.t('equipped')}</span>
                ` : (isUnlocked ? `
                  <button class="btn-primary-action btn-equip-trail" data-trail="${t.id}" style="padding: 6px 12px; font-size: 12px;">
                    ${i18n.t('equip')}
                  </button>
                ` : `
                  <button class="btn-primary-action btn-buy-trail ${!canAfford ? 'locked' : ''}" data-trail="${t.id}" data-cost="${t.cost}" style="padding: 6px 12px; font-size: 12px;">
                    ${i18n.t('buy')}
                  </button>
                `)}
              </div>
            </div>
          `;
        });
      }

      this.modalContent.innerHTML = `
        <div class="modal-header-row">
          <span class="modal-title">🛍️ ${i18n.t('shop_title')}</span>
          <button class="modal-close-btn" id="modal-close-x">✕</button>
        </div>
        <div style="display: flex; gap: 8px; margin-bottom: 6px;">
          <button class="drawer-btn ${currentTab === 'upgrades' ? 'active-tab' : ''}" id="tab-upgrades" style="flex: 1; text-align: center;">⚡ UPGRADES</button>
          <button class="drawer-btn ${currentTab === 'skins' ? 'active-tab' : ''}" id="tab-skins" style="flex: 1; text-align: center;">🎽 SKINS</button>
          <button class="drawer-btn ${currentTab === 'trails' ? 'active-tab' : ''}" id="tab-trails" style="flex: 1; text-align: center;">💫 TRAILS</button>
        </div>
        <div style="font-size: 14px; font-weight: 800; color: #facc15; margin-bottom: 6px;">
          Balance: ${storage.data.bits} Quantum Bits 💎
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">${contentHtml}</div>
      `;

      document.getElementById('modal-close-x').onclick = () => {
        sound.playButtonClick();
        this.closeModal();
      };

      document.getElementById('tab-upgrades').onclick = () => { currentTab = 'upgrades'; render(); };
      document.getElementById('tab-skins').onclick = () => { currentTab = 'skins'; render(); };
      document.getElementById('tab-trails').onclick = () => { currentTab = 'trails'; render(); };

      // Upgrades listeners
      this.modalContent.querySelectorAll('.btn-buy-upgrade').forEach((btn) => {
        btn.onclick = () => {
          const type = btn.getAttribute('data-type');
          if (storage.buyUpgrade(type)) {
            sound.playStarMilestone();
            this.updateBitsDisplay();
            render();
          }
        };
      });

      // Skins listeners
      this.modalContent.querySelectorAll('.btn-buy-skin').forEach((btn) => {
        btn.onclick = () => {
          const id = btn.getAttribute('data-skin');
          const cost = parseInt(btn.getAttribute('data-cost'), 10);
          if (storage.buySkin(id, cost)) {
            sound.playStarMilestone();
            this.updateBitsDisplay();
            render();
          }
        };
      });

      this.modalContent.querySelectorAll('.btn-equip-skin').forEach((btn) => {
        btn.onclick = () => {
          const id = btn.getAttribute('data-skin');
          storage.equipSkin(id);
          sound.playButtonClick();
          render();
        };
      });

      // Trails listeners
      this.modalContent.querySelectorAll('.btn-buy-trail').forEach((btn) => {
        btn.onclick = () => {
          const id = btn.getAttribute('data-trail');
          const cost = parseInt(btn.getAttribute('data-cost'), 10);
          if (storage.buyTrail(id, cost)) {
            sound.playStarMilestone();
            this.updateBitsDisplay();
            render();
          }
        };
      });

      this.modalContent.querySelectorAll('.btn-equip-trail').forEach((btn) => {
        btn.onclick = () => {
          const id = btn.getAttribute('data-trail');
          storage.equipTrail(id);
          sound.playButtonClick();
          render();
        };
      });
    };

    render();
    this.modalStack.push({ type: 'shop', render });
    this.currentModal = 'shop';
    this.modalBackdrop.classList.remove('hidden');
    if (this.callbacks.onModalOpen) this.callbacks.onModalOpen();
  }

  // ── LUCKY SPIN WHEEL MODAL ──
  showLuckySpinModal() {
    const render = () => {
      const status = storage.getLuckySpinStatus();
      const prizes = [100, 200, 50, 350, 500, 150, 750, 1500];

      this.modalContent.innerHTML = `
        <div class="modal-header-row">
          <span class="modal-title">🎰 ${i18n.t('spin_title')}</span>
          <button class="modal-close-btn" id="modal-close-x">✕</button>
        </div>
        <div class="spin-wrap">
          <canvas id="wheel-canvas" class="spin-wheel-canvas" width="240" height="240"></canvas>
        </div>
        <div id="spin-win-msg" style="text-align: center; font-size: 15px; font-weight: 800; color: #facc15; min-height: 20px;"></div>
        <div class="modal-buttons-row">
          ${status.canFreeSpin ? `
            <button class="btn-primary-action" id="btn-spin-action">
              ${i18n.t('spin_free')}
            </button>
          ` : `
            <div style="text-align: center; font-size: 13px; color: #94a3b8;">
              ${i18n.t('spin_wait')} ${status.hoursLeft}h
            </div>
            <button class="btn-rewarded-ad" id="btn-spin-ad">
              🎬 ${i18n.t('spin_ad')}
            </button>
          `}
        </div>
      `;

      const wCanvas = document.getElementById('wheel-canvas');
      const wCtx = wCanvas.getContext('2d');
      let currentAngle = 0;

      const drawWheel = (angle) => {
        const numSlices = prizes.length;
        const sliceAngle = (Math.PI * 2) / numSlices;
        wCtx.clearRect(0, 0, 240, 240);

        wCtx.save();
        wCtx.translate(120, 120);
        wCtx.rotate(angle);

        for (let i = 0; i < numSlices; i++) {
          wCtx.beginPath();
          wCtx.moveTo(0, 0);
          wCtx.arc(0, 0, 115, i * sliceAngle, (i + 1) * sliceAngle);
          wCtx.closePath();
          wCtx.fillStyle = i % 2 === 0 ? '#0284c7' : '#0369a1';
          wCtx.fill();
          wCtx.strokeStyle = '#00f5ff';
          wCtx.lineWidth = 1.5;
          wCtx.stroke();

          wCtx.save();
          wCtx.rotate(i * sliceAngle + sliceAngle * 0.5);
          wCtx.textAlign = 'right';
          wCtx.fillStyle = '#fff';
          wCtx.font = '800 13px "Rajdhani", sans-serif';
          wCtx.fillText(`${prizes[i]} 💎`, 105, 5);
          wCtx.restore();
        }
        wCtx.restore();

        wCtx.fillStyle = '#facc15';
        wCtx.beginPath();
        wCtx.moveTo(120, 15);
        wCtx.lineTo(110, 0);
        wCtx.lineTo(130, 0);
        wCtx.closePath();
        wCtx.fill();
      };

      drawWheel(0);

      const spinAction = (isFree) => {
        let speed = 25 + Math.random() * 15;
        const friction = 0.985;

        const animateSpin = () => {
          currentAngle += speed * 0.016;
          speed *= friction;
          sound.playSpinTick();
          drawWheel(currentAngle);

          if (speed > 0.3) {
            requestAnimationFrame(animateSpin);
          } else {
            const normAngle = (Math.PI * 2 - (currentAngle % (Math.PI * 2))) % (Math.PI * 2);
            const prizeIndex = Math.floor(normAngle / ((Math.PI * 2) / prizes.length)) % prizes.length;
            const prize = prizes[prizeIndex];

            sound.playStarMilestone();
            storage.recordLuckySpin(prize, isFree);
            this.updateBitsDisplay();

            const winEl = document.getElementById('spin-win-msg');
            if (winEl) winEl.textContent = `🎉 +${prize} Quantum Bits!`;
            setTimeout(() => {
              render();
            }, 1200);
          }
        };

        requestAnimationFrame(animateSpin);
      };

      document.getElementById('modal-close-x').onclick = () => {
        sound.playButtonClick();
        this.closeModal();
      };

      const freeBtn = document.getElementById('btn-spin-action');
      if (freeBtn) {
        freeBtn.onclick = () => {
          freeBtn.disabled = true;
          spinAction(true);
        };
      }

      const adBtn = document.getElementById('btn-spin-ad');
      if (adBtn) {
        adBtn.onclick = () => {
          adBtn.disabled = true;
          crazyGames.requestRewardedAd(() => {
            spinAction(false);
          }, () => {
            adBtn.disabled = false;
          });
        };
      }
    };

    render();
    this.modalStack.push({ type: 'lucky_spin', render });
    this.currentModal = 'lucky_spin';
    this.modalBackdrop.classList.remove('hidden');
    if (this.callbacks.onModalOpen) this.callbacks.onModalOpen();
  }

  // ── VICTORY MODAL ──
  showVictoryModal(data) {
    const { sector, stars, time, score, bitsEarned, onNext, onRetry } = data;
    const render = () => {
      const starsIcons = [1, 2, 3].map(s => `
        <span class="${s <= stars ? 'star-glow' : 'star-dim'}">★</span>
      `).join('');

      this.modalContent.innerHTML = `
        <div class="modal-header-row">
          <span class="modal-title">🏆 ${i18n.t('victory')}</span>
        </div>
        <div class="modal-stars-row">${starsIcons}</div>
        <p style="text-align: center; color: #94a3b8; font-size: 14px;">
          ${i18n.t('victory_desc')}
        </p>
        <div class="modal-stats-box">
          <div>⏱ ${Math.round(time * 10) / 10}s</div>
          <div>💎 +${bitsEarned} Bits</div>
          <div>⚡ ${score} Pts</div>
        </div>
        <div class="modal-buttons-row">
          <button class="btn-rewarded-ad" id="btn-double-victory-reward">
            ${i18n.t('double_rewards')}
          </button>
          <button class="btn-primary-action" id="btn-next-sector">
            ${i18n.t('next_sector')}
          </button>
          <button class="btn-secondary-action" id="btn-retry-victory">
            ${i18n.t('retry')}
          </button>
        </div>
      `;

      const btnNext = document.getElementById('btn-next-sector');
      if (btnNext) {
        btnNext.onclick = () => {
          sound.playButtonClick();
          this.closeAll();
          if (onNext) onNext();
        };
      }

      const btnRetry = document.getElementById('btn-retry-victory');
      if (btnRetry) {
        btnRetry.onclick = () => {
          sound.playButtonClick();
          this.closeAll();
          if (onRetry) onRetry();
        };
      }

      const doubleBtn = document.getElementById('btn-double-victory-reward');
      if (doubleBtn) {
        doubleBtn.onclick = () => {
          doubleBtn.disabled = true;
          crazyGames.requestRewardedAd(() => {
            storage.data.bits += bitsEarned;
            storage.save();
            this.updateBitsDisplay();
            doubleBtn.textContent = '✓ 2X GRANTED!';
            doubleBtn.style.background = '#10b981';
            sound.playStarMilestone();
          }, () => {
            doubleBtn.disabled = false;
          });
        };
      }
    };

    try {
      render();
      this.modalStack.push({ type: 'victory', render });
      this.currentModal = 'victory';
      if (this.modalBackdrop) this.modalBackdrop.classList.remove('hidden');
      if (this.callbacks.onModalOpen) this.callbacks.onModalOpen();
    } catch (err) {
      console.error('[GameHUD] showVictoryModal error:', err);
    }
  }

  // ── DEFEAT MODAL ──
  showDefeatModal(data) {
    const { sector, onRetry, onRevive, canRevive } = data;
    const render = () => {
      this.modalContent.innerHTML = `
        <div class="modal-header-row">
          <span class="modal-title" style="color: #ef4444;">💀 ${i18n.t('defeat')}</span>
        </div>
        <p style="text-align: center; color: #94a3b8; font-size: 14px; margin: 10px 0;">
          ${i18n.t('defeat_desc')}
        </p>
        <div class="modal-buttons-row">
          ${canRevive ? `
            <button class="btn-rewarded-ad" id="btn-revive-shield">
              ${i18n.t('revive_shield')}
            </button>
          ` : ''}
          <button class="btn-primary-action" id="btn-retry-defeat">
            ${i18n.t('retry')}
          </button>
          <button class="btn-secondary-action" id="btn-select-defeat">
            ${i18n.t('sectors_title')}
          </button>
        </div>
      `;

      const btnRetry = document.getElementById('btn-retry-defeat');
      if (btnRetry) {
        btnRetry.onclick = () => {
          sound.playButtonClick();
          this.closeAll();
          if (onRetry) onRetry();
        };
      }

      const btnSelect = document.getElementById('btn-select-defeat');
      if (btnSelect) {
        btnSelect.onclick = () => {
          sound.playButtonClick();
          this.showSectorSelectModal();
        };
      }

      const reviveBtn = document.getElementById('btn-revive-shield');
      if (reviveBtn) {
        reviveBtn.onclick = () => {
          reviveBtn.disabled = true;
          crazyGames.requestRewardedAd(() => {
            this.closeAll();
            if (onRevive) onRevive();
          }, () => {
            reviveBtn.disabled = false;
          });
        };
      }
    };

    try {
      render();
      this.modalStack.push({ type: 'defeat', render });
      this.currentModal = 'defeat';
      if (this.modalBackdrop) this.modalBackdrop.classList.remove('hidden');
      if (this.callbacks.onModalOpen) this.callbacks.onModalOpen();
    } catch (err) {
      console.error('[GameHUD] showDefeatModal error:', err);
    }
  }

  // ── PAUSE MODAL ──
  showPauseModal() {
    const render = () => {
      this.modalContent.innerHTML = `
        <div class="modal-header-row">
          <span class="modal-title">⏸ ${i18n.t('pause_title')}</span>
          <button class="modal-close-btn" id="modal-close-x">✕</button>
        </div>
        <div class="modal-buttons-row">
          <button class="btn-primary-action" id="btn-resume-game">
            ${i18n.t('resume')}
          </button>
          <button class="btn-secondary-action" id="btn-restart-game">
            ${i18n.t('restart')}
          </button>
          <button class="btn-secondary-action" id="btn-sectors-from-pause">
            ${i18n.t('sectors_title')}
          </button>
        </div>
      `;

      document.getElementById('modal-close-x').onclick = () => {
        sound.playButtonClick();
        this.closeModal();
      };

      document.getElementById('btn-resume-game').onclick = () => {
        sound.playButtonClick();
        this.closeModal();
      };

      document.getElementById('btn-restart-game').onclick = () => {
        sound.playButtonClick();
        this.closeAll();
        if (this.callbacks.onRestartLevel) this.callbacks.onRestartLevel();
      };

      document.getElementById('btn-sectors-from-pause').onclick = () => {
        sound.playButtonClick();
        this.showSectorSelectModal();
      };
    };

    render();
    this.modalStack.push({ type: 'pause', render });
    this.currentModal = 'pause';
    this.modalBackdrop.classList.remove('hidden');
    if (this.callbacks.onModalOpen) this.callbacks.onModalOpen();
  }
}

export default GameHUD;
