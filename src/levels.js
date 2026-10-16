/**
 * @fileoverview 15 Master Progressive Parkour Sectors for Neon Zenith: Tower of Light
 * Designed for 3-Star Mastery:
 * Star 1: Reach the Summit Core / Finish Sector
 * Star 2: Beat Par Time (Speedrunner)
 * Star 3: Collect 100% of Data Orbs
 */

export function generateSectors() {
  const sectors = [];

  const sectorConfigs = [
    { id: 1, name: 'Nexus Ascent', parTime: 22, orbCount: 5, difficulty: 'Easy' },
    { id: 2, name: 'Quantum Conduit', parTime: 26, orbCount: 6, difficulty: 'Easy' },
    { id: 3, name: 'Firewall Alpha', parTime: 28, orbCount: 7, difficulty: 'Normal' },
    { id: 4, name: 'Byte Decay', parTime: 30, orbCount: 6, difficulty: 'Normal' },
    { id: 5, name: 'Kinetic Apex', parTime: 28, orbCount: 8, difficulty: 'Normal' },
    { id: 6, name: 'Binary Chasm', parTime: 32, orbCount: 7, difficulty: 'Challenging' },
    { id: 7, name: 'Optical Spine', parTime: 35, orbCount: 8, difficulty: 'Challenging' },
    { id: 8, name: 'Matrix Cascade', parTime: 38, orbCount: 8, difficulty: 'Challenging' },
    { id: 9, name: 'Cyber Stratosphere', parTime: 40, orbCount: 9, difficulty: 'Hard' },
    { id: 10, name: 'Graviton Relay', parTime: 42, orbCount: 9, difficulty: 'Hard' },
    { id: 11, name: 'Firewall Omega', parTime: 44, orbCount: 10, difficulty: 'Hard' },
    { id: 12, name: 'Zenith Monolith', parTime: 46, orbCount: 10, difficulty: 'Expert' },
    { id: 13, name: 'Neon Singularity', parTime: 48, orbCount: 11, difficulty: 'Expert' },
    { id: 14, name: 'Overdrive Spire', parTime: 50, orbCount: 12, difficulty: 'Master' },
    { id: 15, name: 'The Zenith Core', parTime: 55, orbCount: 15, difficulty: 'Master' }
  ];

  sectorConfigs.forEach((cfg) => {
    const platforms = [];
    const jumpPads = [];
    const lasers = [];
    const orbs = [];

    // Starting ground platform
    platforms.push({
      x: 0,
      y: 0,
      z: 0,
      w: 160,
      h: 22,
      depth: 60,
      type: 'solid'
    });

    // Generate vertical climb stages
    const totalTiers = 7 + Math.floor(cfg.id * 0.6);
    let currentY = 0;
    let currentX = 0;

    for (let tier = 1; tier <= totalTiers; tier++) {
      const stepY = -95 - (tier % 2 === 0 ? 25 : 10);
      currentY += stepY;

      // Alternate left and right climbing paths
      const dir = (tier % 2 === 1) ? 1 : -1;
      const stepX = dir * (100 + (tier % 3) * 20);
      currentX += stepX;

      // Platform type variations according to sector theme
      let pType = 'solid';
      let moveRangeX = 0;
      let moveSpeedX = 0;
      let moveRangeY = 0;
      let moveSpeedY = 0;

      if (cfg.id >= 2 && tier % 3 === 0) {
        // Moving platform
        pType = 'moving';
        moveRangeX = 60;
        moveSpeedX = 65;
      } else if (cfg.id >= 4 && tier % 4 === 2) {
        // Disintegrating decay block
        pType = 'decay';
      }

      const platW = Math.max(70, 110 - tier * 2);
      platforms.push({
        x: currentX,
        y: currentY,
        z: (tier % 2) * 20,
        startX: currentX,
        startY: currentY,
        w: platW,
        h: 18,
        depth: 45,
        type: pType,
        decayTimer: 0,
        moveRangeX,
        moveSpeedX,
        moveRangeY,
        moveSpeedY,
        vx: moveSpeedX,
        vy: moveSpeedY
      });

      // Jump Pads on intermediate tiers
      if (cfg.id >= 5 && tier === 3) {
        jumpPads.push({
          x: currentX,
          y: currentY - 10,
          z: (tier % 2) * 20,
          impulse: 920
        });
      }

      // Lasers on intermediate obstacles
      if (cfg.id >= 3 && tier % 3 === 1 && tier > 1) {
        lasers.push({
          x1: currentX - platW * 0.5 - 20,
          y1: currentY - 45,
          z1: 0,
          x2: currentX + platW * 0.5 + 20,
          y2: currentY - 45,
          z2: 0,
          active: true,
          cycleTimer: 0,
          cycleDuration: 2.2
        });
      }

      // Data Orbs placed along the climb
      if (orbs.length < cfg.orbCount) {
        orbs.push({
          id: orbs.length + 1,
          x: currentX,
          y: currentY - 40,
          z: (tier % 2) * 20,
          collected: false
        });
      }
    }

    // Summit Quantum Core Platform
    const summitY = currentY - 110;
    const summitX = currentX;
    platforms.push({
      x: summitX,
      y: summitY,
      z: 0,
      w: 140,
      h: 24,
      depth: 60,
      type: 'solid'
    });

    const summitCore = {
      x: summitX,
      y: summitY - 55,
      z: 0
    };

    sectors.push({
      id: cfg.id,
      name: cfg.name,
      parTime: cfg.parTime,
      difficulty: cfg.difficulty,
      spawn: { x: 0, y: -25, z: 0 },
      deathY: 150, // Fall threshold below start
      platforms,
      jumpPads,
      lasers,
      orbs,
      summitCore
    });
  });

  return sectors;
}

export const sectors = generateSectors();
export default sectors;
