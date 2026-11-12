/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WebSocket } from 'ws';
import {
  GameModeId,
  TeamColor,
  StatAllocation,
  PlayerInput,
  ClientPlayerView,
  ProjectileView,
  ShapeEntityView,
  BossEntityView,
  WallObstacle,
  LeaderboardEntry,
  KillFeedEntry,
  GameStateSnapshot,
  ShapeType,
  ChatMessage,
  STAT_KEYS,
} from '../shared/types.ts';
import { TANKS, LEVEL_EXP_TABLE, MAX_LEVEL, getAvailableUpgrades, getLevelFromExp, getExpForLevel, getSizeScale } from '../shared/tanks.ts';
import { SHAPE_CONFIGS } from '../shared/shapes.ts';

interface ServerPlayer {
  id: string;
  ws?: WebSocket;
  name: string;
  isBot: boolean;
  botTier?: 'noob' | 'normal' | 'pro';
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  tankId: string;
  score: number;
  exp: number;
  level: number;
  health: number;
  maxHealth: number;
  team: TeamColor;
  color: string;
  statPoints: number;
  stats: StatAllocation;
  input: PlayerInput;
  lastDamageTime: number;
  lastShootTime: number[];
  recoilOffsets: number[];
  autoTurretAngles?: number[];
  killCount: number;
  shapesDestroyed: number;
  spawnTime: number;
  invisibility: number;
  isDead: boolean;
  dronesCount: number;
  trapsCount: number;
  isGodmode?: boolean;
  rainbowSkin?: boolean;
  isJuggernaut?: boolean;
  dodgeDir?: number;
  isZombie?: boolean;
}

interface ServerProjectile {
  id: string;
  ownerId: string;
  ownerTeam: TeamColor;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  team: TeamColor;
  type: 'bullet' | 'drone' | 'trap' | 'missile' | 'swarm' | 'crasher' | 'skimmer_missile';
  angle: number;
  damage: number;
  health: number;
  maxHealth: number;
  createdAt: number;
  lifeTime: number;
  shapeSides?: number;
  isRepelling?: boolean;
}

interface ServerShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  rotationSpeed: number;
  sides: number;
  radius: number;
  color: string;
  health: number;
  maxHealth: number;
  damage: number;
  xp: number;
}

interface ServerBoss {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  health: number;
  maxHealth: number;
  radius: number;
  color: string;
  bossType: 'guardian' | 'fallen_overlord' | 'summoner' | 'dominator';
  lastShootTime: number;
  spawnCrasherCooldown: number;
}

const TANK_COLORS = [
  '#00B0FF', // Cyan / Light Blue
  '#00E676', // Bright Green
  '#FF5252', // Coral Red
  '#FFD600', // Gold Yellow
  '#FF4081', // Pink
  '#E040FB', // Purple
  '#7C4DFF', // Indigo
  '#FF6E40', // Orange
];

const BOT_NAMES_NOOB = ['NoobSlayer', 'Tập Bắn', 'Gà Mới', 'Potato', 'Beginner', 'Rookie', 'Newbie', 'Farmer'];
const BOT_NAMES_NORMAL = ['Vector', 'Shadow', 'Nova', 'Echo', 'Nexus', 'Blitz', 'Phoenix', 'Quantum', 'Glitch', 'Striker'];
const BOT_NAMES_PRO = ['APEX_PREDATOR', 'GOD_AIM', 'VN_CHAMPION', 'VORTEX_PRO', 'HYDRA_ELITE', 'OVERLORD_KING', 'SNIPER_GOD'];

// Elite tanks preferred by PRO bots
const PRO_BOT_TANKS = ['overlord', 'annihilator', 'booster', 'fighter', 'octo_tank', 'triplet', 'streamliner', 'factory'];

export class GameRoom {
  public id: string;
  public mode: GameModeId;
  public arenaSize: number = 4000;
  public zoneRadius: number = 2000; // For survival mode
  public players: Map<string, ServerPlayer> = new Map();
  public projectiles: Map<string, ServerProjectile> = new Map();
  public shapes: Map<string, ServerShape> = new Map();
  public bosses: Map<string, ServerBoss> = new Map();
  public walls: WallObstacle[] = [];
  public killFeed: KillFeedEntry[] = [];
  public chatMessages: ChatMessage[] = [];
  public targetBotCount: number = 0; // Bots removed from regular modes to eliminate lag!

  // Zombie Mode Wave State
  public zombieWave: number = 1;
  public zombieWaveState: 'countdown' | 'wave_active' | 'wave_cleared' = 'countdown';
  public zombieWaveCountdown: number = 5;
  public totalZombiesInWave: number = 0;
  public zombiesRemaining: number = 0;
  private waveClearTimer: number = 0;

  private nextEntityId: number = 1;
  private intervalTimer: NodeJS.Timeout | null = null;
  private lastTickTime: number = Date.now();
  private bossSpawnCooldown: number = 15;

  constructor(id: string, mode: GameModeId) {
    this.id = id;
    this.mode = mode;
    this.setupArena();
  }

  public start() {
    if (this.intervalTimer) return;
    this.initShapes();
    this.initBots();

    this.intervalTimer = setInterval(() => {
      this.tick();
    }, 1000 / 30);
  }

  public stop() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  private generateId(prefix: string): string {
    return `${prefix}_${this.nextEntityId++}`;
  }

  // Bán kính thật của xe tăng = bán kính gốc x hệ số kích thước theo cấp (cứ 10 cấp to thêm 1.05x)
  private bodyRadiusOf(p: ServerPlayer, tankDef?: { bodyRadius: number }): number {
    const def = tankDef || TANKS[p.tankId] || TANKS['basic'];
    return def.bodyRadius * getSizeScale(p.level);
  }

  // Cấp độ vô hạn nhưng mỗi chỉ số tối đa 7 điểm -> không cộng dồn điểm thừa vô ích
  private remainingStatSlots(p: ServerPlayer): number {
    let slots = 0;
    for (const key of STAT_KEYS) {
      slots += Math.max(0, 7 - (p.stats[key] || 0));
    }
    return slots;
  }

  private setupArena() {
    this.zoneRadius = 2200;
    // Bỏ hết bot ở các chế độ thường theo yêu cầu người dùng (không lag, đấu người thật 100%)
    this.targetBotCount = 0;

    if (this.mode === 'maze') {
      this.arenaSize = 3600;
      this.generateMazeWalls();
    } else if (this.mode === '2tdm') {
      this.arenaSize = 4400;
    } else if (this.mode === '4tdm') {
      this.arenaSize = 4800;
    } else if (this.mode === 'siege') {
      this.arenaSize = 3800;
      this.spawnBoss('guardian');
    } else if (this.mode === 'domination') {
      this.arenaSize = 4200;
      this.spawnBoss('dominator');
    } else if (this.mode === 'survival') {
      this.arenaSize = 3600;
      this.zoneRadius = 1800;
    } else if (this.mode === 'juggernaut') {
      this.arenaSize = 4000;
    } else if (this.mode === 'sandbox') {
      this.arenaSize = 2600;
    } else if (this.mode === 'zombie') {
      this.arenaSize = 3800;
      this.zombieWave = 1;
      this.zombieWaveState = 'countdown';
      this.zombieWaveCountdown = 8;
    } else {
      // FFA
      this.arenaSize = 4200;
    }
  }

  private generateMazeWalls() {
    const cellSize = 300;
    const gridCount = Math.floor(this.arenaSize / cellSize);
    const half = this.arenaSize / 2;

    for (let r = 1; r < gridCount - 1; r += 2) {
      for (let c = 1; c < gridCount - 1; c += 2) {
        if (Math.random() < 0.65) {
          const isHorizontal = Math.random() < 0.5;
          const x = -half + c * cellSize;
          const y = -half + r * cellSize;
          this.walls.push({
            id: this.generateId('wall'),
            x: isHorizontal ? x : x - 15,
            y: isHorizontal ? y - 15 : y,
            width: isHorizontal ? cellSize * 1.8 : 30,
            height: isHorizontal ? 30 : cellSize * 1.8,
          });
        }
      }
    }
  }

  private initShapes() {
    const targetShapes = this.mode === 'sandbox' ? 40 : 80;
    for (let i = 0; i < targetShapes; i++) {
      this.spawnRandomShape();
    }
  }

  private initBots() {
    for (let i = 0; i < this.targetBotCount; i++) {
      this.spawnBot();
    }
  }

  public getHumanPlayerCount(): number {
    let count = 0;
    for (const p of this.players.values()) {
      if (!p.isBot) count++;
    }
    return count;
  }

  private spawnRandomShape() {
    const half = this.arenaSize / 2 - 100;
    const nestRadius = 450;
    const isNest = Math.random() < 0.30;

    let x: number, y: number;
    let type: ShapeType = 'square';

    if (isNest && this.mode !== 'maze') {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * nestRadius;
      x = Math.cos(angle) * dist;
      y = Math.sin(angle) * dist;

      const roll = Math.random();
      if (roll < 0.05) type = 'alpha_pentagon';
      else if (roll < 0.22) type = 'beta_pentagon';
      else if (roll < 0.70) type = 'pentagon';
      else type = 'crasher';
    } else {
      x = (Math.random() * 2 - 1) * half;
      y = (Math.random() * 2 - 1) * half;

      const roll = Math.random();
      if (roll < 0.05) type = 'egg';
      else if (roll < 0.60) type = 'square';
      else if (roll < 0.88) type = 'triangle';
      else type = 'pentagon';
    }

    const cfg = SHAPE_CONFIGS[type];
    const shape: ServerShape = {
      id: this.generateId('shp'),
      type,
      x,
      y,
      vx: (Math.random() - 0.5) * (type === 'crasher' ? 1.5 : 0.4),
      vy: (Math.random() - 0.5) * (type === 'crasher' ? 1.5 : 0.4),
      angle: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.03,
      sides: cfg.sides,
      radius: cfg.radius,
      color: cfg.color,
      health: cfg.maxHealth,
      maxHealth: cfg.maxHealth,
      damage: cfg.damage,
      xp: cfg.xp,
    };

    this.shapes.set(shape.id, shape);
  }

