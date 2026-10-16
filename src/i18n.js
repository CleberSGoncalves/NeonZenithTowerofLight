/**
 * @fileoverview Internationalization (i18n) Module
 * English (default for CrazyGames) and Portuguese (PT-BR auto-detect)
 */

class I18nManager {
  constructor() {
    this.locale = 'en';
    this.detectLocale();

    this.translations = {
      en: {
        game_title: 'Neon Zenith: Tower of Light',
        tagline: '3D Cyberpunk Parkour Obby',
        lore_act1_title: 'Imminent Digital Collapse',
        lore_act1_desc: 'In a vertical megacity where ground level is forgotten, elite runners must scale quantum data spires to restore the central power grid before total network collapse.',
        play_now: 'START ASCENT ➔',
        skip_story: 'SKIP STORY',
        sector: 'SECTOR',
        score: 'SCORE',
        time: 'TIME',
        bits: 'BITS',
        ascend: 'Ascend',
        par_time: 'Par Time',
        all_orbs: 'All Orbs',
        clear_sector_btn: '✅ FINISH SECTOR (★) ➔',
        victory: 'ZENITH CORE RESTORED!',
        victory_desc: 'Quantum energy flowing smoothly to the central grid.',
        defeat: 'CARRIER SIGNAL LOST',
        defeat_desc: 'The runner dissolved into the cyber abyss.',
        retry: 'RETRY SECTOR',
        next_sector: 'NEXT SECTOR ➔',
        revive_shield: '🛡️ REVIVE WITH SHIELD (AD)',
        double_rewards: '✨ DOUBLE BITS 2X (AD)',
        sectors_title: 'MAP: QUANTUM SPIRES',
        shop_title: 'CYBERNETIC META-SHOP',
        spin_title: 'LUCKY QUANTUM WHEEL',
        daily_title: '7-DAY LOGIN REWARDS',
        quests_title: 'ENERGY QUESTS',
        pause_title: 'SYSTEM PAUSED',
        resume: 'RESUME ASCENT',
        restart: 'RESTART LEVEL',
        sound: 'SOUND',
        language: 'LANGUAGE',
        claim: 'CLAIM',
        claimed: 'CLAIMED',
        spin_free: 'SPIN FOR FREE',
        spin_ad: 'EXTRA SPIN (AD)',
        spin_wait: 'NEXT FREE SPIN IN:',
        buy: 'BUY',
        equipped: 'EQUIPPED',
        equip: 'EQUIP',
        locked: 'LOCKED',
        speed_upgrade: 'Sprint Overdrive',
        dash_upgrade: 'Air Dash Warp',
        shield_upgrade: 'Quantum Barrier',
        magnet_upgrade: 'Data Magnet',
        skin_classic: 'Neon Zenith (Cyan)',
        skin_purple: 'Cyber Phantasm',
        skin_gold: 'Solar Zenith',
        skin_emerald: 'Void Matrix',
        trail_cyan: 'Photon Stream',
        trail_magenta: 'Plasma Wake',
        trail_gold: 'Solar Trail',
        trail_green: 'Matrix Binary',
        quest_daily_1: 'Ascend 2 Spires',
        quest_daily_2: 'Perform 12 Air Dashes',
        quest_daily_3: 'Collect 25 Data Orbs',
        quest_weekly_1: 'Earn 15 Total Stars',
        quest_weekly_2: 'Ascend 5 Sectors without falling'
      },
      pt: {
        game_title: 'Neon Zenith: Tower of Light',
        tagline: 'Parkour 3D / Obby Cyberpunk',
        lore_act1_title: 'Colapso Digital Iminente',
        lore_act1_desc: 'Em uma megalópole vertical onde o solo foi esquecido, corredores de elite escalam torres de dados quânticos para restaurar o fluxo de energia da rede central antes do colapso digital.',
        play_now: 'INICIAR ESCALADA ➔',
        skip_story: 'PULAR HISTÓRIA',
        sector: 'SETOR',
        score: 'PONTOS',
        time: 'TEMPO',
        bits: 'BITS',
        ascend: 'Subida',
        par_time: 'Tempo Alvo',
        all_orbs: 'Todos Orbes',
        clear_sector_btn: '✅ CONCLUIR FASE (★) ➔',
        victory: 'NÚCLEO ZENITH RESTAURADO!',
        victory_desc: 'Energia quântica restabelecida com sucesso na rede central.',
        defeat: 'SINAL DISSIPADO NO ABISMO',
        defeat_desc: 'O corredor desintegrou no fluxo do abismo digital.',
        retry: 'TENTAR NOVAMENTE',
        next_sector: 'PRÓXIMO SETOR ➔',
        revive_shield: '🛡️ REVIVER COM ESCUDO (AD)',
        double_rewards: '✨ DOBRAR BITS 2X (AD)',
        sectors_title: 'MAPA: TORRES QUÂNTICAS',
        shop_title: 'LOJA CIBERNÉTICA',
        spin_title: 'ROLETA DA SORTE',
        daily_title: 'RECOMPENSAS DIÁRIAS (7 DIAS)',
        quests_title: 'MISSÕES DE ENERGIA',
        pause_title: 'SISTEMA PAUSADO',
        resume: 'CONTINUAR ESCALADA',
        restart: 'REINICIAR FASE',
        sound: 'ÁUDIO',
        language: 'IDIOMA',
        claim: 'COLETAR',
        claimed: 'COLETADO',
        spin_free: 'GIRAR GRÁTIS',
        spin_ad: 'GIRO EXTRA (AD)',
        spin_wait: 'PRÓXIMO GIRO EM:',
        buy: 'COMPRAR',
        equipped: 'EQUIPADO',
        equip: 'EQUIPAR',
        locked: 'BLOQUEADO',
        speed_upgrade: 'Super Velocidade',
        dash_upgrade: 'Alcance do Air Dash',
        shield_upgrade: 'Barreira Quântica',
        magnet_upgrade: 'Ímã de Dados',
        skin_classic: 'Neon Zenith (Ciano)',
        skin_purple: 'Fantasma Cibernético',
        skin_gold: 'Zenith Solar',
        skin_emerald: 'Matriz do Vazio',
        trail_cyan: 'Rastro de Fótons',
        trail_magenta: 'Rastro de Plasma',
        trail_gold: 'Rastro Solar',
        trail_green: 'Rastro Binário',
        quest_daily_1: 'Completar 2 Setores',
        quest_daily_2: 'Executar 12 Air Dashes',
        quest_daily_3: 'Coletar 25 Orbes de Dados',
        quest_weekly_1: 'Acumular 15 Estrelas no Total',
        quest_weekly_2: 'Subir 5 Setores sem cair'
      }
    };
  }

  detectLocale() {
    try {
      const saved = localStorage.getItem('NEON_ZENITH_LOCALE');
      if (saved && (saved === 'pt' || saved === 'en')) {
        this.locale = saved;
        return;
      }
      const navLang = navigator.language || navigator.userLanguage || 'en';
      if (navLang.toLowerCase().startsWith('pt')) {
        this.locale = 'pt';
      } else {
        this.locale = 'en';
      }
    } catch {
      this.locale = 'en';
    }
  }

  setLocale(loc) {
    if (loc === 'pt' || loc === 'en') {
      this.locale = loc;
      try {
        localStorage.setItem('NEON_ZENITH_LOCALE', loc);
      } catch {}
    }
  }

  toggleLocale() {
    this.setLocale(this.locale === 'en' ? 'pt' : 'en');
    return this.locale;
  }

  t(key) {
    const dict = this.translations[this.locale] || this.translations.en;
    return dict[key] || this.translations.en[key] || key;
  }
}

export const i18n = new I18nManager();
export default i18n;
