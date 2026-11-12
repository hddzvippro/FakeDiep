/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TankDef, BarrelDef } from './types.ts';

// Streamlined XP Curve - Leveling up is 3.5x easier!
export const LEVEL_EXP_TABLE: number[] = [
  0,     // Lv 1
  5,     // Lv 2
  12,    // Lv 3
  22,    // Lv 4
  35,    // Lv 5
  50,    // Lv 6
  70,    // Lv 7
  95,    // Lv 8
  125,   // Lv 9
  160,   // Lv 10
  200,   // Lv 11
  250,   // Lv 12
  310,   // Lv 13
  380,   // Lv 14
  460,   // Lv 15 -> Tier 2 (Reach in ~2 squares or 1 triangle!)
  560,   // Lv 16
  680,   // Lv 17
  820,   // Lv 18
  980,   // Lv 19
  1160,  // Lv 20
  1360,  // Lv 21
  1580,  // Lv 22
  1820,  // Lv 23
  2080,  // Lv 24
  2360,  // Lv 25
  2660,  // Lv 26
  2980,  // Lv 27
  3320,  // Lv 28
  3680,  // Lv 29
  4100,  // Lv 30 -> Tier 3 (Reach in ~4 pentagons!)
  4600,  // Lv 31
  5200,  // Lv 32
  5900,  // Lv 33
  6700,  // Lv 34
  7600,  // Lv 35
  8600,  // Lv 36
  9700,  // Lv 37
  10900, // Lv 38
  12200, // Lv 39
  13600, // Lv 40
  15100, // Lv 41
  16700, // Lv 42
  18400, // Lv 43
  20200, // Lv 44
  22500, // Lv 45 -> Tier 4 (Fast max level, instant action!)
];

// Cấp cuối cùng của bảng kinh nghiệm cố định ở trên (không còn là giới hạn cấp độ nữa)
export const MAX_LEVEL = 45;

// ---- CẤP ĐỘ VÔ HẠN ----
// Sau cấp 45, mỗi cấp cần nhiều điểm hơn cấp trước 7% (cấp càng cao càng khó lên).
const POST_TABLE_BASE_STEP = 2300; // điểm cần thêm để lên cấp 46 (bằng bước cuối của bảng)
const POST_TABLE_GROWTH = 1.07;
const HARD_LEVEL_CAP = 5000; // chỉ để tránh tràn số, thực tế không ai chạm tới

/** Tổng điểm kinh nghiệm cần để đạt tới cấp `level`. */
export function getExpForLevel(level: number): number {
  if (level <= 1) return 0;
  const len = LEVEL_EXP_TABLE.length;
  if (level <= len) return LEVEL_EXP_TABLE[level - 1];
  const k = level - len;
  const extra = POST_TABLE_BASE_STEP * (Math.pow(POST_TABLE_GROWTH, k) - 1) / (POST_TABLE_GROWTH - 1);
  return LEVEL_EXP_TABLE[len - 1] + extra;
}

export function getLevelFromExp(exp: number): number {
  if (!(exp > 0)) return 1;
  const len = LEVEL_EXP_TABLE.length;
  const last = LEVEL_EXP_TABLE[len - 1];
  if (exp < last) {
    for (let i = len - 1; i >= 0; i--) {
      if (exp >= LEVEL_EXP_TABLE[i]) return i + 1;
    }
    return 1;
  }
  if (!Number.isFinite(exp)) return HARD_LEVEL_CAP;
  const k = Math.floor(
    Math.log(1 + ((exp - last) * (POST_TABLE_GROWTH - 1)) / POST_TABLE_BASE_STEP) / Math.log(POST_TABLE_GROWTH)
  );
  let level = Math.min(HARD_LEVEL_CAP, len + Math.max(0, k));
  // Chỉnh lại sai số làm tròn số thực
  while (level < HARD_LEVEL_CAP && getExpForLevel(level + 1) <= exp) level++;
  while (level > len && getExpForLevel(level) > exp) level--;
  return level;
}

export function getExpProgress(exp: number): { current: number; max: number; ratio: number } {
  const level = getLevelFromExp(exp);
  const currentLevelExp = getExpForLevel(level);
  const nextLevelExp = getExpForLevel(level + 1);
  const current = Math.max(0, exp - currentLevelExp);
  const max = Math.max(1, nextLevelExp - currentLevelExp);
  return { current, max, ratio: Math.min(1, Math.max(0, current / max)) };
}

/**
 * Hệ số kích thước xe tăng theo cấp: cứ lên 10 cấp thì to thêm 1.05 lần (nhân dồn).
 * Cấp 1-9: x1.0 | Cấp 10: x1.05 | Cấp 20: x1.1025 | Cấp 45: x1.2155 | Cấp 100: x1.63 ...
 */
export function getSizeScale(level: number): number {
  const tens = Math.floor(Math.max(1, level) / 10);
  return Math.pow(1.05, tens);
}

// Hàm tạo nòng súng nhanh với giá trị mặc định (dùng cho các xe tăng mới)
const B = (o: Partial<BarrelDef> = {}): BarrelDef => ({
  length: 42,
  width: 16,
  angleOffset: 0,
  offsetX: 0,
  offsetY: 0,
  reloadMultiplier: 1.0,
  recoil: 2.5,
  bulletSpeed: 10,
  bulletDamage: 12,
  bulletHealth: 14,
  bulletSize: 8,
  bulletLife: 2.5,
  spread: 0.05,
  type: 'bullet',
  ...o,
});