  public getSpawnPosition(team: TeamColor): { x: number; y: number } {
    const half = this.arenaSize / 2;
    if (this.mode === '2tdm') {
      if (team === 'blue') {
        return { x: -half + 250 + Math.random() * 200, y: (Math.random() - 0.5) * (half * 0.8) };
      } else {
        return { x: half - 250 - Math.random() * 200, y: (Math.random() - 0.5) * (half * 0.8) };
      }
    } else if (this.mode === '4tdm') {
      const cornerOffset = half - 300;
      switch (team) {
        case 'blue': return { x: -cornerOffset + Math.random() * 150, y: -cornerOffset + Math.random() * 150 };
        case 'red': return { x: cornerOffset - Math.random() * 150, y: -cornerOffset + Math.random() * 150 };
        case 'green': return { x: -cornerOffset + Math.random() * 150, y: cornerOffset - Math.random() * 150 };
        case 'yellow': return { x: cornerOffset - Math.random() * 150, y: cornerOffset - Math.random() * 150 };
        default: break;
      }
    }

    const angle = Math.random() * Math.PI * 2;
    const dist = 400 + Math.random() * (Math.min(half - 600, this.zoneRadius - 100));
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
  }

  private assignTeam(): TeamColor {
    if (this.mode === 'zombie') {
      return 'blue'; // Survivors
    }
    if (this.mode === '2tdm') {
      let blue = 0, red = 0;
      this.players.forEach(p => {
        if (p.team === 'blue') blue++;
        if (p.team === 'red') red++;
      });
      return blue <= red ? 'blue' : 'red';
    } else if (this.mode === '4tdm') {
      const counts: Record<TeamColor, number> = { blue: 0, red: 0, green: 0, yellow: 0, neutral: 0, boss: 0, zombie: 0 };
      this.players.forEach(p => counts[p.team]++);
      const teams: TeamColor[] = ['blue', 'red', 'green', 'yellow'];
      teams.sort((a, b) => counts[a] - counts[b]);
      return teams[0];
    }
    return 'neutral';
  }

  public addHumanPlayer(id: string, ws: WebSocket, name: string, preferredColor?: string): ServerPlayer {
    const team = this.assignTeam();
    const spawn = this.getSpawnPosition(team);
    const color = team !== 'neutral'
      ? (team === 'blue' ? '#00B0FF' : team === 'red' ? '#FF5252' : team === 'green' ? '#00E676' : '#FFD600')
      : (preferredColor || TANK_COLORS[Math.floor(Math.random() * TANK_COLORS.length)]);

    const player: ServerPlayer = {
      id,
      ws,
      name: name.trim().slice(0, 16) || 'Tank',
      isBot: false,
      x: spawn.x,
      y: spawn.y,
      vx: 0,
      vy: 0,
      angle: 0,
      tankId: 'basic',
      score: 0,
      exp: 0,
      level: 1,
      health: 100,
      maxHealth: 100,
      team,
      color,
      statPoints: 0,
      stats: {
        movementSpeed: 0,
        reload: 0,
        bulletDamage: 0,
        bulletPenetration: 0,
        bulletSpeed: 0,
        bodyDamage: 0,
        maxHealth: 0,
        healthRegen: 0,
      },
      input: {
        up: false,
        down: false,
        left: false,
        right: false,
        mouseX: spawn.x,
        mouseY: spawn.y,
        angle: 0,
        isShooting: false,
        autoFire: false,
        autoSpin: false,
      },
      lastDamageTime: Date.now(),
      lastShootTime: [0, 0, 0, 0, 0, 0, 0, 0],
      recoilOffsets: [0, 0, 0, 0, 0, 0, 0, 0],
      autoTurretAngles: [0, 0, 0, 0, 0],
      killCount: 0,
      shapesDestroyed: 0,
      spawnTime: Date.now(),
      invisibility: 0,
      isDead: false,
      dronesCount: 0,
      trapsCount: 0,
    };

    if (this.mode === 'sandbox') {
      player.exp = LEVEL_EXP_TABLE[44];
      player.level = 45;
      player.statPoints = 33;
    }

    this.players.set(id, player);
    return player;
  }

  // --- BOT GENERATION WITH 3 TIERS (Noob, Normal, Pro) ---
  private spawnBot() {
    const team = this.assignTeam();
    const spawn = this.getSpawnPosition(team);
    const id = this.generateId('bot');

    const roll = Math.random();
    let botTier: 'noob' | 'normal' | 'pro' = 'normal';
    let botName = '';
    let startLevel = 1;

    if (roll < 0.40) {
      // 40% Noobs
      botTier = 'noob';
      botName = `[Noob] ${BOT_NAMES_NOOB[Math.floor(Math.random() * BOT_NAMES_NOOB.length)]}`;
      startLevel = Math.floor(1 + Math.random() * 14); // Tier 1 or 2
    } else if (roll < 0.80) {
      // 40% Normal
      botTier = 'normal';
      botName = BOT_NAMES_NORMAL[Math.floor(Math.random() * BOT_NAMES_NORMAL.length)];
      startLevel = Math.floor(15 + Math.random() * 20); // Tier 2 or 3
    } else {
      // 20% Pro Bots (Smart, strong tanks!)
      botTier = 'pro';
      botName = `★ ${BOT_NAMES_PRO[Math.floor(Math.random() * BOT_NAMES_PRO.length)]}`;
      startLevel = 45; // Max Level
    }

    const startExp = LEVEL_EXP_TABLE[startLevel - 1] || 0;
    const color = team !== 'neutral'
      ? (team === 'blue' ? '#00B0FF' : team === 'red' ? '#FF5252' : team === 'green' ? '#00E676' : '#FFD600')
      : TANK_COLORS[Math.floor(Math.random() * TANK_COLORS.length)];

    const bot: ServerPlayer = {
      id,
      name: botName,
      isBot: true,
      botTier,
      x: spawn.x,
      y: spawn.y,
      vx: 0,
      vy: 0,
      angle: Math.random() * Math.PI * 2,
      tankId: 'basic',
      score: startExp,
      exp: startExp,
      level: startLevel,
      health: 100,
      maxHealth: 100,
      team,
      color,
      statPoints: startLevel - 1,
      stats: {
        movementSpeed: 0,
        reload: 0,
        bulletDamage: 0,
        bulletPenetration: 0,
        bulletSpeed: 0,
        bodyDamage: 0,
        maxHealth: 0,
        healthRegen: 0,
      },
      input: {
        up: false,
        down: false,
        left: false,
        right: false,
        mouseX: 0,
        mouseY: 0,
        angle: 0,
        isShooting: true,
        autoFire: true,
        autoSpin: false,
      },
      lastDamageTime: Date.now(),
      lastShootTime: [0, 0, 0, 0, 0, 0, 0, 0],
      recoilOffsets: [0, 0, 0, 0, 0, 0, 0, 0],
      autoTurretAngles: [0, 0, 0, 0, 0],
      killCount: 0,
      shapesDestroyed: 0,
      spawnTime: Date.now(),
      invisibility: 0,
      isDead: false,
      dronesCount: 0,
      trapsCount: 0,
      dodgeDir: Math.random() < 0.5 ? 1 : -1,
    };

    if (botTier === 'pro') {
      // Pro bot allocates optimal stats
      bot.stats.bulletDamage = 7;
      bot.stats.bulletPenetration = 7;
      bot.stats.reload = 7;
      bot.stats.movementSpeed = 6;
      bot.stats.maxHealth = 4;
      bot.stats.healthRegen = 2;
      bot.statPoints = 0;
      bot.maxHealth = 100 + bot.stats.maxHealth * 25;
      bot.health = bot.maxHealth;

      // Pick an elite tank
      const proTank = PRO_BOT_TANKS[Math.floor(Math.random() * PRO_BOT_TANKS.length)];
      bot.tankId = proTank;
    } else {
      this.autoAllocateBotStats(bot);
      this.autoUpgradeBotTank(bot);
    }

    this.players.set(id, bot);
  }

  private autoAllocateBotStats(bot: ServerPlayer) {
    const keys: (keyof StatAllocation)[] = [
      'movementSpeed', 'reload', 'bulletDamage', 'bulletPenetration',
      'bulletSpeed', 'bodyDamage', 'maxHealth', 'healthRegen'
    ];
    while (bot.statPoints > 0) {
      const key = keys[Math.floor(Math.random() * keys.length)];
      if (bot.stats[key] < 7) {
        bot.stats[key]++;
        bot.statPoints--;
      } else {
        break;
      }
    }
    bot.maxHealth = 100 + bot.stats.maxHealth * 25;
    bot.health = bot.maxHealth;
  }

  private autoUpgradeBotTank(bot: ServerPlayer) {
    let avail = getAvailableUpgrades(bot.tankId, bot.level);
    while (avail.length > 0) {
      const pick = avail[Math.floor(Math.random() * avail.length)];
      bot.tankId = pick;
      avail = getAvailableUpgrades(bot.tankId, bot.level);
    }
  }

  public removePlayer(id: string) {
    this.players.delete(id);
    for (const [projId, proj] of this.projectiles.entries()) {
      if (proj.ownerId === id) {
        this.projectiles.delete(projId);
      }
    }
  }

  public handlePlayerInput(id: string, input: PlayerInput) {
    const p = this.players.get(id);
    if (!p || p.isDead) return;
    p.input = input;
  }

