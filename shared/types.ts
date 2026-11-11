/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameModeId =
  | 'ffa'
  | '2tdm'
  | '4tdm'
  | 'maze'
  | 'siege'
  | 'domination'
  | 'survival'
  | 'juggernaut'
  | 'sandbox';

export type TeamColor = 'blue' | 'red' | 'green' | 'yellow' | 'neutral' | 'boss';

export interface StatAllocation {
  movementSpeed: number;
  reload: number;
  bulletDamage: number;
  bulletPenetration: number;
  bulletSpeed: number;
  bodyDamage: number;
  maxHealth: number;
  healthRegen: number;
}

export type StatKey = keyof StatAllocation;

export const STAT_KEYS: StatKey[] = [
  'movementSpeed',
  'reload',
  'bulletDamage',
  'bulletPenetration',
  'bulletSpeed',
  'bodyDamage',
  'maxHealth',
  'healthRegen',
];

export const STAT_NAMES: Record<StatKey, string> = {
  movementSpeed: 'Movement Speed',
  reload: 'Reload',
  bulletDamage: 'Bullet Damage',
  bulletPenetration: 'Bullet Penetration',
  bulletSpeed: 'Bullet Speed',
  bodyDamage: 'Body Damage',
  maxHealth: 'Max Health',
  healthRegen: 'Health Regen',
};

export const STAT_COLORS: Record<StatKey, string> = {
  movementSpeed: '#00E676',
  reload: '#FF9100',
  bulletDamage: '#FF1744',
  bulletPenetration: '#D500F9',
  bulletSpeed: '#00B0FF',
  bodyDamage: '#76FF03',
  maxHealth: '#FF5252',
  healthRegen: '#FF4081',
};

export interface BarrelDef {
  length: number;
  width: number;
  angleOffset: number; // in radians
  offsetX: number;
  offsetY: number;
  reloadMultiplier: number;
  recoil: number;
  bulletSpeed: number;
  bulletDamage: number;
  bulletHealth: number;
  bulletSize: number;
  bulletLife: number; // in seconds
  spread: number;
  type?: 'bullet' | 'drone' | 'trap' | 'missile' | 'swarm' | 'skimmer_missile';
  delay?: number; // 0 to 1 cycle delay
  barrelColor?: string;
  isFixedDroneSpawner?: boolean;
}

export interface AutoTurretDef {
  radius: number;
  offsetDist: number;
  angleOffset: number;
  barrels: BarrelDef[];
}

export interface TankDef {
  id: string;
  name: string;
  tier: 1 | 2 | 3 | 4 | 5;
  upgradesFrom?: string;
  upgradesTo: string[];
  description: string;
  bodyShape: 'circle' | 'hexagon' | 'square' | 'spiked' | 'octagon';
  bodyRadius: number;
  fovMultiplier: number;
  barrels: BarrelDef[];
  autoTurrets?: AutoTurretDef[];
  maxDrones?: number;
  droneType?: 'minion' | 'swarm' | 'square' | 'protector' | 'factory_tank';
  maxTraps?: number;
  isRammer?: boolean;
  hasInvisibility?: boolean;
  canConvertShapes?: boolean; // Necromancer ability
  bodyColor?: string;
}

export type ShapeType = 'egg' | 'square' | 'triangle' | 'pentagon' | 'beta_pentagon' | 'alpha_pentagon' | 'crasher';

export interface ShapeDef {
  type: ShapeType;
  sides: number;
  radius: number;
  maxHealth: number;
  damage: number;
  xp: number;
  color: string;
  strokeColor: string;
}

export interface WallObstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isDestructible?: boolean;
  health?: number;
  maxHealth?: number;
}

export interface PlayerInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  mouseX: number; // World coord
  mouseY: number; // World coord
  angle: number;
  isShooting: boolean;
  isRepellingDrones?: boolean; // Right click
  autoFire: boolean;
  autoSpin: boolean;
}

export interface ClientPlayerView {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  tankId: string;
  score: number;
  level: number;
  health: number;
  maxHealth: number;
  shield?: number;
  team: TeamColor;
  color: string;
  invisibility: number; // 0 = fully visible, 1 = invisible
  isDead: boolean;
  killCount: number;
  statPoints: number;
  stats: StatAllocation;
  availableUpgrades: string[];
  recoilOffsets: number[];
  autoTurretAngles?: number[];
  isBot?: boolean;
  botTier?: 'noob' | 'normal' | 'pro';
  isGodmode?: boolean;
  rainbowSkin?: boolean;
  isJuggernaut?: boolean;
}

export interface ProjectileView {
  id: string;
  ownerId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  team: TeamColor;
  type: 'bullet' | 'drone' | 'trap' | 'missile' | 'swarm' | 'crasher' | 'skimmer_missile';
  angle: number;
  healthRatio: number;
  shapeSides?: number;
}

export interface ShapeEntityView {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  angle: number;
  sides: number;
  radius: number;
  color: string;
  healthRatio: number;
}

export interface BossEntityView {
  id: string;
  name: string;
  x: number;
  y: number;
  angle: number;
  health: number;
  maxHealth: number;
  radius: number;
  color: string;
  bossType: 'guardian' | 'fallen_overlord' | 'summoner' | 'dominator';
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  level: number;
  tankName: string;
  team: TeamColor;
  color: string;
  isSelf?: boolean;
  isPro?: boolean;
}

export interface KillFeedEntry {
  id: string;
  killerName: string;
  killerTank: string;
  killerTeam: TeamColor;
  victimName: string;
  victimTank: string;
  victimTeam: TeamColor;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  senderTeam: TeamColor;
  text: string;
  timestamp: number;
}

export interface GameStateSnapshot {
  t: number; // timestamp
  players: ClientPlayerView[];
  projectiles: ProjectileView[];
  shapes: ShapeEntityView[];
  bosses: BossEntityView[];
  walls: WallObstacle[];
  leaderboard: LeaderboardEntry[];
  arenaSize: number;
  mode: GameModeId;
  teamScores?: Record<TeamColor, number>;
  zoneRadius?: number; // For survival mode storm zone
}

export interface ServerInitPayload {
  selfId: string;
  arenaSize: number;
  mode: GameModeId;
  walls: WallObstacle[];
  team: TeamColor;
}

export interface DeathReport {
  killerName: string;
  killerTank: string;
  score: number;
  level: number;
  timeAliveSec: number;
  kills: number;
  shapesDestroyed: number;
}