export const TANKS: Record<string, TankDef> = {
  // === TIER 1 ===
  basic: {
    id: 'basic',
    name: 'Basic Tank',
    tier: 1,
    upgradesTo: ['twin', 'sniper', 'machine_gun', 'flank_guard', 'pounder', 'director', 'trapper', 'smasher', 'auto_3'],
    description: 'The standard multi-purpose tank with balanced speed, firepower, and defense.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.0,
    barrels: [
      { length: 42, width: 18, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.0, recoil: 3.5, bulletSpeed: 10, bulletDamage: 14, bulletHealth: 15, bulletSize: 9, bulletLife: 2.5, spread: 0.04, type: 'bullet' },
    ],
  },

  // === TIER 2 ===
  twin: {
    id: 'twin',
    name: 'Twin',
    tier: 2,
    upgradesFrom: 'basic',
    upgradesTo: ['triplet_shot', 'double_twin', 'twin_flank'],
    description: 'Fires two streams of bullets in alternating succession.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.0,
    barrels: [
      { length: 42, width: 16, angleOffset: 0, offsetX: 0, offsetY: -10, reloadMultiplier: 1.0, recoil: 2.8, bulletSpeed: 10, bulletDamage: 11, bulletHealth: 13, bulletSize: 8, bulletLife: 2.5, spread: 0.05, delay: 0.0, type: 'bullet' },
      { length: 42, width: 16, angleOffset: 0, offsetX: 0, offsetY: 10, reloadMultiplier: 1.0, recoil: 2.8, bulletSpeed: 10, bulletDamage: 11, bulletHealth: 13, bulletSize: 8, bulletLife: 2.5, spread: 0.05, delay: 0.5, type: 'bullet' },
    ],
  },

  sniper: {
    id: 'sniper',
    name: 'Sniper',
    tier: 2,
    upgradesFrom: 'basic',
    upgradesTo: ['assassin', 'hunter', 'overseer', 'rifle'],
    description: 'High velocity and heavy penetration bullets with extended visual range.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.25,
    barrels: [
      { length: 55, width: 18, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.6, recoil: 5.5, bulletSpeed: 15, bulletDamage: 26, bulletHealth: 24, bulletSize: 9.5, bulletLife: 3.0, spread: 0.02, type: 'bullet' },
    ],
  },

  machine_gun: {
    id: 'machine_gun',
    name: 'Machine Gun',
    tier: 2,
    upgradesFrom: 'basic',
    upgradesTo: ['destroyer', 'gunner', 'sprayer', 'gatling', 'minigun'],
    description: 'Blasts out a rapid storm of bullets with widened cone of fire.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.0,
    barrels: [
      { length: 40, width: 26, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.52, recoil: 2.2, bulletSpeed: 9.5, bulletDamage: 9.0, bulletHealth: 11, bulletSize: 8.5, bulletLife: 2.2, spread: 0.22, type: 'bullet' },
    ],
  },

  flank_guard: {
    id: 'flank_guard',
    name: 'Flank Guard',
    tier: 2,
    upgradesFrom: 'basic',
    upgradesTo: ['tri_angle', 'quad_tank', 'auto_3', 'hexa_tank'],
    description: 'Fires forward and backward simultaneously to repel flankers.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.0,
    barrels: [
      { length: 42, width: 18, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.0, recoil: 3.2, bulletSpeed: 10, bulletDamage: 13, bulletHealth: 15, bulletSize: 9, bulletLife: 2.5, spread: 0.04, type: 'bullet' },
      { length: 34, width: 18, angleOffset: Math.PI, offsetX: 0, offsetY: 0, reloadMultiplier: 1.0, recoil: 3.2, bulletSpeed: 10, bulletDamage: 12, bulletHealth: 13, bulletSize: 8.5, bulletLife: 2.5, spread: 0.04, type: 'bullet' },
    ],
  },

  pounder: {
    id: 'pounder',
    name: 'Pounder',
    tier: 2,
    upgradesFrom: 'basic',
    upgradesTo: ['destroyer', 'builder', 'skimmer', 'artillery', 'launcher'],
    description: 'Fires massive, heavy-impact cannonballs that tear through shapes and tanks.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.0,
    barrels: [
      { length: 42, width: 28, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.5, recoil: 7.0, bulletSpeed: 9.2, bulletDamage: 32, bulletHealth: 36, bulletSize: 15, bulletLife: 2.6, spread: 0.04, type: 'bullet' },
    ],
  },

  director: {
    id: 'director',
    name: 'Director',
    tier: 2,
    upgradesFrom: 'basic',
    upgradesTo: ['overseer', 'cruiser', 'underseer', 'manager'],
    description: 'Commands a squad of guided attack drones that swarm towards your crosshair.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.15,
    maxDrones: 4,
    droneType: 'minion',
    barrels: [
      { length: 38, width: 28, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 2.0, recoil: 1.0, bulletSpeed: 7.0, bulletDamage: 22, bulletHealth: 25, bulletSize: 11, bulletLife: 15.0, spread: 0.05, type: 'drone' },
    ],
  },

  trapper: {
    id: 'trapper',
    name: 'Trapper',
    tier: 2,
    upgradesFrom: 'basic',
    upgradesTo: ['tri_trapper', 'mega_trapper', 'builder'],
    description: 'Lays stationary triangular spike traps that form a defensive fortress perimeter.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.0,
    maxTraps: 8,
    barrels: [
      { length: 38, width: 24, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.3, recoil: 3.5, bulletSpeed: 8.5, bulletDamage: 28, bulletHealth: 40, bulletSize: 12, bulletLife: 12.0, spread: 0.06, type: 'trap' },
    ],
  },

  smasher: {
    id: 'smasher',
    name: 'Smasher',
    tier: 2,
    upgradesFrom: 'basic',
    upgradesTo: ['mega_smasher', 'landmine', 'spike'],
    description: 'Armored ramming hull with reinforced body damage and knockback resistance. No guns.',
    bodyShape: 'hexagon',
    bodyRadius: 26,
    fovMultiplier: 1.0,
    isRammer: true,
    barrels: [],
  },

  auto_3: {
    id: 'auto_3',
    name: 'Auto-3',
    tier: 2,
    upgradesFrom: 'basic',
    upgradesTo: ['auto_4', 'auto_5'],
    description: 'Equipped with 3 automated rotating turrets that independently lock onto enemies.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.05,
    barrels: [],
    autoTurrets: [
      { radius: 10, offsetDist: 14, angleOffset: 0, barrels: [{ length: 22, width: 10, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.0, recoil: 1.5, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 7, bulletLife: 2.2, spread: 0.05, type: 'bullet' }] },
      { radius: 10, offsetDist: 14, angleOffset: (2 * Math.PI) / 3, barrels: [{ length: 22, width: 10, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.0, recoil: 1.5, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 7, bulletLife: 2.2, spread: 0.05, type: 'bullet' }] },
      { radius: 10, offsetDist: 14, angleOffset: (4 * Math.PI) / 3, barrels: [{ length: 22, width: 10, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.0, recoil: 1.5, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 7, bulletLife: 2.2, spread: 0.05, type: 'bullet' }] },
    ],
  },

  // === TIER 3 ===
  triplet_shot: {
    id: 'triplet_shot',
    name: 'Triple Shot',
    tier: 3,
    upgradesFrom: 'twin',
    upgradesTo: ['triplet', 'penta_shot', 'spread_shot'],
    description: 'Three forward barrels covering a wider attack arc.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.0,
    barrels: [
      { length: 42, width: 16, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.8, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 8, bulletLife: 2.5, spread: 0.04, delay: 0.0, type: 'bullet' },
      { length: 36, width: 16, angleOffset: -0.32, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.8, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 8, bulletLife: 2.5, spread: 0.04, delay: 0.33, type: 'bullet' },
      { length: 36, width: 16, angleOffset: 0.32, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.8, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 8, bulletLife: 2.5, spread: 0.04, delay: 0.66, type: 'bullet' },
    ],
  },

  double_twin: {
    id: 'double_twin',
    name: 'Double Twin',
    tier: 3,
    upgradesFrom: 'twin',
    upgradesTo: ['triple_twin'],
    description: 'Twin cannons on both front and rear for bi-directional suppression.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.0,
    barrels: [
      { length: 42, width: 15, angleOffset: 0, offsetX: 0, offsetY: -9, reloadMultiplier: 0.95, recoil: 2.5, bulletSpeed: 10.5, bulletDamage: 10, bulletHealth: 12, bulletSize: 7.5, bulletLife: 2.5, spread: 0.04, delay: 0.0, type: 'bullet' },
      { length: 42, width: 15, angleOffset: 0, offsetX: 0, offsetY: 9, reloadMultiplier: 0.95, recoil: 2.5, bulletSpeed: 10.5, bulletDamage: 10, bulletHealth: 12, bulletSize: 7.5, bulletLife: 2.5, spread: 0.04, delay: 0.5, type: 'bullet' },
      { length: 42, width: 15, angleOffset: Math.PI, offsetX: 0, offsetY: -9, reloadMultiplier: 0.95, recoil: 2.5, bulletSpeed: 10.5, bulletDamage: 10, bulletHealth: 12, bulletSize: 7.5, bulletLife: 2.5, spread: 0.04, delay: 0.25, type: 'bullet' },
      { length: 42, width: 15, angleOffset: Math.PI, offsetX: 0, offsetY: 9, reloadMultiplier: 0.95, recoil: 2.5, bulletSpeed: 10.5, bulletDamage: 10, bulletHealth: 12, bulletSize: 7.5, bulletLife: 2.5, spread: 0.04, delay: 0.75, type: 'bullet' },
    ],
  },

  assassin: {
    id: 'assassin',
    name: 'Assassin',
    tier: 3,
    upgradesFrom: 'sniper',
    upgradesTo: ['ranger', 'stalker', 'falcon'],
    description: 'Super long barrel and massive zoom for long distance sniping.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.45,
    barrels: [
      { length: 65, width: 18, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.8, recoil: 6.5, bulletSpeed: 17, bulletDamage: 32, bulletHealth: 28, bulletSize: 10, bulletLife: 3.5, spread: 0.015, type: 'bullet' },
    ],
  },

  hunter: {
    id: 'hunter',
    name: 'Hunter',
    tier: 3,
    upgradesFrom: 'sniper',
    upgradesTo: ['streamliner', 'nailgun', 'predator'],
    description: 'Two concentric barrels firing a high damage two-round heavy shell burst.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.25,
    barrels: [
      { length: 48, width: 22, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.4, recoil: 4.5, bulletSpeed: 13, bulletDamage: 22, bulletHealth: 20, bulletSize: 11, bulletLife: 2.8, spread: 0.03, delay: 0.0, type: 'bullet' },
      { length: 58, width: 16, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.4, recoil: 4.5, bulletSpeed: 15, bulletDamage: 17, bulletHealth: 16, bulletSize: 8, bulletLife: 3.0, spread: 0.02, delay: 0.25, type: 'bullet' },
    ],
  },

  rifle: {
    id: 'rifle',
    name: 'Rifle',
    tier: 3,
    upgradesFrom: 'sniper',
    upgradesTo: ['streamliner', 'ranger'],
    description: 'Precision battle rifle with higher fire rate than standard sniper.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.35,
    barrels: [
      { length: 58, width: 16, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.1, recoil: 4.0, bulletSpeed: 16, bulletDamage: 24, bulletHealth: 22, bulletSize: 9, bulletLife: 3.2, spread: 0.02, type: 'bullet' },
    ],
  },

  destroyer: {
    id: 'destroyer',
    name: 'Destroyer',
    tier: 3,
    upgradesFrom: 'pounder',
    upgradesTo: ['annihilator', 'hybrid', 'rocketeer'],
    description: 'Gigantic cannon launching devastating heavy cannonballs with extreme recoil.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.0,
    barrels: [
      { length: 44, width: 34, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 2.0, recoil: 12.0, bulletSpeed: 9.0, bulletDamage: 55, bulletHealth: 55, bulletSize: 20, bulletLife: 2.8, spread: 0.03, type: 'bullet' },
    ],
  },

  gunner: {
    id: 'gunner',
    name: 'Gunner',
    tier: 3,
    upgradesFrom: 'machine_gun',
    upgradesTo: ['auto_gunner', 'streamliner', 'gatling', 'gunner_trapper'],
    description: 'Four micro-barrels peppering targets with a blazing stream of needle bullets.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.0,
    barrels: [
      { length: 38, width: 9, angleOffset: 0, offsetX: 0, offsetY: -12, reloadMultiplier: 0.55, recoil: 1.2, bulletSpeed: 11.5, bulletDamage: 7.0, bulletHealth: 9, bulletSize: 5.5, bulletLife: 2.2, spread: 0.07, delay: 0.0, type: 'bullet' },
      { length: 38, width: 9, angleOffset: 0, offsetX: 0, offsetY: -4, reloadMultiplier: 0.55, recoil: 1.2, bulletSpeed: 11.5, bulletDamage: 7.0, bulletHealth: 9, bulletSize: 5.5, bulletLife: 2.2, spread: 0.07, delay: 0.5, type: 'bullet' },
      { length: 38, width: 9, angleOffset: 0, offsetX: 0, offsetY: 4, reloadMultiplier: 0.55, recoil: 1.2, bulletSpeed: 11.5, bulletDamage: 7.0, bulletHealth: 9, bulletSize: 5.5, bulletLife: 2.2, spread: 0.07, delay: 0.25, type: 'bullet' },
      { length: 38, width: 9, angleOffset: 0, offsetX: 0, offsetY: 12, reloadMultiplier: 0.55, recoil: 1.2, bulletSpeed: 11.5, bulletDamage: 7.0, bulletHealth: 9, bulletSize: 5.5, bulletLife: 2.2, spread: 0.07, delay: 0.75, type: 'bullet' },
    ],
  },

  sprayer: {
    id: 'sprayer',
    name: 'Sprayer',
    tier: 3,
    upgradesFrom: 'machine_gun',
    upgradesTo: ['triplet', 'gatling'],
    description: 'A hybrid machine gun with an outer cone and focused central cannon.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.0,
    barrels: [
      { length: 38, width: 30, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.45, recoil: 1.8, bulletSpeed: 10, bulletDamage: 8.0, bulletHealth: 10, bulletSize: 7.5, bulletLife: 2.2, spread: 0.24, delay: 0.0, type: 'bullet' },
      { length: 46, width: 16, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.45, recoil: 2.4, bulletSpeed: 12, bulletDamage: 11.0, bulletHealth: 13, bulletSize: 8.5, bulletLife: 2.4, spread: 0.06, delay: 0.25, type: 'bullet' },
    ],
  },

  tri_angle: {
    id: 'tri_angle',
    name: 'Tri-Angle',
    tier: 3,
    upgradesFrom: 'flank_guard',
    upgradesTo: ['booster', 'fighter'],
    description: 'Two rear thruster barrels that provide high-speed rocket propulsion.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.0,
    barrels: [
      { length: 42, width: 18, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.0, recoil: 3.5, bulletSpeed: 10.5, bulletDamage: 14, bulletHealth: 16, bulletSize: 9, bulletLife: 2.5, spread: 0.04, delay: 0.0, type: 'bullet' },
      { length: 32, width: 16, angleOffset: (5 * Math.PI) / 6, offsetX: 0, offsetY: 0, reloadMultiplier: 0.85, recoil: 6.5, bulletSpeed: 9.5, bulletDamage: 9.5, bulletHealth: 11, bulletSize: 7.5, bulletLife: 1.8, spread: 0.06, delay: 0.25, type: 'bullet' },
      { length: 32, width: 16, angleOffset: -(5 * Math.PI) / 6, offsetX: 0, offsetY: 0, reloadMultiplier: 0.85, recoil: 6.5, bulletSpeed: 9.5, bulletDamage: 9.5, bulletHealth: 11, bulletSize: 7.5, bulletLife: 1.8, spread: 0.06, delay: 0.25, type: 'bullet' },
    ],
  },

  quad_tank: {
    id: 'quad_tank',
    name: 'Quad Tank',
    tier: 3,
    upgradesFrom: 'flank_guard',
    upgradesTo: ['octo_tank', 'auto_5', 'cyclone'],
    description: 'Four cardinal cannons firing simultaneously in all 4 directions.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.0,
    barrels: [
      { length: 42, width: 16, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.8, bulletSpeed: 10.5, bulletDamage: 12, bulletHealth: 14, bulletSize: 8.5, bulletLife: 2.5, spread: 0.04, delay: 0.0, type: 'bullet' },
      { length: 42, width: 16, angleOffset: Math.PI / 2, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.8, bulletSpeed: 10.5, bulletDamage: 12, bulletHealth: 14, bulletSize: 8.5, bulletLife: 2.5, spread: 0.04, delay: 0.25, type: 'bullet' },
      { length: 42, width: 16, angleOffset: Math.PI, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.8, bulletSpeed: 10.5, bulletDamage: 12, bulletHealth: 14, bulletSize: 8.5, bulletLife: 2.5, spread: 0.04, delay: 0.5, type: 'bullet' },
      { length: 42, width: 16, angleOffset: -Math.PI / 2, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.8, bulletSpeed: 10.5, bulletDamage: 12, bulletHealth: 14, bulletSize: 8.5, bulletLife: 2.5, spread: 0.04, delay: 0.75, type: 'bullet' },
    ],
  },

  overseer: {
    id: 'overseer',
    name: 'Overseer',
    tier: 3,
    upgradesFrom: 'director',
    upgradesTo: ['overlord', 'necromancer', 'battleship', 'factory', 'carrier'],
    description: 'Controls 8 lethal guided drones from twin trapezoidal drone bays.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.2,
    maxDrones: 8,
    droneType: 'minion',
    barrels: [
      { length: 38, width: 28, angleOffset: Math.PI / 2, offsetX: 0, offsetY: 0, reloadMultiplier: 1.8, recoil: 1.0, bulletSpeed: 7.5, bulletDamage: 22, bulletHealth: 26, bulletSize: 11, bulletLife: 18.0, spread: 0.05, delay: 0.0, type: 'drone' },
      { length: 38, width: 28, angleOffset: -Math.PI / 2, offsetX: 0, offsetY: 0, reloadMultiplier: 1.8, recoil: 1.0, bulletSpeed: 7.5, bulletDamage: 22, bulletHealth: 26, bulletSize: 11, bulletLife: 18.0, spread: 0.05, delay: 0.5, type: 'drone' },
    ],
  },

  cruiser: {
    id: 'cruiser',
    name: 'Cruiser',
    tier: 3,
    upgradesFrom: 'director',
    upgradesTo: ['battleship', 'swarmer'],
    description: 'Fires fast mini-swarm homing drones that dart towards your mouse.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.15,
    maxDrones: 12,
    droneType: 'swarm',
    barrels: [
      { length: 36, width: 20, angleOffset: 0.25, offsetX: 0, offsetY: 0, reloadMultiplier: 0.75, recoil: 1.5, bulletSpeed: 9.0, bulletDamage: 11, bulletHealth: 11, bulletSize: 8, bulletLife: 6.0, spread: 0.08, delay: 0.0, type: 'swarm' },
      { length: 36, width: 20, angleOffset: -0.25, offsetX: 0, offsetY: 0, reloadMultiplier: 0.75, recoil: 1.5, bulletSpeed: 9.0, bulletDamage: 11, bulletHealth: 11, bulletSize: 8, bulletLife: 6.0, spread: 0.08, delay: 0.5, type: 'swarm' },
    ],
  },

  underseer: {
    id: 'underseer',
    name: 'Underseer',
    tier: 3,
    upgradesFrom: 'director',
    upgradesTo: ['overlord', 'auto_trapper', 'overtrapper'],
    description: 'Drone commander equipped with rear trap defense launcher.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.15,
    maxDrones: 6,
    maxTraps: 6,
    droneType: 'minion',
    barrels: [
      { length: 38, width: 28, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.8, recoil: 1.0, bulletSpeed: 7.5, bulletDamage: 22, bulletHealth: 25, bulletSize: 11, bulletLife: 18.0, spread: 0.05, type: 'drone' },
      { length: 36, width: 22, angleOffset: Math.PI, offsetX: 0, offsetY: 0, reloadMultiplier: 1.4, recoil: 3.0, bulletSpeed: 8.0, bulletDamage: 24, bulletHealth: 35, bulletSize: 11, bulletLife: 12.0, spread: 0.06, type: 'trap' },
    ],
  },

  builder: {
    id: 'builder',
    name: 'Builder',
    tier: 3,
    upgradesFrom: 'pounder',
    upgradesTo: ['mega_trapper', 'auto_trapper', 'overtrapper'],
    description: 'Fires heavy hexagonal barricades that absorb incoming projectiles.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.05,
    maxTraps: 10,
    barrels: [
      { length: 42, width: 30, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.6, recoil: 5.0, bulletSpeed: 8.0, bulletDamage: 35, bulletHealth: 50, bulletSize: 15, bulletLife: 14.0, spread: 0.05, type: 'trap' },
    ],
  },

  tri_trapper: {
    id: 'tri_trapper',
    name: 'Tri-Trapper',
    tier: 3,
    upgradesFrom: 'trapper',
    upgradesTo: ['mega_trapper', 'auto_trapper', 'gunner_trapper'],
    description: 'Launches traps in three radial directions to build defensive bases.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.0,
    maxTraps: 12,
    barrels: [
      { length: 38, width: 24, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.2, recoil: 3.5, bulletSpeed: 8.5, bulletDamage: 25, bulletHealth: 35, bulletSize: 12, bulletLife: 12.0, spread: 0.05, delay: 0.0, type: 'trap' },
      { length: 38, width: 24, angleOffset: (2 * Math.PI) / 3, offsetX: 0, offsetY: 0, reloadMultiplier: 1.2, recoil: 3.5, bulletSpeed: 8.5, bulletDamage: 25, bulletHealth: 35, bulletSize: 12, bulletLife: 12.0, spread: 0.05, delay: 0.33, type: 'trap' },
      { length: 38, width: 24, angleOffset: (4 * Math.PI) / 3, offsetX: 0, offsetY: 0, reloadMultiplier: 1.2, recoil: 3.5, bulletSpeed: 8.5, bulletDamage: 25, bulletHealth: 35, bulletSize: 12, bulletLife: 12.0, spread: 0.05, delay: 0.66, type: 'trap' },
    ],
  },

  mega_smasher: {
    id: 'mega_smasher',
    name: 'Mega Smasher',
    tier: 3,
    upgradesFrom: 'smasher',
    upgradesTo: ['spike', 'auto_smasher'],
    description: 'Enlarged hexagonal body with crushing ramming mass.',
    bodyShape: 'hexagon',
    bodyRadius: 28,
    fovMultiplier: 1.0,
    isRammer: true,
    barrels: [],
  },

  landmine: {
    id: 'landmine',
    name: 'Landmine',
    tier: 3,
    upgradesFrom: 'smasher',
    upgradesTo: ['spike'],
    description: 'Turns completely invisible after staying still for 2.5 seconds. Lethal ambush rammer.',
    bodyShape: 'hexagon',
    bodyRadius: 26,
    fovMultiplier: 1.0,
    isRammer: true,
    hasInvisibility: true,
    barrels: [],
  },

  auto_4: {
    id: 'auto_4',
    name: 'Auto-4',
    tier: 3,
    upgradesFrom: 'auto_3',
    upgradesTo: ['auto_5'],
    description: 'Four automated tracking turrets mounted on hull.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.1,
    barrels: [],
    autoTurrets: [
      { radius: 10, offsetDist: 14, angleOffset: 0, barrels: [{ length: 22, width: 10, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.0, recoil: 1.5, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 7, bulletLife: 2.2, spread: 0.05, type: 'bullet' }] },
      { radius: 10, offsetDist: 14, angleOffset: Math.PI / 2, barrels: [{ length: 22, width: 10, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.0, recoil: 1.5, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 7, bulletLife: 2.2, spread: 0.05, type: 'bullet' }] },
      { radius: 10, offsetDist: 14, angleOffset: Math.PI, barrels: [{ length: 22, width: 10, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.0, recoil: 1.5, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 7, bulletLife: 2.2, spread: 0.05, type: 'bullet' }] },
      { radius: 10, offsetDist: 14, angleOffset: -Math.PI / 2, barrels: [{ length: 22, width: 10, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.0, recoil: 1.5, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 7, bulletLife: 2.2, spread: 0.05, type: 'bullet' }] },
    ],
  },

  // === TIER 4 (MAX TIER) ===
  triplet: {
    id: 'triplet',
    name: 'Triplet',
    tier: 4,
    upgradesFrom: 'triplet_shot',
    upgradesTo: [],
    description: 'Three tightly-focused forward barrels delivering devastating continuous DPS.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.0,
    barrels: [
      { length: 42, width: 15, angleOffset: 0, offsetX: 0, offsetY: -10, reloadMultiplier: 0.95, recoil: 2.2, bulletSpeed: 11, bulletDamage: 11, bulletHealth: 13, bulletSize: 8, bulletLife: 2.6, spread: 0.03, delay: 0.33, type: 'bullet' },
      { length: 46, width: 15, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.5, bulletSpeed: 11, bulletDamage: 12, bulletHealth: 14, bulletSize: 8, bulletLife: 2.6, spread: 0.03, delay: 0.0, type: 'bullet' },
      { length: 42, width: 15, angleOffset: 0, offsetX: 0, offsetY: 10, reloadMultiplier: 0.95, recoil: 2.2, bulletSpeed: 11, bulletDamage: 11, bulletHealth: 13, bulletSize: 8, bulletLife: 2.6, spread: 0.03, delay: 0.66, type: 'bullet' },
    ],
  },

  penta_shot: {
    id: 'penta_shot',
    name: 'Penta Shot',
    tier: 4,
    upgradesFrom: 'triplet_shot',
    upgradesTo: [],
    description: 'Five spread barrels unleashing a wide wall of bullets and intense rearward recoil.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.0,
    barrels: [
      { length: 36, width: 15, angleOffset: -0.5, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.6, bulletSpeed: 10.5, bulletDamage: 10.5, bulletHealth: 12, bulletSize: 8, bulletLife: 2.5, spread: 0.04, delay: 0.66, type: 'bullet' },
      { length: 40, width: 15, angleOffset: -0.25, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.8, bulletSpeed: 10.5, bulletDamage: 10.5, bulletHealth: 12, bulletSize: 8, bulletLife: 2.5, spread: 0.04, delay: 0.33, type: 'bullet' },
      { length: 46, width: 15, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 3.2, bulletSpeed: 10.5, bulletDamage: 12, bulletHealth: 13, bulletSize: 8, bulletLife: 2.5, spread: 0.04, delay: 0.0, type: 'bullet' },
      { length: 40, width: 15, angleOffset: 0.25, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.8, bulletSpeed: 10.5, bulletDamage: 10.5, bulletHealth: 12, bulletSize: 8, bulletLife: 2.5, spread: 0.04, delay: 0.33, type: 'bullet' },
      { length: 36, width: 15, angleOffset: 0.5, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.6, bulletSpeed: 10.5, bulletDamage: 10.5, bulletHealth: 12, bulletSize: 8, bulletLife: 2.5, spread: 0.04, delay: 0.66, type: 'bullet' },
    ],
  },

  octo_tank: {
    id: 'octo_tank',
    name: 'Octo Tank',
    tier: 4,
    upgradesFrom: 'quad_tank',
    upgradesTo: [],
    description: 'Eight barrels firing in all 8 directions. Perfect for crowd control and auto-spin.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.0,
    barrels: [
      { length: 40, width: 15, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.2, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 8, bulletLife: 2.5, spread: 0.04, delay: 0.0, type: 'bullet' },
      { length: 40, width: 15, angleOffset: Math.PI / 4, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.2, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 8, bulletLife: 2.5, spread: 0.04, delay: 0.5, type: 'bullet' },
      { length: 40, width: 15, angleOffset: Math.PI / 2, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.2, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 8, bulletLife: 2.5, spread: 0.04, delay: 0.0, type: 'bullet' },
      { length: 40, width: 15, angleOffset: (3 * Math.PI) / 4, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.2, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 8, bulletLife: 2.5, spread: 0.04, delay: 0.5, type: 'bullet' },
      { length: 40, width: 15, angleOffset: Math.PI, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.2, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 8, bulletLife: 2.5, spread: 0.04, delay: 0.0, type: 'bullet' },
      { length: 40, width: 15, angleOffset: -(3 * Math.PI) / 4, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.2, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 8, bulletLife: 2.5, spread: 0.04, delay: 0.5, type: 'bullet' },
      { length: 40, width: 15, angleOffset: -Math.PI / 2, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.2, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 8, bulletLife: 2.5, spread: 0.04, delay: 0.0, type: 'bullet' },
      { length: 40, width: 15, angleOffset: -Math.PI / 4, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 2.2, bulletSpeed: 10.5, bulletDamage: 11, bulletHealth: 12, bulletSize: 8, bulletLife: 2.5, spread: 0.04, delay: 0.5, type: 'bullet' },
    ],
  },

  triple_twin: {
    id: 'triple_twin',
    name: 'Triple Twin',
    tier: 4,
    upgradesFrom: 'double_twin',
    upgradesTo: [],
    description: 'Three pairs of twin barrels spaced at 120-degree angles.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.0,
    barrels: [
      { length: 42, width: 14, angleOffset: 0, offsetX: 0, offsetY: -8, reloadMultiplier: 0.95, recoil: 2.0, bulletSpeed: 10.5, bulletDamage: 10, bulletHealth: 11.5, bulletSize: 7.5, bulletLife: 2.5, spread: 0.04, delay: 0.0, type: 'bullet' },
      { length: 42, width: 14, angleOffset: 0, offsetX: 0, offsetY: 8, reloadMultiplier: 0.95, recoil: 2.0, bulletSpeed: 10.5, bulletDamage: 10, bulletHealth: 11.5, bulletSize: 7.5, bulletLife: 2.5, spread: 0.04, delay: 0.5, type: 'bullet' },
      { length: 42, width: 14, angleOffset: (2 * Math.PI) / 3, offsetX: 0, offsetY: -8, reloadMultiplier: 0.95, recoil: 2.0, bulletSpeed: 10.5, bulletDamage: 10, bulletHealth: 11.5, bulletSize: 7.5, bulletLife: 2.5, spread: 0.04, delay: 0.16, type: 'bullet' },
      { length: 42, width: 14, angleOffset: (2 * Math.PI) / 3, offsetX: 0, offsetY: 8, reloadMultiplier: 0.95, recoil: 2.0, bulletSpeed: 10.5, bulletDamage: 10, bulletHealth: 11.5, bulletSize: 7.5, bulletLife: 2.5, spread: 0.04, delay: 0.66, type: 'bullet' },
      { length: 42, width: 14, angleOffset: (4 * Math.PI) / 3, offsetX: 0, offsetY: -8, reloadMultiplier: 0.95, recoil: 2.0, bulletSpeed: 10.5, bulletDamage: 10, bulletHealth: 11.5, bulletSize: 7.5, bulletLife: 2.5, spread: 0.04, delay: 0.33, type: 'bullet' },
      { length: 42, width: 14, angleOffset: (4 * Math.PI) / 3, offsetX: 0, offsetY: 8, reloadMultiplier: 0.95, recoil: 2.0, bulletSpeed: 10.5, bulletDamage: 10, bulletHealth: 11.5, bulletSize: 7.5, bulletLife: 2.5, spread: 0.04, delay: 0.83, type: 'bullet' },
    ],
  },

  ranger: {
    id: 'ranger',
    name: 'Ranger',
    tier: 4,
    upgradesFrom: 'assassin',
    upgradesTo: [],
    description: 'Tremendous sniper scope giving maximum FOV zoom and hypersonic bullet velocity.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.85,
    barrels: [
      { length: 80, width: 18, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.9, recoil: 7.5, bulletSpeed: 19.0, bulletDamage: 38, bulletHealth: 34, bulletSize: 10.5, bulletLife: 4.0, spread: 0.01, type: 'bullet' },
    ],
  },

  stalker: {
    id: 'stalker',
    name: 'Stalker',
    tier: 4,
    upgradesFrom: 'assassin',
    upgradesTo: [],
    description: 'Long sniper barrel with cloaking technology that turns invisible while stationary.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.5,
    hasInvisibility: true,
    barrels: [
      { length: 66, width: 18, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.7, recoil: 6.5, bulletSpeed: 16.5, bulletDamage: 32, bulletHealth: 30, bulletSize: 10, bulletLife: 3.5, spread: 0.015, type: 'bullet' },
    ],
  },

  annihilator: {
    id: 'annihilator',
    name: 'Annihilator',
    tier: 4,
    upgradesFrom: 'destroyer',
    upgradesTo: [],
    description: 'Fires the largest projectile in the game with catastrophic damage and rocket recoil.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.0,
    barrels: [
      { length: 44, width: 44, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 2.2, recoil: 16.0, bulletSpeed: 8.8, bulletDamage: 75, bulletHealth: 80, bulletSize: 26, bulletLife: 3.0, spread: 0.02, type: 'bullet' },
    ],
  },

  hybrid: {
    id: 'hybrid',
    name: 'Hybrid',
    tier: 4,
    upgradesFrom: 'destroyer',
    upgradesTo: [],
    description: 'Combines a Destroyer heavy cannon with 2 autonomous guardian drones.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.0,
    maxDrones: 2,
    droneType: 'protector',
    barrels: [
      { length: 44, width: 34, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 2.0, recoil: 12.0, bulletSpeed: 9.0, bulletDamage: 55, bulletHealth: 55, bulletSize: 20, bulletLife: 2.8, spread: 0.03, type: 'bullet' },
      { length: 32, width: 22, angleOffset: Math.PI, offsetX: 0, offsetY: 0, reloadMultiplier: 2.5, recoil: 0.5, bulletSpeed: 7.0, bulletDamage: 20, bulletHealth: 22, bulletSize: 10, bulletLife: 15.0, spread: 0.05, type: 'drone' },
    ],
  },

  booster: {
    id: 'booster',
    name: 'Booster',
    tier: 4,
    upgradesFrom: 'tri_angle',
    upgradesTo: [],
    description: 'Four quad-thruster nozzles on the rear for unmatched acceleration and ramming speed.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.0,
    barrels: [
      { length: 42, width: 18, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 3.5, bulletSpeed: 10.5, bulletDamage: 14, bulletHealth: 15, bulletSize: 9, bulletLife: 2.5, spread: 0.04, delay: 0.0, type: 'bullet' },
      { length: 34, width: 14, angleOffset: (5 * Math.PI) / 6, offsetX: 0, offsetY: 0, reloadMultiplier: 0.75, recoil: 6.0, bulletSpeed: 9.5, bulletDamage: 9.0, bulletHealth: 9.5, bulletSize: 7, bulletLife: 1.6, spread: 0.06, delay: 0.0, type: 'bullet' },
      { length: 34, width: 14, angleOffset: -(5 * Math.PI) / 6, offsetX: 0, offsetY: 0, reloadMultiplier: 0.75, recoil: 6.0, bulletSpeed: 9.5, bulletDamage: 9.0, bulletHealth: 9.5, bulletSize: 7, bulletLife: 1.6, spread: 0.06, delay: 0.0, type: 'bullet' },
      { length: 30, width: 14, angleOffset: (7 * Math.PI) / 8, offsetX: 0, offsetY: 0, reloadMultiplier: 0.75, recoil: 5.5, bulletSpeed: 9.0, bulletDamage: 9.0, bulletHealth: 9.5, bulletSize: 7, bulletLife: 1.6, spread: 0.06, delay: 0.5, type: 'bullet' },
      { length: 30, width: 14, angleOffset: -(7 * Math.PI) / 8, offsetX: 0, offsetY: 0, reloadMultiplier: 0.75, recoil: 5.5, bulletSpeed: 9.0, bulletDamage: 9.0, bulletHealth: 9.5, bulletSize: 7, bulletLife: 1.6, spread: 0.06, delay: 0.5, type: 'bullet' },
    ],
  },

  fighter: {
    id: 'fighter',
    name: 'Fighter',
    tier: 4,
    upgradesFrom: 'tri_angle',
    upgradesTo: [],
    description: 'Equipped with forward cannon, dual flank cannons, and twin rear thrusters.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.0,
    barrels: [
      { length: 42, width: 18, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 3.5, bulletSpeed: 10.5, bulletDamage: 14, bulletHealth: 15, bulletSize: 9, bulletLife: 2.5, spread: 0.04, delay: 0.0, type: 'bullet' },
      { length: 34, width: 16, angleOffset: Math.PI / 2, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 3.0, bulletSpeed: 10.5, bulletDamage: 12, bulletHealth: 13, bulletSize: 8, bulletLife: 2.2, spread: 0.05, delay: 0.25, type: 'bullet' },
      { length: 34, width: 16, angleOffset: -Math.PI / 2, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 3.0, bulletSpeed: 10.5, bulletDamage: 12, bulletHealth: 13, bulletSize: 8, bulletLife: 2.2, spread: 0.05, delay: 0.25, type: 'bullet' },
      { length: 32, width: 16, angleOffset: (5 * Math.PI) / 6, offsetX: 0, offsetY: 0, reloadMultiplier: 0.85, recoil: 6.0, bulletSpeed: 9.5, bulletDamage: 9.5, bulletHealth: 11, bulletSize: 7.5, bulletLife: 1.8, spread: 0.06, delay: 0.5, type: 'bullet' },
      { length: 32, width: 16, angleOffset: -(5 * Math.PI) / 6, offsetX: 0, offsetY: 0, reloadMultiplier: 0.85, recoil: 6.0, bulletSpeed: 9.5, bulletDamage: 9.5, bulletHealth: 11, bulletSize: 7.5, bulletLife: 1.8, spread: 0.06, delay: 0.5, type: 'bullet' },
    ],
  },

  overlord: {
    id: 'overlord',
    name: 'Overlord',
    tier: 4,
    upgradesFrom: 'overseer',
    upgradesTo: [],
    description: 'Four drone bays that quickly replenish 8 high-powered guided attack drones.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.25,
    maxDrones: 8,
    droneType: 'minion',
    barrels: [
      { length: 38, width: 28, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.6, recoil: 1.0, bulletSpeed: 8.0, bulletDamage: 26, bulletHealth: 30, bulletSize: 11.5, bulletLife: 20.0, spread: 0.05, delay: 0.0, type: 'drone' },
      { length: 38, width: 28, angleOffset: Math.PI / 2, offsetX: 0, offsetY: 0, reloadMultiplier: 1.6, recoil: 1.0, bulletSpeed: 8.0, bulletDamage: 26, bulletHealth: 30, bulletSize: 11.5, bulletLife: 20.0, spread: 0.05, delay: 0.25, type: 'drone' },
      { length: 38, width: 28, angleOffset: Math.PI, offsetX: 0, offsetY: 0, reloadMultiplier: 1.6, recoil: 1.0, bulletSpeed: 8.0, bulletDamage: 26, bulletHealth: 30, bulletSize: 11.5, bulletLife: 20.0, spread: 0.05, delay: 0.5, type: 'drone' },
      { length: 38, width: 28, angleOffset: -Math.PI / 2, offsetX: 0, offsetY: 0, reloadMultiplier: 1.6, recoil: 1.0, bulletSpeed: 8.0, bulletDamage: 26, bulletHealth: 30, bulletSize: 11.5, bulletLife: 20.0, spread: 0.05, delay: 0.75, type: 'drone' },
    ],
  },

  necromancer: {
    id: 'necromancer',
    name: 'Necromancer',
    tier: 4,
    upgradesFrom: 'overseer',
    upgradesTo: [],
    description: 'Converts destroyed yellow squares into a loyal army of up to 24 controllable square drones.',
    bodyShape: 'square',
    bodyRadius: 24,
    fovMultiplier: 1.25,
    maxDrones: 24,
    droneType: 'square',
    canConvertShapes: true,
    barrels: [
      { length: 38, width: 28, angleOffset: Math.PI / 2, offsetX: 0, offsetY: 0, reloadMultiplier: 2.5, recoil: 0.5, bulletSpeed: 7.5, bulletDamage: 20, bulletHealth: 22, bulletSize: 11, bulletLife: 35.0, spread: 0.05, type: 'drone' },
      { length: 38, width: 28, angleOffset: -Math.PI / 2, offsetX: 0, offsetY: 0, reloadMultiplier: 2.5, recoil: 0.5, bulletSpeed: 7.5, bulletDamage: 20, bulletHealth: 22, bulletSize: 11, bulletLife: 35.0, spread: 0.05, type: 'drone' },
    ],
  },

  battleship: {
    id: 'battleship',
    name: 'Battleship',
    tier: 4,
    upgradesFrom: 'cruiser',
    upgradesTo: [],
    description: 'Four swarm launcher bays streaming guided and autonomous AI micro-drones.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.2,
    maxDrones: 28,
    droneType: 'swarm',
    barrels: [
      { length: 34, width: 18, angleOffset: Math.PI / 3, offsetX: 0, offsetY: 0, reloadMultiplier: 0.45, recoil: 1.0, bulletSpeed: 9.5, bulletDamage: 9.0, bulletHealth: 9.5, bulletSize: 7.5, bulletLife: 5.5, spread: 0.1, delay: 0.0, type: 'swarm' },
      { length: 34, width: 18, angleOffset: -Math.PI / 3, offsetX: 0, offsetY: 0, reloadMultiplier: 0.45, recoil: 1.0, bulletSpeed: 9.5, bulletDamage: 9.0, bulletHealth: 9.5, bulletSize: 7.5, bulletLife: 5.5, spread: 0.1, delay: 0.25, type: 'swarm' },
      { length: 34, width: 18, angleOffset: (2 * Math.PI) / 3, offsetX: 0, offsetY: 0, reloadMultiplier: 0.45, recoil: 1.0, bulletSpeed: 9.5, bulletDamage: 9.0, bulletHealth: 9.5, bulletSize: 7.5, bulletLife: 5.5, spread: 0.1, delay: 0.5, type: 'swarm' },
      { length: 34, width: 18, angleOffset: -(2 * Math.PI) / 3, offsetX: 0, offsetY: 0, reloadMultiplier: 0.45, recoil: 1.0, bulletSpeed: 9.5, bulletDamage: 9.0, bulletHealth: 9.5, bulletSize: 7.5, bulletLife: 5.5, spread: 0.1, delay: 0.75, type: 'swarm' },
    ],
  },

  factory: {
    id: 'factory',
    name: 'Factory',
    tier: 4,
    upgradesFrom: 'overseer',
    upgradesTo: [],
    description: 'Produces miniature minion tanks that follow your crosshair and shoot enemies.',
    bodyShape: 'circle',
    bodyRadius: 24,
    fovMultiplier: 1.2,
    maxDrones: 6,
    droneType: 'factory_tank',
    barrels: [
      { length: 42, width: 34, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.5, recoil: 1.5, bulletSpeed: 7.5, bulletDamage: 28, bulletHealth: 35, bulletSize: 14, bulletLife: 22.0, spread: 0.04, type: 'drone' },
    ],
  },

  auto_5: {
    id: 'auto_5',
    name: 'Auto-5',
    tier: 4,
    upgradesFrom: 'auto_3',
    upgradesTo: [],
    description: 'Equipped with 5 automated tracking turrets providing full 360-degree automatic fire.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.1,
    barrels: [],
    autoTurrets: [
      { radius: 10, offsetDist: 15, angleOffset: 0, barrels: [{ length: 22, width: 10, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 1.5, bulletSpeed: 11, bulletDamage: 10, bulletHealth: 11, bulletSize: 7, bulletLife: 2.2, spread: 0.05, type: 'bullet' }] },
      { radius: 10, offsetDist: 15, angleOffset: (2 * Math.PI) / 5, barrels: [{ length: 22, width: 10, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 1.5, bulletSpeed: 11, bulletDamage: 10, bulletHealth: 11, bulletSize: 7, bulletLife: 2.2, spread: 0.05, type: 'bullet' }] },
      { radius: 10, offsetDist: 15, angleOffset: (4 * Math.PI) / 5, barrels: [{ length: 22, width: 10, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 1.5, bulletSpeed: 11, bulletDamage: 10, bulletHealth: 11, bulletSize: 7, bulletLife: 2.2, spread: 0.05, type: 'bullet' }] },
      { radius: 10, offsetDist: 15, angleOffset: (6 * Math.PI) / 5, barrels: [{ length: 22, width: 10, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 1.5, bulletSpeed: 11, bulletDamage: 10, bulletHealth: 11, bulletSize: 7, bulletLife: 2.2, spread: 0.05, type: 'bullet' }] },
      { radius: 10, offsetDist: 15, angleOffset: (8 * Math.PI) / 5, barrels: [{ length: 22, width: 10, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.95, recoil: 1.5, bulletSpeed: 11, bulletDamage: 10, bulletHealth: 11, bulletSize: 7, bulletLife: 2.2, spread: 0.05, type: 'bullet' }] },
    ],
  },

  streamliner: {
    id: 'streamliner',
    name: 'Streamliner',
    tier: 4,
    upgradesFrom: 'gunner',
    upgradesTo: [],
    description: 'Five layered sequential barrels projecting a continuous focused laser-beam of bullets.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.45,
    barrels: [
      { length: 36, width: 14, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.32, recoil: 1.0, bulletSpeed: 13.5, bulletDamage: 6.5, bulletHealth: 8, bulletSize: 6.5, bulletLife: 2.8, spread: 0.03, delay: 0.8, type: 'bullet' },
      { length: 42, width: 14, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.32, recoil: 1.0, bulletSpeed: 13.5, bulletDamage: 6.5, bulletHealth: 8, bulletSize: 6.5, bulletLife: 2.8, spread: 0.03, delay: 0.6, type: 'bullet' },
      { length: 48, width: 14, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.32, recoil: 1.0, bulletSpeed: 13.5, bulletDamage: 6.5, bulletHealth: 8, bulletSize: 6.5, bulletLife: 2.8, spread: 0.03, delay: 0.4, type: 'bullet' },
      { length: 54, width: 14, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.32, recoil: 1.0, bulletSpeed: 13.5, bulletDamage: 6.5, bulletHealth: 8, bulletSize: 6.5, bulletLife: 2.8, spread: 0.03, delay: 0.2, type: 'bullet' },
      { length: 60, width: 14, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.32, recoil: 1.0, bulletSpeed: 13.5, bulletDamage: 6.5, bulletHealth: 8, bulletSize: 6.5, bulletLife: 2.8, spread: 0.03, delay: 0.0, type: 'bullet' },
    ],
  },

  gatling: {
    id: 'gatling',
    name: 'Gatling Gun',
    tier: 4,
    upgradesFrom: 'gunner',
    upgradesTo: [],
    description: 'Blistering fire rate minigun that shreds everything in front of it.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.05,
    barrels: [
      { length: 48, width: 14, angleOffset: 0, offsetX: 0, offsetY: -5, reloadMultiplier: 0.22, recoil: 1.0, bulletSpeed: 12.5, bulletDamage: 6.5, bulletHealth: 8, bulletSize: 6.5, bulletLife: 2.5, spread: 0.12, delay: 0.0, type: 'bullet' },
      { length: 48, width: 14, angleOffset: 0, offsetX: 0, offsetY: 5, reloadMultiplier: 0.22, recoil: 1.0, bulletSpeed: 12.5, bulletDamage: 6.5, bulletHealth: 8, bulletSize: 6.5, bulletLife: 2.5, spread: 0.12, delay: 0.5, type: 'bullet' },
    ],
  },

  skimmer: {
    id: 'skimmer',
    name: 'Skimmer',
    tier: 4,
    upgradesFrom: 'pounder',
    upgradesTo: [],
    description: 'Launches large cruise shells that fire bullet trails sideways as they travel.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.1,
    barrels: [
      { length: 44, width: 30, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.6, recoil: 8.0, bulletSpeed: 11, bulletDamage: 45, bulletHealth: 45, bulletSize: 18, bulletLife: 3.5, spread: 0.03, type: 'bullet' },
    ],
  },

  rocketeer: {
    id: 'rocketeer',
    name: 'Rocketeer',
    tier: 4,
    upgradesFrom: 'destroyer',
    upgradesTo: [],
    description: 'Fires high-speed propelled rockets that accelerate over distance.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.15,
    barrels: [
      { length: 48, width: 32, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.8, recoil: 10.0, bulletSpeed: 13, bulletDamage: 55, bulletHealth: 55, bulletSize: 16, bulletLife: 3.0, spread: 0.02, type: 'bullet' },
    ],
  },

  spike: {
    id: 'spike',
    name: 'Spike',
    tier: 4,
    upgradesFrom: 'smasher',
    upgradesTo: [],
    description: 'Supreme rammer protected by 4 massive rotating steel spikes with extreme body damage.',
    bodyShape: 'spiked',
    bodyRadius: 28,
    fovMultiplier: 1.0,
    isRammer: true,
    barrels: [],
  },

  auto_smasher: {
    id: 'auto_smasher',
    name: 'Auto-Smasher',
    tier: 4,
    upgradesFrom: 'smasher',
    upgradesTo: [],
    description: 'Reinforced smasher hull equipped with an automated turret.',
    bodyShape: 'hexagon',
    bodyRadius: 27,
    fovMultiplier: 1.0,
    isRammer: true,
    barrels: [],
    autoTurrets: [
      { radius: 10, offsetDist: 0, angleOffset: 0, barrels: [{ length: 22, width: 10, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.0, recoil: 1.5, bulletSpeed: 11, bulletDamage: 10, bulletHealth: 11, bulletSize: 7, bulletLife: 2.2, spread: 0.05, type: 'bullet' }] },
    ],
  },

  mega_trapper: {
    id: 'mega_trapper',
    name: 'Mega Trapper',
    tier: 4,
    upgradesFrom: 'trapper',
    upgradesTo: [],
    description: 'Fires massive spiked barriers that stop cannonballs and demolish ramming enemies.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.1,
    maxTraps: 10,
    barrels: [
      { length: 44, width: 34, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.8, recoil: 6.0, bulletSpeed: 9.0, bulletDamage: 50, bulletHealth: 75, bulletSize: 20, bulletLife: 15.0, spread: 0.04, type: 'trap' },
    ],
  },

  auto_gunner: {
    id: 'auto_gunner',
    name: 'Auto-Gunner',
    tier: 4,
    upgradesFrom: 'gunner',
    upgradesTo: [],
    description: 'Four rapid gunner barrels with an automated turret mounted on the hull.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.1,
    barrels: [
      { length: 38, width: 9, angleOffset: 0, offsetX: 0, offsetY: -12, reloadMultiplier: 0.55, recoil: 1.2, bulletSpeed: 11.5, bulletDamage: 6.8, bulletHealth: 8.5, bulletSize: 5.5, bulletLife: 2.2, spread: 0.07, delay: 0.0, type: 'bullet' },
      { length: 38, width: 9, angleOffset: 0, offsetX: 0, offsetY: -4, reloadMultiplier: 0.55, recoil: 1.2, bulletSpeed: 11.5, bulletDamage: 6.8, bulletHealth: 8.5, bulletSize: 5.5, bulletLife: 2.2, spread: 0.07, delay: 0.5, type: 'bullet' },
      { length: 38, width: 9, angleOffset: 0, offsetX: 0, offsetY: 4, reloadMultiplier: 0.55, recoil: 1.2, bulletSpeed: 11.5, bulletDamage: 6.8, bulletHealth: 8.5, bulletSize: 5.5, bulletLife: 2.2, spread: 0.07, delay: 0.25, type: 'bullet' },
      { length: 38, width: 9, angleOffset: 0, offsetX: 0, offsetY: 12, reloadMultiplier: 0.55, recoil: 1.2, bulletSpeed: 11.5, bulletDamage: 6.8, bulletHealth: 8.5, bulletSize: 5.5, bulletLife: 2.2, spread: 0.07, delay: 0.75, type: 'bullet' },
    ],
    autoTurrets: [
      { radius: 10, offsetDist: 0, angleOffset: 0, barrels: [{ length: 20, width: 9, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.0, recoil: 1.2, bulletSpeed: 11.5, bulletDamage: 9.0, bulletHealth: 10.5, bulletSize: 6, bulletLife: 2.2, spread: 0.05, type: 'bullet' }] },
    ],
  },

  auto_trapper: {
    id: 'auto_trapper',
    name: 'Auto-Trapper',
    tier: 4,
    upgradesFrom: 'trapper',
    upgradesTo: [],
    description: 'Lays traps while an automated turret tracks and shoots nearby hostiles.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.1,
    maxTraps: 10,
    barrels: [
      { length: 40, width: 26, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.2, recoil: 3.5, bulletSpeed: 8.5, bulletDamage: 30, bulletHealth: 45, bulletSize: 13, bulletLife: 13.0, spread: 0.05, type: 'trap' },
    ],
    autoTurrets: [
      { radius: 10, offsetDist: 0, angleOffset: 0, barrels: [{ length: 20, width: 9, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.0, recoil: 1.2, bulletSpeed: 11.5, bulletDamage: 9.0, bulletHealth: 10.5, bulletSize: 6, bulletLife: 2.2, spread: 0.05, type: 'bullet' }] },
    ],
  },

  nailgun: {
    id: 'nailgun',
    name: 'Nailgun',
    tier: 4,
    upgradesFrom: 'gunner',
    upgradesTo: [],
    description: 'Rapid bursts of armor-piercing high velocity spikes.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.15,
    barrels: [
      { length: 44, width: 10, angleOffset: -0.15, offsetX: 0, offsetY: -6, reloadMultiplier: 0.45, recoil: 1.5, bulletSpeed: 14, bulletDamage: 8.0, bulletHealth: 9, bulletSize: 6, bulletLife: 2.4, spread: 0.06, delay: 0.0, type: 'bullet' },
      { length: 48, width: 10, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.45, recoil: 1.8, bulletSpeed: 14, bulletDamage: 9.0, bulletHealth: 10, bulletSize: 6, bulletLife: 2.4, spread: 0.04, delay: 0.33, type: 'bullet' },
      { length: 44, width: 10, angleOffset: 0.15, offsetX: 0, offsetY: 6, reloadMultiplier: 0.45, recoil: 1.5, bulletSpeed: 14, bulletDamage: 8.0, bulletHealth: 9, bulletSize: 6, bulletLife: 2.4, spread: 0.06, delay: 0.66, type: 'bullet' },
    ],
  },

  // =====================================================================
  // === XE TĂNG MỚI (lấy cảm hứng từ arras.io) ===
  // =====================================================================

  // --- TIER 3 mới ---
  twin_flank: {
    id: 'twin_flank',
    name: 'Twin Flank',
    tier: 3,
    upgradesFrom: 'twin',
    upgradesTo: ['triple_twin', 'octo_tank'],
    description: 'Two twin cannons at the front and two at the back. Great for kiting.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.05,
    barrels: [
      B({ width: 15, offsetY: -9, bulletDamage: 10, bulletHealth: 12, bulletSize: 7.5 }),
      B({ width: 15, offsetY: 9, bulletDamage: 10, bulletHealth: 12, bulletSize: 7.5 }),
      B({ width: 15, offsetY: -9, angleOffset: Math.PI, bulletDamage: 10, bulletHealth: 12, bulletSize: 7.5 }),
      B({ width: 15, offsetY: 9, angleOffset: Math.PI, bulletDamage: 10, bulletHealth: 12, bulletSize: 7.5 }),
    ],
  },

  hexa_tank: {
    id: 'hexa_tank',
    name: 'Hexa Tank',
    tier: 3,
    upgradesFrom: 'flank_guard',
    upgradesTo: ['cyclone', 'octo_tank'],
    description: 'Six barrels spaced evenly around the hull for full 360-degree firepower.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.05,
    barrels: [0, 1, 2, 3, 4, 5].map((i) =>
      B({ length: 40, angleOffset: (i * Math.PI) / 3, reloadMultiplier: 1.15, bulletDamage: 9, bulletHealth: 11, bulletSize: 7.5, recoil: 2.2 })
    ),
  },

  artillery: {
    id: 'artillery',
    name: 'Artillery',
    tier: 3,
    upgradesFrom: 'pounder',
    upgradesTo: ['mortar', 'annihilator'],
    description: 'Twin angled heavy cannons that crush anything in a narrow cone.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.1,
    barrels: [
      B({ length: 50, width: 18, offsetY: -11, angleOffset: 0.07, reloadMultiplier: 1.3, recoil: 4.5, bulletSpeed: 10.5, bulletDamage: 26, bulletHealth: 30, bulletSize: 11, bulletLife: 2.8, spread: 0.03 }),
      B({ length: 50, width: 18, offsetY: 11, angleOffset: -0.07, reloadMultiplier: 1.3, recoil: 4.5, bulletSpeed: 10.5, bulletDamage: 26, bulletHealth: 30, bulletSize: 11, bulletLife: 2.8, spread: 0.03 }),
    ],
  },

  launcher: {
    id: 'launcher',
    name: 'Launcher',
    tier: 3,
    upgradesFrom: 'pounder',
    upgradesTo: ['skimmer', 'rocketeer'],
    description: 'Fires slow-to-launch, hard-hitting rockets with a big recoil kick.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.1,
    barrels: [
      B({ length: 46, width: 26, reloadMultiplier: 1.35, recoil: 6.5, bulletSpeed: 12, bulletDamage: 40, bulletHealth: 36, bulletSize: 12, bulletLife: 3.0, spread: 0.025, type: 'missile' }),
    ],
  },

  minigun: {
    id: 'minigun',
    name: 'Minigun',
    tier: 3,
    upgradesFrom: 'machine_gun',
    upgradesTo: ['streamliner', 'nailgun'],
    description: 'Three long barrels hosing out a fast stream of precise bullets.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.2,
    barrels: [
      B({ length: 52, width: 10, offsetY: -8, reloadMultiplier: 0.5, recoil: 1.2, bulletSpeed: 12, bulletDamage: 6.5, bulletHealth: 9, bulletSize: 6, bulletLife: 2.4, spread: 0.07 }),
      B({ length: 56, width: 10, offsetY: 0, reloadMultiplier: 0.5, recoil: 1.2, bulletSpeed: 12, bulletDamage: 6.5, bulletHealth: 9, bulletSize: 6, bulletLife: 2.4, spread: 0.07 }),
      B({ length: 52, width: 10, offsetY: 8, reloadMultiplier: 0.5, recoil: 1.2, bulletSpeed: 12, bulletDamage: 6.5, bulletHealth: 9, bulletSize: 6, bulletLife: 2.4, spread: 0.07 }),
    ],
  },

  manager: {
    id: 'manager',
    name: 'Manager',
    tier: 3,
    upgradesFrom: 'director',
    upgradesTo: ['overlord', 'necromancer'],
    description: 'Drone commander that turns invisible while standing still. Ambush with drones!',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.15,
    maxDrones: 8,
    droneType: 'minion',
    hasInvisibility: true,
    barrels: [
      B({ length: 38, width: 28, reloadMultiplier: 1.7, recoil: 1.0, bulletSpeed: 7.5, bulletDamage: 21, bulletHealth: 25, bulletSize: 11, bulletLife: 18.0, spread: 0.05, type: 'drone' }),
    ],
  },

  // --- TIER 4 mới ---
  predator: {
    id: 'predator',
    name: 'Predator',
    tier: 4,
    upgradesFrom: 'hunter',
    upgradesTo: [],
    description: 'Three stacked barrels unleash a devastating long-range volley.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.4,
    barrels: [
      B({ length: 58, width: 24, reloadMultiplier: 1.9, recoil: 6.0, bulletSpeed: 15, bulletDamage: 34, bulletHealth: 34, bulletSize: 11, bulletLife: 3.0, spread: 0.015 }),
      B({ length: 50, width: 18, reloadMultiplier: 1.9, recoil: 0.5, bulletSpeed: 15, bulletDamage: 24, bulletHealth: 26, bulletSize: 9.5, bulletLife: 3.0, spread: 0.015 }),
      B({ length: 42, width: 12, reloadMultiplier: 1.9, recoil: 0.5, bulletSpeed: 15, bulletDamage: 16, bulletHealth: 18, bulletSize: 8, bulletLife: 3.0, spread: 0.015 }),
    ],
  },

  spread_shot: {
    id: 'spread_shot',
    name: 'Spread Shot',
    tier: 4,
    upgradesFrom: 'triplet_shot',
    upgradesTo: [],
    description: 'A wide fan of seven barrels that blankets the whole area in bullets.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.1,
    barrels: [-0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6].map((a) =>
      B({ length: 36 + (0.6 - Math.abs(a)) * 14, width: 11, angleOffset: a, reloadMultiplier: 1.1, recoil: 1.2, bulletDamage: 7, bulletHealth: 9, bulletSize: 6.5, bulletLife: 2.2, spread: 0.05 })
    ),
  },

  cyclone: {
    id: 'cyclone',
    name: 'Cyclone',
    tier: 4,
    upgradesFrom: 'hexa_tank',
    upgradesTo: [],
    description: 'Twelve small barrels sweep a storm of bullets in every direction.',
    bodyShape: 'circle',
    bodyRadius: 24,
    fovMultiplier: 1.1,
    barrels: Array.from({ length: 12 }, (_, i) =>
      B({ length: 34, width: 10, angleOffset: (i * Math.PI) / 6, reloadMultiplier: 0.95, recoil: 1.0, bulletSpeed: 10.5, bulletDamage: 6, bulletHealth: 8, bulletSize: 6, bulletLife: 2.0, spread: 0.06 })
    ),
  },

  mortar: {
    id: 'mortar',
    name: 'Mortar',
    tier: 4,
    upgradesFrom: 'artillery',
    upgradesTo: [],
    description: 'One massive shell flanked by four smaller cannons. Brutal at mid range.',
    bodyShape: 'circle',
    bodyRadius: 23,
    fovMultiplier: 1.15,
    barrels: [
      B({ length: 52, width: 26, reloadMultiplier: 1.6, recoil: 6.5, bulletSpeed: 9.5, bulletDamage: 42, bulletHealth: 44, bulletSize: 13, bulletLife: 2.8, spread: 0.025 }),
      B({ length: 42, width: 12, angleOffset: 0.3, reloadMultiplier: 1.1, recoil: 1.8, bulletDamage: 16, bulletHealth: 18, bulletSize: 8.5, spread: 0.04 }),
      B({ length: 42, width: 12, angleOffset: -0.3, reloadMultiplier: 1.1, recoil: 1.8, bulletDamage: 16, bulletHealth: 18, bulletSize: 8.5, spread: 0.04 }),
      B({ length: 38, width: 11, angleOffset: 0.62, reloadMultiplier: 1.1, recoil: 1.5, bulletDamage: 14, bulletHealth: 16, bulletSize: 8, spread: 0.05 }),
      B({ length: 38, width: 11, angleOffset: -0.62, reloadMultiplier: 1.1, recoil: 1.5, bulletDamage: 14, bulletHealth: 16, bulletSize: 8, spread: 0.05 }),
    ],
  },

  overtrapper: {
    id: 'overtrapper',
    name: 'Overtrapper',
    tier: 4,
    upgradesFrom: 'builder',
    upgradesTo: [],
    description: 'Lays traps in front while two drone bays guard your flanks.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.1,
    maxDrones: 6,
    maxTraps: 8,
    droneType: 'minion',
    barrels: [
      B({ length: 40, width: 26, reloadMultiplier: 1.4, recoil: 3.5, bulletSpeed: 8.5, bulletDamage: 28, bulletHealth: 42, bulletSize: 12, bulletLife: 12.0, spread: 0.05, type: 'trap' }),
      B({ length: 34, width: 22, angleOffset: 2.45, reloadMultiplier: 2.0, recoil: 1.0, bulletSpeed: 7.5, bulletDamage: 18, bulletHealth: 22, bulletSize: 9, bulletLife: 18.0, spread: 0.05, type: 'drone' }),
      B({ length: 34, width: 22, angleOffset: -2.45, reloadMultiplier: 2.0, recoil: 1.0, bulletSpeed: 7.5, bulletDamage: 18, bulletHealth: 22, bulletSize: 9, bulletLife: 18.0, spread: 0.05, type: 'drone' }),
    ],
  },

  gunner_trapper: {
    id: 'gunner_trapper',
    name: 'Gunner Trapper',
    tier: 4,
    upgradesFrom: 'tri_trapper',
    upgradesTo: [],
    description: 'Twin rapid-fire guns forward, a trap launcher in the back. Shoot and run!',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.1,
    maxTraps: 8,
    barrels: [
      B({ length: 42, width: 9, offsetY: -6, reloadMultiplier: 0.55, recoil: 1.2, bulletSpeed: 11.5, bulletDamage: 7, bulletHealth: 9, bulletSize: 5.5, bulletLife: 2.2, spread: 0.08 }),
      B({ length: 42, width: 9, offsetY: 6, reloadMultiplier: 0.55, recoil: 1.2, bulletSpeed: 11.5, bulletDamage: 7, bulletHealth: 9, bulletSize: 5.5, bulletLife: 2.2, spread: 0.08 }),
      B({ length: 36, width: 24, angleOffset: Math.PI, reloadMultiplier: 1.3, recoil: 3.0, bulletSpeed: 8.5, bulletDamage: 30, bulletHealth: 42, bulletSize: 12, bulletLife: 12.0, spread: 0.05, type: 'trap' }),
    ],
  },

  swarmer: {
    id: 'swarmer',
    name: 'Swarmer',
    tier: 4,
    upgradesFrom: 'cruiser',
    upgradesTo: [],
    description: 'A huge launcher that releases homing swarm drones towards your cursor.',
    bodyShape: 'circle',
    bodyRadius: 23,
    fovMultiplier: 1.15,
    maxDrones: 10,
    droneType: 'swarm',
    barrels: [
      B({ length: 46, width: 30, reloadMultiplier: 1.2, recoil: 2.0, bulletSpeed: 8, bulletDamage: 16, bulletHealth: 18, bulletSize: 10, bulletLife: 7.0, spread: 0.06, type: 'swarm' }),
    ],
  },

  carrier: {
    id: 'carrier',
    name: 'Carrier',
    tier: 4,
    upgradesFrom: 'overseer',
    upgradesTo: [],
    description: 'Three forward drone bays launch a wave of guided drones.',
    bodyShape: 'circle',
    bodyRadius: 23,
    fovMultiplier: 1.2,
    maxDrones: 12,
    droneType: 'minion',
    barrels: [
      B({ length: 36, width: 20, reloadMultiplier: 1.4, recoil: 1.0, bulletSpeed: 8, bulletDamage: 18, bulletHealth: 21, bulletSize: 9, bulletLife: 18.0, spread: 0.05, type: 'drone' }),
      B({ length: 36, width: 20, angleOffset: 0.38, reloadMultiplier: 1.4, recoil: 1.0, bulletSpeed: 8, bulletDamage: 18, bulletHealth: 21, bulletSize: 9, bulletLife: 18.0, spread: 0.05, type: 'drone' }),
      B({ length: 36, width: 20, angleOffset: -0.38, reloadMultiplier: 1.4, recoil: 1.0, bulletSpeed: 8, bulletDamage: 18, bulletHealth: 21, bulletSize: 9, bulletLife: 18.0, spread: 0.05, type: 'drone' }),
    ],
  },

  falcon: {
    id: 'falcon',
    name: 'Falcon',
    tier: 4,
    upgradesFrom: 'assassin',
    upgradesTo: [],
    description: 'Extremely long barrel and blistering bullet speed. One precise hit is all it takes.',
    bodyShape: 'circle',
    bodyRadius: 22,
    fovMultiplier: 1.6,
    barrels: [
      B({ length: 72, width: 14, reloadMultiplier: 1.5, recoil: 6.5, bulletSpeed: 21, bulletDamage: 40, bulletHealth: 32, bulletSize: 8.5, bulletLife: 3.4, spread: 0.01 }),
    ],
  },

  // === SPECIAL GOD / BOSS / CHEAT TIERS ===
  arena_closer: {
    id: 'arena_closer',
    name: 'Arena Closer',
    tier: 5,
    upgradesTo: [],
    description: 'The legendary invincible yellow god tank! Huge cannonball that 1-shots anything.',
    bodyShape: 'circle',
    bodyRadius: 36,
    fovMultiplier: 1.35,
    bodyColor: '#FFE600',
    barrels: [
      { length: 55, width: 38, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.4, recoil: 4.0, bulletSpeed: 18, bulletDamage: 250, bulletHealth: 500, bulletSize: 32, bulletLife: 4.0, spread: 0.02, type: 'bullet' },
    ],
  },

  dominator: {
    id: 'dominator',
    name: 'Dominator',
    tier: 5,
    upgradesTo: [],
    description: 'Titan fortress cannon equipped with heavy base artillery.',
    bodyShape: 'hexagon',
    bodyRadius: 45,
    fovMultiplier: 1.4,
    bodyColor: '#FFD600',
    barrels: [
      { length: 65, width: 48, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 1.2, recoil: 10.0, bulletSpeed: 14, bulletDamage: 180, bulletHealth: 350, bulletSize: 38, bulletLife: 4.0, spread: 0.02, type: 'bullet' },
    ],
  },

  mothership: {
    id: 'mothership',
    name: 'Mothership',
    tier: 5,
    upgradesTo: [],
    description: 'Colossal drone mothership commanding an armada of 32 guided drones.',
    bodyShape: 'octagon',
    bodyRadius: 50,
    fovMultiplier: 1.3,
    maxDrones: 32,
    droneType: 'minion',
    barrels: [
      { length: 48, width: 34, angleOffset: 0, offsetX: 0, offsetY: 0, reloadMultiplier: 0.8, recoil: 1.0, bulletSpeed: 9.0, bulletDamage: 35, bulletHealth: 45, bulletSize: 14, bulletLife: 25.0, spread: 0.05, delay: 0.0, type: 'drone' },
      { length: 48, width: 34, angleOffset: Math.PI / 2, offsetX: 0, offsetY: 0, reloadMultiplier: 0.8, recoil: 1.0, bulletSpeed: 9.0, bulletDamage: 35, bulletHealth: 45, bulletSize: 14, bulletLife: 25.0, spread: 0.05, delay: 0.25, type: 'drone' },
      { length: 48, width: 34, angleOffset: Math.PI, offsetX: 0, offsetY: 0, reloadMultiplier: 0.8, recoil: 1.0, bulletSpeed: 9.0, bulletDamage: 35, bulletHealth: 45, bulletSize: 14, bulletLife: 25.0, spread: 0.05, delay: 0.5, type: 'drone' },
      { length: 48, width: 34, angleOffset: -Math.PI / 2, offsetX: 0, offsetY: 0, reloadMultiplier: 0.8, recoil: 1.0, bulletSpeed: 9.0, bulletDamage: 35, bulletHealth: 45, bulletSize: 14, bulletLife: 25.0, spread: 0.05, delay: 0.75, type: 'drone' },
    ],
  },
};

export function getAvailableUpgrades(currentTankId: string, level: number): string[] {
  const current = TANKS[currentTankId] || TANKS['basic'];

  if (level >= 45 && current.tier < 4) {
    if (current.tier === 3) {
      return current.upgradesTo.filter(id => TANKS[id]);
    }
  }

  if (level >= 30 && current.tier < 3) {
    if (current.tier === 2) {
      return current.upgradesTo.filter(id => TANKS[id]);
    }
  }

  if (level >= 15 && current.tier < 2) {
    if (current.tier === 1) {
      return current.upgradesTo.filter(id => TANKS[id]);
    }
  }

  return [];
}