  public handleStatUpgrade(id: string, statKey: keyof StatAllocation) {
    const p = this.players.get(id);
    if (!p || p.statPoints <= 0) return;
    if (p.stats[statKey] < 7) {
      p.stats[statKey]++;
      p.statPoints--;
      if (statKey === 'maxHealth') {
        const added = 25;
        p.maxHealth += added;
        p.health += added;
      }
    }
  }

  public handleTankUpgrade(id: string, newTankId: string) {
    const p = this.players.get(id);
    if (!p) return;
    if (this.mode === 'sandbox' || p.isGodmode) {
      if (TANKS[newTankId]) {
        p.tankId = newTankId;
      }
      return;
    }
    const avail = getAvailableUpgrades(p.tankId, p.level);
    if (avail.includes(newTankId) && TANKS[newTankId]) {
      p.tankId = newTankId;
    }
  }

  // --- CHEAT CODES HANDLER ---
  public handleCheatCode(id: string, rawCode: string): string {
    const p = this.players.get(id);
    if (!p) return 'Không tìm thấy người chơi';

    const code = rawCode.trim().toLowerCase();

    if (code === 'god' || code === 'godmode' || code === 'bat_tu') {
      p.isGodmode = !p.isGodmode;
      p.health = p.maxHealth;
      return p.isGodmode ? '🛡️ ĐÃ BẬT GOD MODE (BẤT TỬ)!' : '🛡️ ĐÃ TẮT GOD MODE!';
    }

    if (code === 'max' || code === 'level300' || code === 'max_level' || code === 'cap360') {
      p.exp = LEVEL_EXP_TABLE[300];
      p.level = 360;
      p.statPoints = 360;
      return '⭐ ĐÃ LÊN CẤP 300 VÀ NHẬN 300 ĐIỂM NÂNG CẤP!';
    }

    if (code === 'nuke' || code === 'bom' || code === 'bomb') {
      // Vaporize all hostile entities within 900 radius
      let wipedCount = 0;
      for (const [sId, s] of this.shapes.entries()) {
        if (Math.hypot(s.x - p.x, s.y - p.y) < 950) {
          this.handleShapeDestroyed(s, p.id);
          this.shapes.delete(sId);
          wipedCount++;
        }
      }
      for (const other of this.players.values()) {
        if (other.id !== p.id && !other.isDead && (this.mode === 'ffa' || other.team !== p.team)) {
          if (Math.hypot(other.x - p.x, other.y - p.y) < 950) {
            this.handlePlayerKilled(other, p.id);
            wipedCount++;
          }
        }
      }
      return `💣 NUKE TOÀN BẢN ĐỒ! Đã xóa sổ ${wipedCount} mục tiêu!`;
    }

    if (code === 'closer' || code === 'arena_closer') {
      p.tankId = 'arena_closer';
      p.level = 45;
      p.color = '#FFE600';
      p.maxHealth = 2000;
      p.health = 2000;
      return '👑 ĐÃ BIẾN THÀNH HUYỀN THOẠI ARENA CLOSER!';
    }

    if (code === 'dominator') {
      p.tankId = 'dominator';
      p.level = 45;
      p.color = '#FFD600';
      p.maxHealth = 3000;
      p.health = 3000;
      return '🏰 ĐÃ BIẾN THÀNH PHÁO ĐÀI DOMINATOR!';
    }

    if (code === 'mothership') {
      p.tankId = 'mothership';
      p.level = 45;
      p.maxHealth = 4000;
      p.health = 4000;
      return '🛸 ĐÃ BIẾN THÀNH MOTHERSHIP (32 DRONES)!';
    }

    if (code === 'speed' || code === 'turbo' || code === 'toc_do') {
      p.stats.movementSpeed = 15;
      return '⚡ SIÊU TỐC ĐỘ TURBO 3X!';
    }

    if (code === 'score' || code === 'xp' || code === 'tien') {
      p.score += 5000000;
      p.exp += 5000000;
      this.checkLevelUp(p);
      return '💰 +500,0000 ĐIỂM KINH NGHIỆM!';
    }

    if (code === 'rainbow' || code === 'disco') {
      p.rainbowSkin = !p.rainbowSkin;
      return p.rainbowSkin ? '🌈 ĐÃ BẬT SKIN CẦU VỒNG 7 MÀU!' : '🌈 ĐÃ TẮT SKIN CẦU VỒNG!';
    }

    if (code === 'heal' || code === 'hoi_mau') {
      p.health = p.maxHealth;
      return '❤️ ĐÃ HỒI ĐẦY 100% MÁU!';
    }

    if (code === 'boss') {
      this.spawnBoss('guardian');
      return '👹 ĐÃ TRIỆU HỒI GUARDIAN BOSS!';
    }

    return `❓ Lệnh không rõ: "${code}". Các lệnh hợp lệ: god, max, nuke, closer, dominator, mothership, speed, score, rainbow, heal, boss`;
  }

  public handleSandboxAction(id: string, action: string, data?: any) {
    const p = this.players.get(id);
    if (!p) return;

    if (action === 'cheat') {
      this.handleCheatCode(id, data?.code || '');
    } else if (action === 'max_level') {
      p.exp = LEVEL_EXP_TABLE[44];
      p.level = 45;
      p.statPoints = 33;
    } else if (action === 'set_tank' && data?.tankId && TANKS[data.tankId]) {
      p.tankId = data.tankId;
    } else if (action === 'heal') {
      p.health = p.maxHealth;
    } else if (action === 'spawn_boss') {
      this.spawnBoss(data?.bossType || 'guardian');
    } else if (action === 'spawn_shapes') {
      for (let i = 0; i < 20; i++) this.spawnRandomShape();
    } else if (action === 'spawn_bot') {
      this.spawnBot();
    }
  }

  private spawnBoss(bossType: 'guardian' | 'fallen_overlord' | 'summoner' | 'dominator') {
    const bossId = this.generateId('boss');
    let name = 'Guardian of the Pentagons';
    let color = '#F48FB1';
    let maxHealth = 12000;
    let radius = 65;

    if (bossType === 'fallen_overlord') {
      name = 'Fallen Overlord';
      color = '#78909C';
      maxHealth = 18000;
      radius = 70;
    } else if (bossType === 'summoner') {
      name = 'The Summoner';
      color = '#FFE082';
      maxHealth = 22000;
      radius = 75;
    } else if (bossType === 'dominator') {
      name = 'Neutral Dominator';
      color = '#FFD600';
      maxHealth = 25000;
      radius = 60;
    }

    const boss: ServerBoss = {
      id: bossId,
      name,
      x: (Math.random() - 0.5) * 600,
      y: (Math.random() - 0.5) * 600,
      vx: 0,
      vy: 0,
      angle: 0,
      health: maxHealth,
      maxHealth,
      radius,
      color,
      bossType,
      lastShootTime: Date.now(),
      spawnCrasherCooldown: 0,
    };

    this.bosses.set(bossId, boss);
  }

  // --- CORE GAME TICK ---
  private tick() {
    const now = Date.now();
    const dt = Math.min(0.06, (now - this.lastTickTime) / 1000);
    this.lastTickTime = now;

    const humanCount = this.getHumanPlayerCount();
    // GIẢM LAG TRIỆT ĐỂ: Nếu phòng không có người chơi thật nào, dừng tính toán vật lý & broadcast để tiết kiệm 95% CPU!
    if (humanCount === 0) {
      // Giữ một lượng shape tối thiểu và không chạy loop nặng
      if (this.shapes.size < 40 && Math.random() < 0.1) {
        this.spawnRandomShape();
      }
      return;
    }

    // Zombie mode wave logic
    if (this.mode === 'zombie') {
      this.updateZombieWave(dt);
    }

    // Survival mode shrinking zone
    if (this.mode === 'survival' && this.zoneRadius > 350) {
      this.zoneRadius -= dt * 15;
    }

    // Rainbow skin cycling
    for (const p of this.players.values()) {
      if (p.rainbowSkin) {
        const hue = (now / 15) % 360;
        p.color = `hsl(${hue}, 90%, 55%)`;
      }
    }

    // Maintain bot count (Chỉ spawn bot khi targetBotCount > 0, các chế độ thường bot = 0)
    let botCount = 0;
    for (const p of this.players.values()) {
      if (p.isBot && !p.isZombie) botCount++;
    }
    if (botCount < this.targetBotCount) {
      this.spawnBot();
    }

    // Maintain shapes (Giảm từ 200 xuống 80 để game siêu mượt, không giật lag)
    const targetShapes = this.mode === 'sandbox' ? 40 : 80;
    if (this.shapes.size < targetShapes && Math.random() < 0.35) {
      this.spawnRandomShape();
    }

    // Periodic boss in siege
    if (this.mode === 'siege' && this.bosses.size < 2) {
      this.bossSpawnCooldown -= dt;
      if (this.bossSpawnCooldown <= 0) {
        this.bossSpawnCooldown = 30;
        const types: ('guardian' | 'fallen_overlord' | 'summoner')[] = ['guardian', 'fallen_overlord', 'summoner'];
        this.spawnBoss(types[Math.floor(Math.random() * types.length)]);
      }
    }

    this.updateBotsAI(dt);
    this.updateBosses(dt, now);

    for (const p of this.players.values()) {
      if (p.isDead) continue;
      this.updatePlayer(p, dt, now);
    }

    this.updateProjectiles(dt, now);
    this.updateShapes(dt);
    this.handleCollisions();
    this.broadcastSnapshot();
  }

