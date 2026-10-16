/**
 * @fileoverview Storage & Progression Manager for Neon Zenith: Tower of Light
 * Atomic, versioned persistence in localStorage.
 * Manages Currency, 15 Sectors & 3-Star records, 7-Day Login Rewards,
 * Daily & Weekly Quests (with 24h/7d reset), Meta-Shop upgrades/skins/trails,
 * and Lucky Spin (12h cooldown).
 */

const STORAGE_KEY = 'NEON_ZENITH_SAVE_V1';

class StorageManager {
  constructor() {
    this.data = this.load();
    this.ensureIntegrity();
  }

  getDefaults() {
    return {
      version: 1,
      bits: 200,
      highScore: 0,
      unlockedSector: 1,
      sectorStars: Array(16).fill(0), // index 1 to 15
      sectorBestTimes: Array(16).fill(9999),
      dailyLogin: {
        streak: 1,
        lastClaimTimestamp: 0,
        claimedToday: false
      },
      quests: {
        daily1: { progress: 0, target: 2, claimed: false, reward: 200 },
        daily2: { progress: 0, target: 12, claimed: false, reward: 150 },
        daily3: { progress: 0, target: 25, claimed: false, reward: 250 },
        weekly1: { progress: 0, target: 15, claimed: false, reward: 800 },
        weekly2: { progress: 0, target: 5, claimed: false, reward: 1000 },
        lastDailyReset: Date.now(),
        lastWeeklyReset: Date.now()
      },
      upgrades: {
        speed: 1,
        dash: 1,
        shield: 1,
        magnet: 1
      },
      skins: {
        unlocked: ['classic'],
        equipped: 'classic'
      },
      trails: {
        unlocked: ['cyan'],
        equipped: 'cyan'
      },
      luckySpin: {
        lastSpinTimestamp: 0
      },
      settings: {
        soundMuted: false,
        locale: 'en'
      }
    };
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[Storage] Corrupted savegame detected, migrating to defaults:', e);
    }
    return this.getDefaults();
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('[Storage] Failed to save to localStorage:', e);
    }
  }

  ensureIntegrity() {
    const defaults = this.getDefaults();
    if (typeof this.data.bits !== 'number' || isNaN(this.data.bits)) this.data.bits = defaults.bits;
    if (!Array.isArray(this.data.sectorStars)) this.data.sectorStars = defaults.sectorStars;
    if (!Array.isArray(this.data.sectorBestTimes)) this.data.sectorBestTimes = defaults.sectorBestTimes;
    if (!this.data.dailyLogin) this.data.dailyLogin = defaults.dailyLogin;
    if (!this.data.quests) this.data.quests = defaults.quests;
    if (!this.data.upgrades) this.data.upgrades = defaults.upgrades;
    if (!this.data.skins) this.data.skins = defaults.skins;
    if (!this.data.trails) this.data.trails = defaults.trails;
    if (!this.data.luckySpin) this.data.luckySpin = defaults.luckySpin;
    if (!this.data.settings) this.data.settings = defaults.settings;

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const weekMs = 7 * dayMs;

    // Check Daily Quests reset (24h)
    if (now - (this.data.quests.lastDailyReset || 0) > dayMs) {
      this.data.quests.daily1 = { progress: 0, target: 2, claimed: false, reward: 200 };
      this.data.quests.daily2 = { progress: 0, target: 12, claimed: false, reward: 150 };
      this.data.quests.daily3 = { progress: 0, target: 25, claimed: false, reward: 250 };
      this.data.quests.lastDailyReset = now;
      this.save();
    }

    // Check Weekly Quests reset (7 days)
    if (now - (this.data.quests.lastWeeklyReset || 0) > weekMs) {
      this.data.quests.weekly1 = { progress: 0, target: 15, claimed: false, reward: 800 };
      this.data.quests.weekly2 = { progress: 0, target: 5, claimed: false, reward: 1000 };
      this.data.quests.lastWeeklyReset = now;
      this.save();
    }
  }

  // ── SECTORS & PROGRESSION ──
  getUnlockedSector() {
    return this.data.unlockedSector || 1;
  }

  getSectorStars(sectorIndex) {
    return (this.data.sectorStars && this.data.sectorStars[sectorIndex]) || 0;
  }

  getTotalStars() {
    return this.data.sectorStars.reduce((sum, s) => sum + (s || 0), 0);
  }

  recordSectorClear(sectorIndex, starsEarned, timeSeconds, score, bitsEarned) {
    let isNewRecord = false;
    const currentStars = this.data.sectorStars[sectorIndex] || 0;
    if (starsEarned > currentStars) {
      this.data.sectorStars[sectorIndex] = starsEarned;
      isNewRecord = true;
    }

    const currentBest = this.data.sectorBestTimes[sectorIndex] || 9999;
    if (timeSeconds < currentBest) {
      this.data.sectorBestTimes[sectorIndex] = Math.round(timeSeconds * 10) / 10;
    }

    if (sectorIndex >= this.data.unlockedSector && sectorIndex < 15) {
      this.data.unlockedSector = sectorIndex + 1;
    }

    if (score > (this.data.highScore || 0)) {
      this.data.highScore = score;
    }
    this.data.bits += bitsEarned;

    // Track Quests
    this.addQuestProgress('daily1', 1);
    this.addQuestProgress('weekly2', 1);
    this.setQuestProgress('weekly1', this.getTotalStars());

    this.save();
    return { isNewRecord, totalStars: this.getTotalStars() };
  }

  // ── 7-DAY DAILY LOGIN REWARD ──
  getDailyLoginStatus() {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const lastClaim = this.data.dailyLogin.lastClaimTimestamp || 0;
    const elapsed = now - lastClaim;

    let canClaim = false;
    let currentDay = this.data.dailyLogin.streak || 1;

    if (lastClaim === 0) {
      canClaim = true;
      currentDay = 1;
    } else if (elapsed >= dayMs && elapsed < dayMs * 2) {
      // Consecutive login day
      canClaim = true;
      currentDay = (this.data.dailyLogin.streak % 7) + 1;
    } else if (elapsed >= dayMs * 2) {
      // Streak broken, reset to Day 1
      canClaim = true;
      currentDay = 1;
    } else {
      // Already claimed today
      canClaim = false;
    }

    const hoursUntilNext = canClaim ? 0 : Math.max(0, Math.ceil((dayMs - elapsed) / (1000 * 60 * 60)));

    return {
      canClaim,
      currentDay,
      streak: this.data.dailyLogin.streak,
      hoursUntilNext
    };
  }

  claimDailyLogin() {
    const status = this.getDailyLoginStatus();
    if (!status.canClaim) return null;

    const rewards = [
      { day: 1, bits: 150, desc: '150 Quantum Bits' },
      { day: 2, bits: 250, desc: '250 Bits + Shield Boost' },
      { day: 3, bits: 400, desc: '400 Quantum Bits' },
      { day: 4, bits: 600, desc: '600 Bits + Dash Overdrive' },
      { day: 5, bits: 800, desc: '800 Quantum Bits' },
      { day: 6, bits: 1000, desc: '1000 Quantum Bits' },
      { day: 7, bits: 2000, skin: 'gold', desc: '2000 Bits + Solar Zenith Skin!' }
    ];

    const reward = rewards[status.currentDay - 1];
    this.data.bits += reward.bits;
    if (reward.skin && !this.data.skins.unlocked.includes(reward.skin)) {
      this.data.skins.unlocked.push(reward.skin);
    }

    this.data.dailyLogin.streak = status.currentDay;
    this.data.dailyLogin.lastClaimTimestamp = Date.now();
    this.save();

    return reward;
  }

  // ── QUESTS ──
  addQuestProgress(questKey, amount) {
    if (this.data.quests && this.data.quests[questKey] && !this.data.quests[questKey].claimed) {
      this.data.quests[questKey].progress = Math.min(
        this.data.quests[questKey].target,
        this.data.quests[questKey].progress + amount
      );
      this.save();
    }
  }

  setQuestProgress(questKey, val) {
    if (this.data.quests && this.data.quests[questKey] && !this.data.quests[questKey].claimed) {
      this.data.quests[questKey].progress = Math.min(
        this.data.quests[questKey].target,
        val
      );
      this.save();
    }
  }

  claimQuest(questKey, multiplier = 1) {
    const q = this.data.quests[questKey];
    if (q && q.progress >= q.target && !q.claimed) {
      const rewardEarned = q.reward * multiplier;
      this.data.bits += rewardEarned;
      q.claimed = true;
      this.save();
      return rewardEarned;
    }
    return 0;
  }

  // ── LUCKY SPIN (12-HOUR COOLDOWN) ──
  getLuckySpinStatus() {
    const now = Date.now();
    const cooldownMs = 12 * 60 * 60 * 1000;
    const elapsed = now - (this.data.luckySpin.lastSpinTimestamp || 0);
    const canFreeSpin = elapsed >= cooldownMs;
    const hoursLeft = canFreeSpin ? 0 : Math.ceil((cooldownMs - elapsed) / (1000 * 60 * 60));
    return { canFreeSpin, hoursLeft };
  }

  recordLuckySpin(prizeBits, isFreeSpin = true) {
    this.data.bits += prizeBits;
    if (isFreeSpin) {
      this.data.luckySpin.lastSpinTimestamp = Date.now();
    }
    this.save();
  }

  // ── META-SHOP UPGRADES ──
  getUpgradeCost(type) {
    const lvl = this.data.upgrades[type] || 1;
    const baseCosts = { speed: 200, dash: 250, shield: 300, magnet: 200 };
    return Math.round((baseCosts[type] || 200) * Math.pow(1.6, lvl - 1));
  }

  buyUpgrade(type) {
    const currentLvl = this.data.upgrades[type] || 1;
    if (currentLvl >= 5) return false;
    const cost = this.getUpgradeCost(type);
    if (this.data.bits >= cost) {
      this.data.bits -= cost;
      this.data.upgrades[type] = currentLvl + 1;
      this.save();
      return true;
    }
    return false;
  }

  // ── SKINS & TRAILS ──
  buySkin(id, cost) {
    if (this.data.bits >= cost && !this.data.skins.unlocked.includes(id)) {
      this.data.bits -= cost;
      this.data.skins.unlocked.push(id);
      this.data.skins.equipped = id;
      this.save();
      return true;
    }
    return false;
  }

  equipSkin(id) {
    if (this.data.skins.unlocked.includes(id)) {
      this.data.skins.equipped = id;
      this.save();
      return true;
    }
    return false;
  }

  buyTrail(id, cost) {
    if (this.data.bits >= cost && !this.data.trails.unlocked.includes(id)) {
      this.data.bits -= cost;
      this.data.trails.unlocked.push(id);
      this.data.trails.equipped = id;
      this.save();
      return true;
    }
    return false;
  }

  equipTrail(id) {
    if (this.data.trails.unlocked.includes(id)) {
      this.data.trails.equipped = id;
      this.save();
      return true;
    }
    return false;
  }
}

export const storage = new StorageManager();
export default storage;