  // --- ZOMBIE MODE WAVE LOGIC ---
  private updateZombieWave(dt: number) {
    if (this.zombieWaveState === 'countdown') {
      this.zombieWaveCountdown -= dt;
      if (this.zombieWaveCountdown <= 0) {
        this.startZombieWave();
      }
    } else if (this.zombieWaveState === 'wave_active') {
      let aliveZombies = 0;
      for (const p of this.players.values()) {
        if (p.isZombie && !p.isDead) aliveZombies++;
      }
      this.zombiesRemaining = aliveZombies;

      if (aliveZombies === 0) {
        this.zombieWaveState = 'wave_cleared';
        this.waveClearTimer = 5;

        // Thưởng lớn cho tất cả người chơi sống sót
        const bonusScore = this.zombieWave * 5000;
        for (const p of this.players.values()) {
          if (!p.isBot && !p.isDead) {
            p.score += bonusScore;
            p.exp += bonusScore;
            p.health = p.maxHealth;
            this.checkLevelUp(p);
          }
        }
        this.broadcastSystemChat(`🎉 WAVE ${this.zombieWave} ĐÃ BỊ QUÉT SẠCH! +${bonusScore} Điểm & Hồi 100% Máu!`);
      }
    } else if (this.zombieWaveState === 'wave_cleared') {
      this.waveClearTimer -= dt;
      if (this.waveClearTimer <= 0) {
        this.zombieWave++;
        this.zombieWaveState = 'countdown';
        this.zombieWaveCountdown = 8;
        this.broadcastSystemChat(`⚠️ CẢNH BÁO: WAVE ${this.zombieWave} SẮP ĐẾN TRONG 8 GIÂY!`);
      }
    }
  }

  private startZombieWave() {
    this.zombieWaveState = 'wave_active';
    // Chế độ Zombie đã được giảm độ khó: ít zombie hơn, yếu hơn, chậm hơn và bắn kém chính xác hơn
    const zombieCount = Math.min(30, 3 + this.zombieWave * 2);
    this.totalZombiesInWave = zombieCount;
    this.zombiesRemaining = zombieCount;

    const zombieTanks = this.zombieWave >= 12
      ? ['destroyer', 'booster', 'hybrid', 'twin', 'machine_gun']
      : this.zombieWave >= 6
      ? ['destroyer', 'machine_gun', 'twin', 'flank_guard', 'smasher']
      : this.zombieWave >= 3
      ? ['machine_gun', 'twin', 'flank_guard', 'smasher', 'basic']
      : ['basic', 'twin', 'smasher'];

    const half = this.arenaSize / 2 - 140;

    for (let i = 0; i < zombieCount; i++) {
      const zId = this.generateId('zombie');
      const edge = Math.floor(Math.random() * 4);
      let sx = 0, sy = 0;
      if (edge === 0) { sx = -half + Math.random() * 150; sy = -half + Math.random() * (half * 2); }
      else if (edge === 1) { sx = half - Math.random() * 150; sy = -half + Math.random() * (half * 2); }
      else if (edge === 2) { sx = -half + Math.random() * (half * 2); sy = -half + Math.random() * 150; }
      else { sx = -half + Math.random() * (half * 2); sy = half - Math.random() * 150; }

      const tankId = zombieTanks[Math.floor(Math.random() * zombieTanks.length)];
      const tankDef = TANKS[tankId] || TANKS['basic'];

      const waveLevel = Math.min(30, 2 + this.zombieWave * 2);
      const isFast = Math.random() < 0.25;
      const isTanky = Math.random() < 0.15;
      const baseHealth = (70 + this.zombieWave * 18) * (isTanky ? 1.7 : 1.0);

      const zombiePlayer: ServerPlayer = {
        id: zId,
        name: `🧟 Zombie W${this.zombieWave}`,
        isBot: true,
        isZombie: true,
        botTier: 'normal',
        x: sx,
        y: sy,
        vx: 0,
        vy: 0,
        angle: 0,
        tankId: tankId,
        score: this.zombieWave * 1500,
        exp: 0,
        level: waveLevel,
        health: baseHealth,
        maxHealth: baseHealth,
        team: 'zombie',
        color: '#22C55E', // Infected Zombie Lime Green
        statPoints: 0,
        stats: {
          movementSpeed: isFast ? 3 : 1,
          reload: Math.min(4, Math.floor(this.zombieWave / 3)),
          bulletDamage: Math.min(4, Math.floor((this.zombieWave + 1) / 3)),
          bulletPenetration: Math.min(3, Math.floor(this.zombieWave / 3)),
          bulletSpeed: 1,
          bodyDamage: Math.min(3, Math.floor(this.zombieWave / 3)),
          maxHealth: 0,
          healthRegen: 0,
        },
        input: { up: false, down: false, left: false, right: false, isShooting: true, mouseX: 0, mouseY: 0, angle: 0, isRepellingDrones: false, autoFire: true, autoSpin: false },
        lastDamageTime: 0,
        lastShootTime: new Array(tankDef.barrels.length).fill(0),
        recoilOffsets: new Array(tankDef.barrels.length).fill(0),
        killCount: 0,
        shapesDestroyed: 0,
        spawnTime: Date.now(),
        invisibility: 0,
        isDead: false,
        dronesCount: 0,
        trapsCount: 0,
      };

      this.players.set(zId, zombiePlayer);
    }

    if (this.zombieWave % 10 === 0) {
      this.spawnBoss('guardian');
      const boss = Array.from(this.bosses.values()).pop();
      if (boss) {
        boss.maxHealth = Math.round(boss.maxHealth * 0.5);
        boss.health = boss.maxHealth;
        boss.name = `☠️ CHÚA TỂ ZOMBIE (WAVE ${this.zombieWave})`;
        boss.color = '#15803D';
      }
    }

    this.broadcastSystemChat(`🧟 WAVE ${this.zombieWave} ĐÃ XUẤT HIỆN! ${zombieCount} Quái Zombie đang tấn công!`);
  }

  // --- INTELLIGENT BOT BEHAVIOR (Differentiated by Tier) ---
  private updateBotsAI(dt: number) {
    for (const bot of this.players.values()) {
      if (!bot.isBot || bot.isDead) continue;

      // Zombie AI: Săn lùng và vây hãm người chơi gần nhất với tốc độ cao
      if (bot.isZombie) {
        let closestHuman: ServerPlayer | null = null;
        let minDist = 999999;
        for (const p of this.players.values()) {
          if (!p.isBot && !p.isDead) {
            const d = Math.hypot(p.x - bot.x, p.y - bot.y);
            if (d < minDist) {
              minDist = d;
              closestHuman = p;
            }
          }
        }

        if (closestHuman) {
          const trueAngle = Math.atan2(closestHuman.y - bot.y, closestHuman.x - bot.x);
          // Zombie ngắm kém chính xác và chỉ bắn khi người chơi ở trong tầm
          const aimAngle = trueAngle + (Math.random() - 0.5) * 0.45;
          bot.angle = aimAngle;
          bot.input.mouseX = bot.x + Math.cos(aimAngle) * Math.max(120, minDist);
          bot.input.mouseY = bot.y + Math.sin(aimAngle) * Math.max(120, minDist);
          bot.input.isShooting = minDist < 600;

          // Tiến lại gần nhưng dừng ở khoảng cách ~340px thay vì lao vào đâm người chơi
          if (minDist > 340) {
            bot.input.up = Math.sin(trueAngle) < -0.12;
            bot.input.down = Math.sin(trueAngle) > 0.12;
            bot.input.left = Math.cos(trueAngle) < -0.12;
            bot.input.right = Math.cos(trueAngle) > 0.12;
          } else {
            bot.input.up = false;
            bot.input.down = false;
            bot.input.left = false;
            bot.input.right = false;
          }
        } else {
          const aimAngle = Math.atan2(-bot.y, -bot.x);
          bot.angle = aimAngle;
          bot.input.isShooting = false;
          bot.input.up = Math.sin(aimAngle) < -0.2;
          bot.input.down = Math.sin(aimAngle) > 0.2;
          bot.input.left = Math.cos(aimAngle) < -0.2;
          bot.input.right = Math.cos(aimAngle) > 0.2;
        }
        continue;
      }

      const tier = bot.botTier || 'normal';

      let nearestThreat: { x: number; y: number; dist: number; isEnemy: boolean } | null = null;
      let nearestShape: { x: number; y: number; dist: number } | null = null;

      // 1. Scan for other players
      for (const other of this.players.values()) {
        if (other.id === bot.id || other.isDead) continue;
        if (this.mode !== 'ffa' && this.mode !== 'maze' && other.team === bot.team) continue;
        const dist = Math.hypot(other.x - bot.x, other.y - bot.y);
        const scanRange = tier === 'pro' ? 950 : tier === 'normal' ? 700 : 500;
        if (dist < scanRange) {
          if (!nearestThreat || dist < nearestThreat.dist) {
            nearestThreat = { x: other.x, y: other.y, dist, isEnemy: true };
          }
        }
      }

      // 2. Scan for shapes
      if (!nearestThreat) {
        for (const shape of this.shapes.values()) {
          const dist = Math.hypot(shape.x - bot.x, shape.y - bot.y);
          if (dist < 550) {
            if (!nearestShape || dist < nearestShape.dist) {
              nearestShape = { x: shape.x, y: shape.y, dist };
            }
          }
        }
      }

      // 3. Scan for bosses
      if (!nearestThreat && this.bosses.size > 0) {
        for (const boss of this.bosses.values()) {
          const dist = Math.hypot(boss.x - bot.x, boss.y - bot.y);
          if (dist < 800) {
            nearestThreat = { x: boss.x, y: boss.y, dist, isEnemy: true };
            break;
          }
        }
      }

      // 4. Decision making based on tier
      if (nearestThreat) {
        let aimAngle = Math.atan2(nearestThreat.y - bot.y, nearestThreat.x - bot.x);

        if (tier === 'noob') {
          // Noob has bad aim, adds random offset
          aimAngle += (Math.random() - 0.5) * 0.35;
          bot.angle = aimAngle;
          bot.input.mouseX = bot.x + Math.cos(aimAngle) * 300;
          bot.input.mouseY = bot.y + Math.sin(aimAngle) * 300;
          bot.input.isShooting = true;

          // Noob rushes blindly or runs randomly
          bot.input.up = Math.sin(aimAngle) < -0.2;
          bot.input.down = Math.sin(aimAngle) > 0.2;
          bot.input.left = Math.cos(aimAngle) < -0.2;
          bot.input.right = Math.cos(aimAngle) > 0.2;
        } else if (tier === 'pro') {
          // PRO bot leads shots, circles target, dodges bullets!
          bot.angle = aimAngle;
          bot.input.mouseX = nearestThreat.x;
          bot.input.mouseY = nearestThreat.y;
          bot.input.isShooting = true;

          if (bot.health < bot.maxHealth * 0.35) {
            // Tactical retreat while suppressing
            const retreatAngle = aimAngle + Math.PI;
            bot.input.up = Math.sin(retreatAngle) < -0.2;
            bot.input.down = Math.sin(retreatAngle) > 0.2;
            bot.input.left = Math.cos(retreatAngle) < -0.2;
            bot.input.right = Math.cos(retreatAngle) > 0.2;
          } else {
            // Strafe & circle
            const strafeAngle = aimAngle + (Math.PI / 2) * (bot.dodgeDir || 1);
            if (Math.random() < 0.05) bot.dodgeDir = (bot.dodgeDir || 1) * -1;

            bot.input.up = Math.sin(strafeAngle) < -0.2;
            bot.input.down = Math.sin(strafeAngle) > 0.2;
            bot.input.left = Math.cos(strafeAngle) < -0.2;
            bot.input.right = Math.cos(strafeAngle) > 0.2;
          }
        } else {
          // Normal bot
          bot.angle = aimAngle;
          bot.input.mouseX = nearestThreat.x;
          bot.input.mouseY = nearestThreat.y;
          bot.input.isShooting = true;

          if (bot.health < bot.maxHealth * 0.3) {
            const retreatAngle = aimAngle + Math.PI;
            bot.input.up = Math.sin(retreatAngle) < -0.3;
            bot.input.down = Math.sin(retreatAngle) > 0.3;
            bot.input.left = Math.cos(retreatAngle) < -0.3;
            bot.input.right = Math.cos(retreatAngle) > 0.3;
          } else {
            const moveAngle = aimAngle + (nearestThreat.dist < 320 ? Math.PI * 0.5 : 0);
            bot.input.up = Math.sin(moveAngle) < -0.3;
            bot.input.down = Math.sin(moveAngle) > 0.3;
            bot.input.left = Math.cos(moveAngle) < -0.3;
            bot.input.right = Math.cos(moveAngle) > 0.3;
          }
        }
      } else if (nearestShape) {
        const aimAngle = Math.atan2(nearestShape.y - bot.y, nearestShape.x - bot.x);
        bot.angle = aimAngle;
        bot.input.mouseX = nearestShape.x;
        bot.input.mouseY = nearestShape.y;
        bot.input.isShooting = true;

        bot.input.up = Math.sin(aimAngle) < -0.3;
        bot.input.down = Math.sin(aimAngle) > 0.3;
        bot.input.left = Math.cos(aimAngle) < -0.3;
        bot.input.right = Math.cos(aimAngle) > 0.3;
      } else {
        bot.angle += (Math.random() - 0.5) * 0.08;
        bot.input.up = Math.sin(bot.angle) < -0.3;
        bot.input.down = Math.sin(bot.angle) > 0.3;
        bot.input.left = Math.cos(bot.angle) < -0.3;
        bot.input.right = Math.cos(bot.angle) > 0.3;
        bot.input.isShooting = false;
      }

      if (bot.statPoints > 0) {
        this.autoAllocateBotStats(bot);
      }
      if (tier !== 'pro') {
        this.autoUpgradeBotTank(bot);
      }
    }
  }

  private updatePlayer(p: ServerPlayer, dt: number, now: number) {
    const tankDef = TANKS[p.tankId] || TANKS['basic'];

    if (p.input.autoSpin) {
      p.angle += 0.04;
    } else if (!p.isBot) {
      p.angle = Math.atan2(p.input.mouseY - p.y, p.input.mouseX - p.x);
    }

    const baseSpeed = 270 + p.stats.movementSpeed * 32;
    let moveX = 0;
    let moveY = 0;

    if (p.input.up) moveY -= 1;
    if (p.input.down) moveY += 1;
    if (p.input.left) moveX -= 1;
    if (p.input.right) moveX += 1;

    if (moveX !== 0 && moveY !== 0) {
      const len = Math.SQRT2;
      moveX /= len;
      moveY /= len;
    }

    const accel = 1900;
    p.vx += moveX * accel * dt;
    p.vy += moveY * accel * dt;

    const drag = 0.90;
    p.vx *= drag;
    p.vy *= drag;

    const currentSpeed = Math.hypot(p.vx, p.vy);
    if (currentSpeed > baseSpeed) {
      p.vx = (p.vx / currentSpeed) * baseSpeed;
      p.vy = (p.vy / currentSpeed) * baseSpeed;
    }

    if (tankDef.hasInvisibility) {
      const isMoving = currentSpeed > 10 || p.input.isShooting;
      if (isMoving) {
        p.invisibility = Math.max(0, p.invisibility - dt * 3.0);
      } else {
        p.invisibility = Math.min(1, p.invisibility + dt * 0.4);
      }
    } else {
      p.invisibility = 0;
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Survival mode storm boundary damage
    if (this.mode === 'survival') {
      const distFromCenter = Math.hypot(p.x, p.y);
      if (distFromCenter > this.zoneRadius && !p.isGodmode) {
        p.health -= 18 * dt;
        p.lastDamageTime = now;
        if (p.health <= 0) {
          this.handlePlayerKilled(p, 'The Red Storm Barrier');
        }
      }
    }

    // Boundary clamp
    const bodyR = this.bodyRadiusOf(p, tankDef);
    const half = this.arenaSize / 2 - bodyR;
    if (p.x < -half) { p.x = -half; p.vx = 0; }
    if (p.x > half) { p.x = half; p.vx = 0; }
    if (p.y < -half) { p.y = -half; p.vy = 0; }
    if (p.y > half) { p.y = half; p.vy = 0; }

    this.handleWallCollision(p, bodyR);

    const timeSinceDamage = (now - p.lastDamageTime) / 1000;
    if (timeSinceDamage > 2.5 && p.health < p.maxHealth) {
      const regenRate = (p.maxHealth * 0.10) + p.stats.healthRegen * (p.maxHealth * 0.045);
      p.health = Math.min(p.maxHealth, p.health + regenRate * dt);
    }

    for (let i = 0; i < p.recoilOffsets.length; i++) {
      if (p.recoilOffsets[i] > 0) {
        p.recoilOffsets[i] = Math.max(0, p.recoilOffsets[i] - dt * 45);
      }
    }

    if (tankDef.autoTurrets && tankDef.autoTurrets.length > 0) {
      this.updateAutoTurrets(p, dt, now);
    }

    const wantsToShoot = p.input.isShooting || p.input.autoFire;
    if (wantsToShoot && tankDef.barrels.length > 0) {
      this.firePlayerBarrels(p, tankDef.barrels, p.angle, now);
    }
  }

  private handleWallCollision(entity: { x: number; y: number; vx: number; vy: number }, radius: number) {
    if (this.walls.length === 0) return;
    for (const wall of this.walls) {
      const closestX = Math.max(wall.x - wall.width / 2, Math.min(entity.x, wall.x + wall.width / 2));
      const closestY = Math.max(wall.y - wall.height / 2, Math.min(entity.y, wall.y + wall.height / 2));
      const dx = entity.x - closestX;
      const dy = entity.y - closestY;
      const dist = Math.hypot(dx, dy);

      if (dist < radius) {
        const overlap = radius - dist;
        if (dist > 0.001) {
          entity.x += (dx / dist) * overlap;
          entity.y += (dy / dist) * overlap;
          entity.vx *= 0.5;
          entity.vy *= 0.5;
        } else {
          entity.x += radius;
        }
      }
    }
  }

  private updateAutoTurrets(p: ServerPlayer, dt: number, now: number) {
    const tankDef = TANKS[p.tankId];
    if (!tankDef || !tankDef.autoTurrets) return;

    if (!p.autoTurretAngles) {
      p.autoTurretAngles = tankDef.autoTurrets.map(() => 0);
    }

    let targetX = 0, targetY = 0, hasTarget = false;
    let minDist = 750;

    for (const other of this.players.values()) {
      if (other.id === p.id || other.isDead) continue;
      if (this.mode !== 'ffa' && this.mode !== 'maze' && other.team === p.team) continue;
      const d = Math.hypot(other.x - p.x, other.y - p.y);
      if (d < minDist) {
        minDist = d;
        targetX = other.x;
        targetY = other.y;
        hasTarget = true;
      }
    }

    if (!hasTarget) {
      for (const shape of this.shapes.values()) {
        const d = Math.hypot(shape.x - p.x, shape.y - p.y);
        if (d < 450) {
          targetX = shape.x;
          targetY = shape.y;
          hasTarget = true;
          break;
        }
      }
    }

    tankDef.autoTurrets.forEach((turret, index) => {
      const sizeScale = getSizeScale(p.level);
      const turretWorldX = p.x + Math.cos(p.angle + turret.angleOffset) * turret.offsetDist * sizeScale;
      const turretWorldY = p.y + Math.sin(p.angle + turret.angleOffset) * turret.offsetDist * sizeScale;

      if (hasTarget) {
        const targetAngle = Math.atan2(targetY - turretWorldY, targetX - turretWorldX);
        p.autoTurretAngles![index] = targetAngle;
        this.firePlayerBarrels(p, turret.barrels, targetAngle, now, turretWorldX, turretWorldY);
      } else {
        p.autoTurretAngles![index] += 0.03;
      }
    });
  }

  private firePlayerBarrels(
    p: ServerPlayer,
    barrels: any[],
    baseAngle: number,
    now: number,
    originX?: number,
    originY?: number
  ) {
    const reloadFactor = Math.max(0.30, 1.0 - p.stats.reload * 0.08);
    const sizeScale = getSizeScale(p.level);

    barrels.forEach((b, bIdx) => {
      // Zombie bắn chậm hơn 1.5 lần so với xe thường (giảm độ khó chế độ Zombie)
      const barrelCooldown = b.reloadMultiplier * reloadFactor * 500 * (p.isZombie ? 1.5 : 1);
      const lastShot = p.lastShootTime[bIdx] || 0;

      if (now - lastShot >= barrelCooldown) {
        p.lastShootTime[bIdx] = now;
        p.recoilOffsets[bIdx] = b.recoil * 1.5;

        const fireAngle = baseAngle + b.angleOffset + (Math.random() - 0.5) * b.spread;
        const rootX = originX !== undefined ? originX : p.x;
        const rootY = originY !== undefined ? originY : p.y;

        const tipX = rootX + Math.cos(fireAngle) * b.length * sizeScale - Math.sin(fireAngle) * b.offsetY * sizeScale;
        const tipY = rootY + Math.sin(fireAngle) * b.length * sizeScale + Math.cos(fireAngle) * b.offsetY * sizeScale;

        const recoilPower = b.recoil * 18;
        p.vx -= Math.cos(fireAngle) * recoilPower;
        p.vy -= Math.sin(fireAngle) * recoilPower;

        // Đạn zombie chỉ còn ~55% sát thương (giảm độ khó chế độ Zombie)
        const damage = b.bulletDamage * (1 + p.stats.bulletDamage * 0.35) * (p.isZombie ? 0.55 : 1);
        const health = b.bulletHealth * (1 + p.stats.bulletPenetration * 0.45);
        const speed = (b.bulletSpeed * 42) + p.stats.bulletSpeed * 40;

        const projType = b.type || 'bullet';

        if (projType === 'drone' || projType === 'swarm') {
          const tankDef = TANKS[p.tankId];
          const maxDrones = tankDef.maxDrones || 8;
          if (p.dronesCount >= maxDrones) return;
          p.dronesCount++;
        }

        if (projType === 'trap') {
          const tankDef = TANKS[p.tankId];
          const maxTraps = tankDef.maxTraps || 10;
          if (p.trapsCount >= maxTraps) return;
          p.trapsCount++;
        }

        const proj: ServerProjectile = {
          id: this.generateId('proj'),
          ownerId: p.id,
          ownerTeam: p.team,
          x: tipX,
          y: tipY,
          vx: Math.cos(fireAngle) * speed + p.vx * 0.2,
          vy: Math.sin(fireAngle) * speed + p.vy * 0.2,
          radius: b.bulletSize * sizeScale,
          color: p.color,
          team: p.team,
          type: projType,
          angle: fireAngle,
          damage,
          health,
          maxHealth: health,
          createdAt: now,
          lifeTime: b.bulletLife * 1000,
          shapeSides: projType === 'drone' ? 3 : projType === 'trap' ? 3 : 0,
        };

        this.projectiles.set(proj.id, proj);
      }
    });
  }

  private updateBosses(dt: number, now: number) {
    for (const boss of this.bosses.values()) {
      let nearestDist = 1200;
      let targetX = 0, targetY = 0, hasTarget = false;

      for (const p of this.players.values()) {
        if (p.isDead) continue;
        const d = Math.hypot(p.x - boss.x, p.y - boss.y);
        if (d < nearestDist) {
          nearestDist = d;
          targetX = p.x;
          targetY = p.y;
          hasTarget = true;
        }
      }

      if (hasTarget) {
        boss.angle = Math.atan2(targetY - boss.y, targetX - boss.x);
        boss.vx += Math.cos(boss.angle) * 120 * dt;
        boss.vy += Math.sin(boss.angle) * 120 * dt;
      } else {
        boss.angle += 0.02;
        boss.vx *= 0.95;
        boss.vy *= 0.95;
      }

      boss.vx *= 0.94;
      boss.vy *= 0.94;
      boss.x += boss.vx * dt;
      boss.y += boss.vy * dt;

      if (now - boss.lastShootTime > 1800) {
        boss.lastShootTime = now;
        const bulletCount = boss.bossType === 'guardian' ? 12 : 16;
        for (let i = 0; i < bulletCount; i++) {
          const shootAngle = boss.angle + (i * Math.PI * 2) / bulletCount;
          const proj: ServerProjectile = {
            id: this.generateId('boss_proj'),
            ownerId: boss.id,
            ownerTeam: 'boss',
            x: boss.x + Math.cos(shootAngle) * boss.radius,
            y: boss.y + Math.sin(shootAngle) * boss.radius,
            vx: Math.cos(shootAngle) * 320,
            vy: Math.sin(shootAngle) * 320,
            radius: 12,
            color: boss.color,
            team: 'boss',
            type: 'bullet',
            angle: shootAngle,
            damage: 35,
            health: 40,
            maxHealth: 40,
            createdAt: now,
            lifeTime: 4000,
          };
          this.projectiles.set(proj.id, proj);
        }

        if (boss.bossType === 'guardian' && Math.random() < 0.6) {
          const crasherAngle = Math.random() * Math.PI * 2;
          const crasherShape: ServerShape = {
            id: this.generateId('crasher'),
            type: 'crasher',
            x: boss.x + Math.cos(crasherAngle) * (boss.radius + 20),
            y: boss.y + Math.sin(crasherAngle) * (boss.radius + 20),
            vx: Math.cos(crasherAngle) * 180,
            vy: Math.sin(crasherAngle) * 180,
            angle: crasherAngle,
            rotationSpeed: 0.08,
            sides: 3,
            radius: 14,
            color: '#F48FB1',
            health: 55,
            maxHealth: 55,
            damage: 30,
            xp: 75,
          };
          this.shapes.set(crasherShape.id, crasherShape);
        }
      }
    }
  }

  private updateProjectiles(dt: number, now: number) {
    for (const [id, proj] of this.projectiles.entries()) {
      if (now - proj.createdAt > proj.lifeTime || proj.health <= 0) {
        const owner = this.players.get(proj.ownerId);
        if (owner) {
          if (proj.type === 'drone' || proj.type === 'swarm') owner.dronesCount = Math.max(0, owner.dronesCount - 1);
          if (proj.type === 'trap') owner.trapsCount = Math.max(0, owner.trapsCount - 1);
        }
        this.projectiles.delete(id);
        continue;
      }

      if (proj.type === 'drone' || proj.type === 'swarm') {
        const owner = this.players.get(proj.ownerId);
        if (owner && !owner.isDead) {
          let targetX = owner.input.mouseX;
          let targetY = owner.input.mouseY;

          if (owner.input.isRepellingDrones) {
            targetX = owner.x + (owner.x - targetX);
            targetY = owner.y + (owner.y - targetY);
          }

          const angleToTarget = Math.atan2(targetY - proj.y, targetX - proj.x);
          const droneSpeed = proj.type === 'swarm' ? 440 : 340;
          proj.vx += Math.cos(angleToTarget) * 1200 * dt;
          proj.vy += Math.sin(angleToTarget) * 1200 * dt;
          const curr = Math.hypot(proj.vx, proj.vy);
          if (curr > droneSpeed) {
            proj.vx = (proj.vx / curr) * droneSpeed;
            proj.vy = (proj.vy / curr) * droneSpeed;
          }
          proj.angle = Math.atan2(proj.vy, proj.vx);
        } else {
          proj.vx *= 0.98;
          proj.vy *= 0.98;
        }
      } else if (proj.type === 'trap') {
        proj.vx *= 0.88;
        proj.vy *= 0.88;
      }

      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;

      const half = this.arenaSize / 2;
      if (Math.abs(proj.x) > half || Math.abs(proj.y) > half) {
        const owner = this.players.get(proj.ownerId);
        if (owner) {
          if (proj.type === 'drone' || proj.type === 'swarm') owner.dronesCount = Math.max(0, owner.dronesCount - 1);
          if (proj.type === 'trap') owner.trapsCount = Math.max(0, owner.trapsCount - 1);
        }
        this.projectiles.delete(id);
      }
    }
  }

  private updateShapes(dt: number) {
    for (const shape of this.shapes.values()) {
      if (shape.type === 'crasher') {
        let nearestDist = 600;
        let target: ServerPlayer | null = null;
        for (const p of this.players.values()) {
          if (p.isDead) continue;
          const d = Math.hypot(p.x - shape.x, p.y - shape.y);
          if (d < nearestDist) {
            nearestDist = d;
            target = p;
          }
        }

        if (target) {
          const angle = Math.atan2(target.y - shape.y, target.x - shape.x);
          shape.vx += Math.cos(angle) * 350 * dt;
          shape.vy += Math.sin(angle) * 350 * dt;
          const speed = Math.hypot(shape.vx, shape.vy);
          if (speed > 220) {
            shape.vx = (shape.vx / speed) * 220;
            shape.vy = (shape.vy / speed) * 220;
          }
        }
      }

      shape.x += shape.vx * dt;
      shape.y += shape.vy * dt;
      shape.angle += shape.rotationSpeed;
      shape.vx *= 0.99;
      shape.vy *= 0.99;

      const half = this.arenaSize / 2 - shape.radius;
      if (shape.x < -half) { shape.x = -half; shape.vx *= -1; }
      if (shape.x > half) { shape.x = half; shape.vx *= -1; }
      if (shape.y < -half) { shape.y = -half; shape.vy *= -1; }
      if (shape.y > half) { shape.y = half; shape.vy *= -1; }
    }
  }

  // --- COLLISION RESOLUTION ---
  private handleCollisions() {
    // 0. Đạn đụng đạn: đạn của hai phe đối địch (hoặc hai người khác nhau trong FFA) phá vỡ lẫn nhau
    this.handleProjectileClashes();

    // 1. Projectiles vs Shapes
    for (const [projId, proj] of this.projectiles.entries()) {
      if (proj.health <= 0) continue;
      for (const [shapeId, shape] of this.shapes.entries()) {
        const dist = Math.hypot(proj.x - shape.x, proj.y - shape.y);
        if (dist < proj.radius + shape.radius) {
          shape.health -= proj.damage;
          proj.health -= shape.damage * 0.7;

          shape.vx += proj.vx * 0.15;
          shape.vy += proj.vy * 0.15;

          if (shape.health <= 0) {
            this.handleShapeDestroyed(shape, proj.ownerId);
            this.shapes.delete(shapeId);
          }

          if (proj.health <= 0) {
            const owner = this.players.get(proj.ownerId);
            if (owner) {
              if (proj.type === 'drone' || proj.type === 'swarm') owner.dronesCount = Math.max(0, owner.dronesCount - 1);
              if (proj.type === 'trap') owner.trapsCount = Math.max(0, owner.trapsCount - 1);
            }
            this.projectiles.delete(projId);
            break;
          }
        }
      }
    }

    // 2. Projectiles vs Players
    for (const [projId, proj] of this.projectiles.entries()) {
      if (proj.health <= 0) continue;
      for (const p of this.players.values()) {
        if (p.isDead || p.id === proj.ownerId) continue;
        if (this.mode !== 'ffa' && this.mode !== 'maze' && this.mode !== 'survival' && p.team === proj.team) continue;

        const tankDef = TANKS[p.tankId] || TANKS['basic'];
        const dist = Math.hypot(proj.x - p.x, proj.y - p.y);

        if (dist < proj.radius + this.bodyRadiusOf(p, tankDef)) {
          // Godmode immunity check
          if (!p.isGodmode) {
            p.health -= proj.damage;
            p.lastDamageTime = Date.now();
            p.invisibility = 0;
          }

          p.vx += proj.vx * 0.08;
          p.vy += proj.vy * 0.08;

          proj.health -= 15 + p.stats.bodyDamage * 4;

          if (p.health <= 0 && !p.isGodmode) {
            this.handlePlayerKilled(p, proj.ownerId);
          }

          if (proj.health <= 0) {
            const owner = this.players.get(proj.ownerId);
            if (owner) {
              if (proj.type === 'drone' || proj.type === 'swarm') owner.dronesCount = Math.max(0, owner.dronesCount - 1);
              if (proj.type === 'trap') owner.trapsCount = Math.max(0, owner.trapsCount - 1);
            }
            this.projectiles.delete(projId);
            break;
          }
        }
      }
    }

    // 3. Projectiles vs Bosses
    for (const [projId, proj] of this.projectiles.entries()) {
      if (proj.team === 'boss' || proj.health <= 0) continue;
      for (const [bossId, boss] of this.bosses.entries()) {
        const dist = Math.hypot(proj.x - boss.x, proj.y - boss.y);
        if (dist < proj.radius + boss.radius) {
          boss.health -= proj.damage;
          proj.health -= 40;

          if (boss.health <= 0) {
            this.handleBossDefeated(boss, proj.ownerId);
            this.bosses.delete(bossId);
          }

          if (proj.health <= 0) {
            const owner = this.players.get(proj.ownerId);
            if (owner) {
              if (proj.type === 'drone' || proj.type === 'swarm') owner.dronesCount = Math.max(0, owner.dronesCount - 1);
              if (proj.type === 'trap') owner.trapsCount = Math.max(0, owner.trapsCount - 1);
            }
            this.projectiles.delete(projId);
            break;
          }
        }
      }
    }

    // 4. Player vs Shape (Body collision)
    for (const p of this.players.values()) {
      if (p.isDead) continue;
      const tankDef = TANKS[p.tankId] || TANKS['basic'];

      for (const [shapeId, shape] of this.shapes.entries()) {
        const dist = Math.hypot(p.x - shape.x, p.y - shape.y);
        if (dist < this.bodyRadiusOf(p, tankDef) + shape.radius) {
          const bodyRamDamage = (24 + p.stats.bodyDamage * 14) * (tankDef.isRammer ? 1.7 : 1.0);
          shape.health -= bodyRamDamage;

          if (!p.isGodmode) {
            p.health -= shape.damage * 0.40;
            p.lastDamageTime = Date.now();
            p.invisibility = 0;
          }

          const angle = Math.atan2(shape.y - p.y, shape.x - p.x);
          p.vx -= Math.cos(angle) * 80;
          p.vy -= Math.sin(angle) * 80;
          shape.vx += Math.cos(angle) * 120;
          shape.vy += Math.sin(angle) * 120;

          if (shape.health <= 0) {
            this.handleShapeDestroyed(shape, p.id);
            this.shapes.delete(shapeId);
          }

          if (p.health <= 0 && !p.isGodmode) {
            this.handlePlayerKilled(p, `Shape (${shape.type})`);
          }
        }
      }
    }

    // 5. Player vs Player (Ramming)
    const playerArray = Array.from(this.players.values());
    for (let i = 0; i < playerArray.length; i++) {
      const p1 = playerArray[i];
      if (p1.isDead) continue;
      const tank1 = TANKS[p1.tankId] || TANKS['basic'];

      for (let j = i + 1; j < playerArray.length; j++) {
        const p2 = playerArray[j];
        if (p2.isDead) continue;
        if (this.mode !== 'ffa' && this.mode !== 'maze' && this.mode !== 'survival' && p1.team === p2.team) continue;

        const tank2 = TANKS[p2.tankId] || TANKS['basic'];
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);

        if (dist < this.bodyRadiusOf(p1, tank1) + this.bodyRadiusOf(p2, tank2)) {
          // Zombie đâm yếu hơn người thường (chế độ Zombie đã được giảm độ khó)
          const dmg1 = (25 + p1.stats.bodyDamage * 16) * (tank1.isRammer ? 1.7 : 1.0) * (p1.isZombie ? 0.3 : 1.0);
          const dmg2 = (25 + p2.stats.bodyDamage * 16) * (tank2.isRammer ? 1.7 : 1.0) * (p2.isZombie ? 0.3 : 1.0);

          if (!p1.isGodmode) {
            p1.health -= dmg2 * 0.5;
            p1.lastDamageTime = Date.now();
            p1.invisibility = 0;
          }
          if (!p2.isGodmode) {
            p2.health -= dmg1 * 0.5;
            p2.lastDamageTime = Date.now();
            p2.invisibility = 0;
          }

          const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
          p1.vx -= Math.cos(angle) * 160;
          p1.vy -= Math.sin(angle) * 160;
          p2.vx += Math.cos(angle) * 160;
          p2.vy += Math.sin(angle) * 160;

          if (p1.health <= 0 && !p1.isGodmode) this.handlePlayerKilled(p1, p2.id);
          if (p2.health <= 0 && !p2.isGodmode) this.handlePlayerKilled(p2, p1.id);
        }
      }
    }
  }

  // --- ĐẠN ĐỤNG ĐẠN ---
  // Hai viên đạn thuộc hai bên đối địch chạm nhau sẽ trừ máu lẫn nhau theo sát thương của đối phương.
  // Sát thương/máu của đạn lấy từ nòng súng của xe tăng đã chọn (kèm điểm nâng cấp), nên xe tăng
  // càng mạnh thì đạn càng "dày" và càng dễ xuyên qua đạn yếu.
  private areProjectilesHostile(a: ServerProjectile, b: ServerProjectile): boolean {
    if (a.ownerId === b.ownerId) return false;
    const teamBlocksDamage = this.mode !== 'ffa' && this.mode !== 'maze' && this.mode !== 'survival';
    if (teamBlocksDamage && a.team === b.team) return false;
    return true;
  }

  private handleProjectileClashes() {
    if (this.projectiles.size < 2) return;

    const CELL = 180;
    const arr: ServerProjectile[] = [];
    const grid = new Map<number, number[]>();

    for (const proj of this.projectiles.values()) {
      if (proj.health <= 0) continue;
      const idx = arr.length;
      arr.push(proj);
      const cx = Math.floor(proj.x / CELL);
      const cy = Math.floor(proj.y / CELL);
      const key = (cx + 512) * 1024 + (cy + 512);
      const bucket = grid.get(key);
      if (bucket) bucket.push(idx);
      else grid.set(key, [idx]);
    }

    for (let i = 0; i < arr.length; i++) {
      const a = arr[i];
      const cx = Math.floor(a.x / CELL);
      const cy = Math.floor(a.y / CELL);
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const bucket = grid.get((cx + dx + 512) * 1024 + (cy + dy + 512));
          if (!bucket) continue;
          for (const j of bucket) {
            if (j <= i) continue;
            const b = arr[j];
            if (a.health <= 0) break;
            if (b.health <= 0) continue;
            if (!this.areProjectilesHostile(a, b)) continue;
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            if (dist < a.radius + b.radius) {
              const aDamage = a.damage;
              const bDamage = b.damage;
              a.health -= bDamage;
              b.health -= aDamage;
            }
          }
        }
      }
    }
  }

  private handleShapeDestroyed(shape: ServerShape, killerId: string) {
    const killer = this.players.get(killerId);
    if (!killer) return;

    killer.score += shape.xp;
    killer.exp += shape.xp;
    killer.shapesDestroyed++;

    if (killer.tankId === 'necromancer' && shape.type === 'square' && killer.dronesCount < 24) {
      killer.dronesCount++;
      const squareDrone: ServerProjectile = {
        id: this.generateId('necro_sq'),
        ownerId: killer.id,
        ownerTeam: killer.team,
        x: shape.x,
        y: shape.y,
        vx: 0,
        vy: 0,
        radius: 12,
        color: '#FFE600',
        team: killer.team,
        type: 'drone',
        angle: 0,
        damage: 26,
        health: 28,
        maxHealth: 28,
        createdAt: Date.now(),
        lifeTime: 45000,
        shapeSides: 4,
      };
      this.projectiles.set(squareDrone.id, squareDrone);
    }

    this.checkLevelUp(killer);
  }

  private handlePlayerKilled(victim: ServerPlayer, killerIdOrName: string) {
    victim.isDead = true;
    let killerName = 'Environment';
    let killerTank = 'Hazard';
    let killerTeam: TeamColor = 'neutral';

    const killer = this.players.get(killerIdOrName);
    if (killer) {
      killerName = killer.name;
      killerTank = (TANKS[killer.tankId] || TANKS['basic']).name;
      killerTeam = killer.team;
      killer.killCount++;
      const bounty = Math.max(800, Math.floor(victim.score * 0.65));
      killer.score += bounty;
      killer.exp += bounty;
      this.checkLevelUp(killer);
    } else {
      killerName = killerIdOrName;
    }

    this.killFeed.unshift({
      id: this.generateId('kill'),
      killerName,
      killerTank,
      killerTeam,
      victimName: victim.name,
      victimTank: (TANKS[victim.tankId] || TANKS['basic']).name,
      victimTeam: victim.team,
      timestamp: Date.now(),
    });

    if (this.killFeed.length > 8) {
      this.killFeed.pop();
    }

    if (victim.ws && victim.ws.readyState === WebSocket.OPEN) {
      const timeAliveSec = Math.floor((Date.now() - victim.spawnTime) / 1000);
      victim.ws.send(JSON.stringify({
        type: 'player_death',
        report: {
          killerName,
          killerTank,
          score: victim.score,
          level: victim.level,
          timeAliveSec,
          kills: victim.killCount,
          shapesDestroyed: victim.shapesDestroyed,
        },
      }));
    }

    if (victim.isBot) {
      if (victim.isZombie) {
        this.players.delete(victim.id);
      } else {
        setTimeout(() => {
          this.players.delete(victim.id);
          if (this.targetBotCount > 0) {
            this.spawnBot();
          }
        }, 3500);
      }
    }
  }

  private handleBossDefeated(boss: ServerBoss, killerId: string) {
    const killer = this.players.get(killerId);
    if (killer) {
      killer.score += 35000;
      killer.exp += 35000;
      this.checkLevelUp(killer);
    }

    this.killFeed.unshift({
      id: this.generateId('boss_kill'),
      killerName: killer ? killer.name : 'Unknown Hero',
      killerTank: killer ? (TANKS[killer.tankId] || TANKS['basic']).name : 'Tank',
      killerTeam: killer ? killer.team : 'neutral',
      victimName: boss.name,
      victimTank: 'Mega Boss',
      victimTeam: 'boss',
      timestamp: Date.now(),
    });
  }

  public respawnPlayer(id: string): ServerPlayer | null {
    const p = this.players.get(id);
    if (!p) return null;

    const spawn = this.getSpawnPosition(p.team);
    p.x = spawn.x;
    p.y = spawn.y;
    p.vx = 0;
    p.vy = 0;
    p.isDead = false;
    p.health = 100;
    p.maxHealth = 100;
    const keptLevel = Math.max(1, Math.floor(p.level / 2));
    p.exp = getExpForLevel(keptLevel);
    p.score = p.exp;
    p.level = keptLevel;
    p.statPoints = Math.min(keptLevel - 1, 56);
    p.tankId = keptLevel >= 15 ? (TANKS[p.tankId]?.tier === 2 ? p.tankId : 'basic') : 'basic';
    p.stats = {
      movementSpeed: 0,
      reload: 0,
      bulletDamage: 0,
      bulletPenetration: 0,
      bulletSpeed: 0,
      bodyDamage: 0,
      maxHealth: 0,
      healthRegen: 0,
    };
    p.spawnTime = Date.now();
    p.dronesCount = 0;
    p.trapsCount = 0;

    return p;
  }

  private checkLevelUp(p: ServerPlayer) {
    const newLevel = getLevelFromExp(p.exp);
    if (newLevel > p.level) {
      const addedPoints = newLevel - p.level;
      p.level = newLevel;
      p.statPoints = Math.min(p.statPoints + addedPoints, this.remainingStatSlots(p));
    }
  }

  private broadcastSnapshot() {
    const playerViews: ClientPlayerView[] = [];
    const leaderEntries: LeaderboardEntry[] = [];

    for (const p of this.players.values()) {
      if (p.isDead) continue;
      const tankDef = TANKS[p.tankId] || TANKS['basic'];
      const availUpgrades = getAvailableUpgrades(p.tankId, p.level);

      playerViews.push({
        id: p.id,
        name: p.name,
        x: Math.round(p.x * 10) / 10,
        y: Math.round(p.y * 10) / 10,
        vx: Math.round(p.vx * 10) / 10,
        vy: Math.round(p.vy * 10) / 10,
        angle: Math.round(p.angle * 100) / 100,
        tankId: p.tankId,
        score: p.score,
        level: p.level,
        health: Math.round(p.health),
        maxHealth: Math.round(p.maxHealth),
        team: p.team,
        color: p.color,
        invisibility: Math.round(p.invisibility * 100) / 100,
        isDead: p.isDead,
        killCount: p.killCount,
        statPoints: p.statPoints,
        stats: p.stats,
        availableUpgrades: availUpgrades,
        recoilOffsets: p.recoilOffsets.map(r => Math.round(r * 10) / 10),
        autoTurretAngles: p.autoTurretAngles ? p.autoTurretAngles.map(a => Math.round(a * 100) / 100) : undefined,
        isBot: p.isBot,
        botTier: p.botTier,
        isGodmode: p.isGodmode,
        rainbowSkin: p.rainbowSkin,
        isJuggernaut: p.isJuggernaut,
        isZombie: p.isZombie,
      });

      leaderEntries.push({
        id: p.id,
        name: p.name,
        score: p.score,
        level: p.level,
        tankName: tankDef.name,
        team: p.team,
        color: p.color,
        isPro: p.botTier === 'pro',
      });
    }

    leaderEntries.sort((a, b) => b.score - a.score);
    const topLeaderboard = leaderEntries.slice(0, 10);

    const projViews: ProjectileView[] = [];
    for (const proj of this.projectiles.values()) {
      projViews.push({
        id: proj.id,
        ownerId: proj.ownerId,
        x: Math.round(proj.x * 10) / 10,
        y: Math.round(proj.y * 10) / 10,
        vx: Math.round(proj.vx * 10) / 10,
        vy: Math.round(proj.vy * 10) / 10,
        radius: proj.radius,
        color: proj.color,
        team: proj.team,
        type: proj.type,
        angle: Math.round(proj.angle * 100) / 100,
        healthRatio: Math.max(0, Math.min(1, proj.health / proj.maxHealth)),
        shapeSides: proj.shapeSides,
      });
    }

    const shapeViews: ShapeEntityView[] = [];
    for (const shp of this.shapes.values()) {
      shapeViews.push({
        id: shp.id,
        type: shp.type,
        x: Math.round(shp.x * 10) / 10,
        y: Math.round(shp.y * 10) / 10,
        angle: Math.round(shp.angle * 100) / 100,
        sides: shp.sides,
        radius: shp.radius,
        color: shp.color,
        healthRatio: Math.max(0, Math.min(1, shp.health / shp.maxHealth)),
      });
    }

    const bossViews: BossEntityView[] = [];
    for (const boss of this.bosses.values()) {
      bossViews.push({
        id: boss.id,
        name: boss.name,
        x: Math.round(boss.x * 10) / 10,
        y: Math.round(boss.y * 10) / 10,
        angle: Math.round(boss.angle * 100) / 100,
        health: Math.round(boss.health),
        maxHealth: boss.maxHealth,
        radius: boss.radius,
        color: boss.color,
        bossType: boss.bossType,
      });
    }

    const snapshot: GameStateSnapshot = {
      t: Date.now(),
      players: playerViews,
      projectiles: projViews,
      shapes: shapeViews,
      bosses: bossViews,
      walls: this.walls,
      leaderboard: topLeaderboard,
      arenaSize: this.arenaSize,
      mode: this.mode,
      zoneRadius: this.mode === 'survival' ? this.zoneRadius : undefined,
      zombieWave: this.mode === 'zombie' ? {
        wave: this.zombieWave,
        zombiesRemaining: this.zombiesRemaining,
        totalZombies: this.totalZombiesInWave,
        state: this.zombieWaveState,
        countdown: Math.max(0, Math.ceil(this.zombieWaveCountdown)),
      } : undefined,
    };

    const payload = JSON.stringify({ type: 'state_update', snapshot, killFeed: this.killFeed });

    for (const p of this.players.values()) {
      if (!p.isBot && p.ws && p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(payload);
      }
    }
  }

  public broadcastChatMessage(sender: ServerPlayer, text: string) {
    const chat = {
      id: this.generateId('msg'),
      senderName: sender.name,
      senderTeam: sender.team,
      text: text.slice(0, 80),
      timestamp: Date.now(),
    };
    this.chatMessages.push(chat);
    if (this.chatMessages.length > 25) this.chatMessages.shift();
    const payload = JSON.stringify({ type: 'chat_message', chat });
    for (const p of this.players.values()) {
      if (!p.isBot && p.ws && p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(payload);
      }
    }
  }

  public broadcastSystemChat(text: string) {
    const chat: ChatMessage = {
      id: this.generateId('sys'),
      senderName: '🧟 ZOMBIE OUTBREAK',
      senderTeam: 'yellow',
      text: text.slice(0, 100),
      timestamp: Date.now(),
    };
    this.chatMessages.push(chat);
    if (this.chatMessages.length > 25) this.chatMessages.shift();
    const payload = JSON.stringify({ type: 'chat_message', chat });
    for (const p of this.players.values()) {
      if (!p.isBot && p.ws && p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(payload);
      }
    }
  }
}
