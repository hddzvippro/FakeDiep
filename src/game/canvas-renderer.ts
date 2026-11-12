/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ClientPlayerView,
  ProjectileView,
  ShapeEntityView,
  BossEntityView,
  WallObstacle,
  GameModeId,
  TeamColor,
} from '../../shared/types.ts';
import { TANKS } from '../../shared/tanks.ts';

export interface ThemeColors {
  name: string;
  background: string;
  gridLine: string;
  wall: string;
  wallStroke: string;
  border: string;
  tankStroke: string;
  barrel: string;
  barrelStroke: string;
}

export const THEMES: Record<string, ThemeColors> = {
  classic: {
    name: 'Classic Arras',
    background: '#CDCDCD',
    gridLine: '#C6C6C6',
    wall: '#1B2430',
    wallStroke: '#0F172A',
    border: '#1E293B',
    tankStroke: '#555555',
    barrel: '#999999',
    barrelStroke: '#727272',
  },
  dark: {
    name: 'Dark Arena',
    background: '#1A1D24',
    gridLine: '#242832',
    wall: '#334155',
    wallStroke: '#1E293B',
    border: '#475569',
    tankStroke: '#111827',
    barrel: '#4B5563',
    barrelStroke: '#374151',
  },
  neon: {
    name: 'Cyber Neon',
    background: '#0B0F19',
    gridLine: '#162035',
    wall: '#1E293B',
    wallStroke: '#38BDF8',
    border: '#0284C7',
    tankStroke: '#020617',
    barrel: '#334155',
    barrelStroke: '#1E293B',
  },
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  life: number;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public theme: ThemeColors = THEMES.classic;
  public cameraX: number = 0;
  public cameraY: number = 0;
  public targetZoom: number = 1.0;
  public zoom: number = 1.0;

  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  public resize(width: number, height: number) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);
  }

  public setTheme(themeKey: string) {
    if (THEMES[themeKey]) {
      this.theme = THEMES[themeKey];
    }
  }

  public addDamageSpark(x: number, y: number, color: string, count: number = 5) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 140;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3,
        color,
        alpha: 1,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.25,
      });
    }
  }

  public addFloatingText(x: number, y: number, text: string, color: string = '#FFE600') {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      alpha: 1.0,
      life: 0,
    });
  }

  public render(
    dt: number,
    selfPlayer: ClientPlayerView | undefined,
    players: ClientPlayerView[],
    projectiles: ProjectileView[],
    shapes: ShapeEntityView[],
    bosses: BossEntityView[],
    walls: WallObstacle[],
    arenaSize: number,
    mode: GameModeId
  ) {
    const ctx = this.ctx;
    const viewW = this.canvas.clientWidth;
    const viewH = this.canvas.clientHeight;

    // Smooth Camera Follow
    if (selfPlayer) {
      this.cameraX += (selfPlayer.x - this.cameraX) * Math.min(1, dt * 10);
      this.cameraY += (selfPlayer.y - this.cameraY) * Math.min(1, dt * 10);

      const tankDef = TANKS[selfPlayer.tankId] || TANKS['basic'];
      const targetFOV = 1 / (tankDef.fovMultiplier || 1.0);
      this.targetZoom = Math.max(0.65, Math.min(1.2, targetFOV));
      this.zoom += (this.targetZoom - this.zoom) * Math.min(1, dt * 4);
    }

    ctx.save();
    // Clear viewport
    ctx.fillStyle = this.theme.background;
    ctx.fillRect(0, 0, viewW, viewH);

    // Apply Camera Transform
    ctx.translate(viewW / 2, viewH / 2);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.cameraX, -this.cameraY);

    // 1. Draw Grid
    this.drawGrid(ctx, arenaSize);

    // 2. Draw Zones (Team bases & Pentagon nest)
    this.drawZones(ctx, arenaSize, mode);

    // 3. Draw Arena Outer Borders
    this.drawArenaBorders(ctx, arenaSize);

    // 4. Draw Maze Walls
    this.drawWalls(ctx, walls);

    // 5. Draw Shapes (Polygons)
    shapes.forEach((shp) => this.drawShape(ctx, shp));

    // 6. Draw Bosses
    bosses.forEach((boss) => this.drawBoss(ctx, boss));

    // 7. Draw Projectiles (Bullets, Drones, Traps)
    projectiles.forEach((proj) => this.drawProjectile(ctx, proj));

    // 8. Draw Tanks
    // Draw other tanks first, then local player on top
    players
      .slice()
      .sort((a, b) => (a.id === selfPlayer?.id ? 1 : b.id === selfPlayer?.id ? -1 : 0))
      .forEach((p) => this.drawTank(ctx, p, p.id === selfPlayer?.id));

    // 9. Update & Draw Particles
    this.updateAndDrawParticles(ctx, dt);

    // 10. Update & Draw Floating Texts
    this.updateAndDrawFloatingTexts(ctx, dt);

    ctx.restore();
  }

  private drawGrid(ctx: CanvasRenderingContext2D, arenaSize: number) {
    const half = arenaSize / 2;
    const gridSize = 40;
    ctx.strokeStyle = this.theme.gridLine;
    ctx.lineWidth = 1;

    // View boundaries in world coordinates
    const viewW = this.canvas.clientWidth / this.zoom;
    const viewH = this.canvas.clientHeight / this.zoom;
    const minX = Math.max(-half, Math.floor((this.cameraX - viewW / 2) / gridSize) * gridSize);
    const maxX = Math.min(half, Math.ceil((this.cameraX + viewW / 2) / gridSize) * gridSize);
    const minY = Math.max(-half, Math.floor((this.cameraY - viewH / 2) / gridSize) * gridSize);
    const maxY = Math.min(half, Math.ceil((this.cameraY + viewH / 2) / gridSize) * gridSize);

    ctx.beginPath();
    for (let x = minX; x <= maxX; x += gridSize) {
      ctx.moveTo(x, minY);
      ctx.lineTo(x, maxY);
    }
    for (let y = minY; y <= maxY; y += gridSize) {
      ctx.moveTo(minX, y);
      ctx.lineTo(maxX, y);
    }
    ctx.stroke();
  }

  private drawZones(ctx: CanvasRenderingContext2D, arenaSize: number, mode: GameModeId) {
    const half = arenaSize / 2;

    // Central Pentagon Nest
    if (mode !== 'maze') {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, 480, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(124, 77, 255, 0.06)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(124, 77, 255, 0.2)';
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 8]);
      ctx.stroke();
      ctx.restore();
    }

    // Team Bases
    if (mode === '2tdm') {
      // Blue base left
      ctx.fillStyle = 'rgba(0, 176, 255, 0.12)';
      ctx.fillRect(-half, -half, 450, arenaSize);
      ctx.strokeStyle = 'rgba(0, 176, 255, 0.4)';
      ctx.lineWidth = 3;
      ctx.strokeRect(-half, -half, 450, arenaSize);

      // Red base right
      ctx.fillStyle = 'rgba(255, 82, 82, 0.12)';
      ctx.fillRect(half - 450, -half, 450, arenaSize);
      ctx.strokeStyle = 'rgba(255, 82, 82, 0.4)';
      ctx.lineWidth = 3;
      ctx.strokeRect(half - 450, -half, 450, arenaSize);
    } else if (mode === '4tdm') {
      const baseW = 550;
      // Blue top-left
      ctx.fillStyle = 'rgba(0, 176, 255, 0.14)';
      ctx.fillRect(-half, -half, baseW, baseW);
      // Red top-right
      ctx.fillStyle = 'rgba(255, 82, 82, 0.14)';
      ctx.fillRect(half - baseW, -half, baseW, baseW);
      // Green bottom-left
      ctx.fillStyle = 'rgba(0, 230, 118, 0.14)';
      ctx.fillRect(-half, half - baseW, baseW, baseW);
      // Yellow bottom-right
      ctx.fillStyle = 'rgba(255, 214, 0, 0.14)';
    } else if (mode === 'zombie') {
      // Infected green atmosphere
      ctx.fillStyle = 'rgba(34, 197, 94, 0.05)';
      ctx.fillRect(-half, -half, arenaSize, arenaSize);

      // Central Survivor Sanctuary Circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, 480, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 176, 255, 0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 176, 255, 0.35)';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 8]);
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawArenaBorders(ctx: CanvasRenderingContext2D, arenaSize: number) {
    const half = arenaSize / 2;
    ctx.strokeStyle = this.theme.border;
    ctx.lineWidth = 8;
    ctx.strokeRect(-half, -half, arenaSize, arenaSize);
  }

  private drawWalls(ctx: CanvasRenderingContext2D, walls: WallObstacle[]) {
    ctx.save();
    for (const w of walls) {
      ctx.fillStyle = this.theme.wall;
      ctx.strokeStyle = this.theme.wallStroke;
      ctx.lineWidth = 4;
      ctx.fillRect(w.x - w.width / 2, w.y - w.height / 2, w.width, w.height);
      ctx.strokeRect(w.x - w.width / 2, w.y - w.height / 2, w.width, w.height);
    }
    ctx.restore();
  }

  private drawShape(ctx: CanvasRenderingContext2D, shp: ShapeEntityView) {
    ctx.save();
    ctx.translate(shp.x, shp.y);
    ctx.rotate(shp.angle);

    ctx.fillStyle = shp.color;
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 3;

    if (shp.sides === 0) {
      // Circle (Egg)
      ctx.beginPath();
      ctx.arc(0, 0, shp.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // Regular Polygon
      ctx.beginPath();
      for (let i = 0; i < shp.sides; i++) {
        const theta = (i * 2 * Math.PI) / shp.sides;
        const px = Math.cos(theta) * shp.radius;
        const py = Math.sin(theta) * shp.radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();

    // Shape Health Bar (shown only when damaged)
    if (shp.healthRatio < 0.99) {
      this.drawHealthBar(ctx, shp.x, shp.y - shp.radius - 8, shp.radius * 2, shp.healthRatio);
    }
  }

  private drawBoss(ctx: CanvasRenderingContext2D, boss: BossEntityView) {
    ctx.save();
    ctx.translate(boss.x, boss.y);
    ctx.rotate(boss.angle);

    ctx.fillStyle = boss.color;
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 6;

    if (boss.bossType === 'guardian') {
      // Massive pink triangle
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const theta = (i * 2 * Math.PI) / 3;
        const px = Math.cos(theta) * boss.radius;
        const py = Math.sin(theta) * boss.radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (boss.bossType === 'summoner') {
      // Massive square
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const theta = (i * 2 * Math.PI) / 4;
        const px = Math.cos(theta) * boss.radius;
        const py = Math.sin(theta) * boss.radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // Fallen Overlord: Dark circle with drone bay crowns
      ctx.beginPath();
      ctx.arc(0, 0, boss.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();

    // Boss Name & Giant Health Bar
    const barWidth = 140;
    this.drawHealthBar(ctx, boss.x, boss.y - boss.radius - 22, barWidth, boss.health / boss.maxHealth, 8);

    ctx.save();
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText(boss.name, boss.x, boss.y - boss.radius - 30);
    ctx.fillText(boss.name, boss.x, boss.y - boss.radius - 30);
    ctx.restore();
  }

  private drawProjectile(ctx: CanvasRenderingContext2D, proj: ProjectileView) {
    ctx.save();
    ctx.translate(proj.x, proj.y);
    ctx.rotate(proj.angle);

    ctx.fillStyle = proj.color;
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2.5;

    if (proj.type === 'drone' || proj.type === 'swarm') {
      // Triangle drone
      ctx.beginPath();
      const r = proj.radius * 1.25;
      ctx.moveTo(r, 0);
      ctx.lineTo(-r * 0.8, -r * 0.7);
      ctx.lineTo(-r * 0.5, 0);
      ctx.lineTo(-r * 0.8, r * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (proj.type === 'trap') {
      // Spiked trap
      ctx.beginPath();
      const r = proj.radius * 1.3;
      for (let i = 0; i < 6; i++) {
        const rad = i % 2 === 0 ? r : r * 0.45;
        const theta = (i * Math.PI) / 3;
        const px = Math.cos(theta) * rad;
        const py = Math.sin(theta) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // Standard circular bullet
      ctx.beginPath();
      ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawTank(ctx: CanvasRenderingContext2D, p: ClientPlayerView, isSelf: boolean) {
    const tankDef = TANKS[p.tankId] || TANKS['basic'];
    const radius = tankDef.bodyRadius;

    ctx.save();
    ctx.translate(p.x, p.y);

    // Apply invisibility alpha
    if (p.invisibility > 0) {
      ctx.globalAlpha = isSelf ? Math.max(0.25, 1 - p.invisibility * 0.75) : Math.max(0.04, 1 - p.invisibility);
    }

    // 1. Draw Barrels
    ctx.save();
    ctx.rotate(p.angle);

    tankDef.barrels.forEach((b, bIdx) => {
      const recoil = p.recoilOffsets[bIdx] || 0;
      const bLen = Math.max(8, b.length - recoil);
      const bWidth = b.width;
      const angle = b.angleOffset;

      ctx.save();
      ctx.rotate(angle);

      ctx.fillStyle = this.theme.barrel;
      ctx.strokeStyle = this.theme.barrelStroke;
      ctx.lineWidth = 3;

      if (b.type === 'drone' || b.type === 'swarm') {
        // Trapezoid drone bay flare
        ctx.beginPath();
        ctx.moveTo(0, -bWidth * 0.4);
        ctx.lineTo(bLen, -bWidth * 0.7);
        ctx.lineTo(bLen, bWidth * 0.7);
        ctx.lineTo(0, bWidth * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (b.type === 'trap') {
        // Trapper wide nozzle
        ctx.beginPath();
        ctx.moveTo(0, -bWidth * 0.5);
        ctx.lineTo(bLen, -bWidth * 0.85);
        ctx.lineTo(bLen, bWidth * 0.85);
        ctx.lineTo(0, bWidth * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // Standard barrel
        ctx.fillRect(0, -bWidth / 2 + b.offsetY, bLen, bWidth);
        ctx.strokeRect(0, -bWidth / 2 + b.offsetY, bLen, bWidth);
      }

      ctx.restore();
    });

    ctx.restore();

    // 2. Draw Tank Body
    ctx.fillStyle = p.color;
    ctx.strokeStyle = this.theme.tankStroke;
    ctx.lineWidth = 3.5;

    if (tankDef.bodyShape === 'hexagon') {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const theta = (i * 2 * Math.PI) / 6;
        const px = Math.cos(theta) * radius;
        const py = Math.sin(theta) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (tankDef.bodyShape === 'square') {
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const theta = (i * 2 * Math.PI) / 4 + Math.PI / 4;
        const px = Math.cos(theta) * radius;
        const py = Math.sin(theta) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (tankDef.bodyShape === 'spiked') {
      // Rotating 4 spikes around hull
      ctx.beginPath();
      const spikeR = radius * 1.5;
      for (let i = 0; i < 8; i++) {
        const r = i % 2 === 0 ? spikeR : radius;
        const theta = (i * Math.PI) / 4 + Date.now() * 0.002;
        const px = Math.cos(theta) * r;
        const py = Math.sin(theta) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // Standard circle body
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Glowing red eyes for Zombie tanks
    if (p.isZombie) {
      ctx.save();
      ctx.rotate(p.angle);
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(radius * 0.42, -radius * 0.28, Math.max(2.5, radius * 0.16), 0, Math.PI * 2);
      ctx.arc(radius * 0.42, radius * 0.28, Math.max(2.5, radius * 0.16), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Draw Auto-Turrets (Auto-3, Auto-5, Auto-Gunner)
    if (tankDef.autoTurrets && p.autoTurretAngles) {
      tankDef.autoTurrets.forEach((turret, idx) => {
        const turretAngle = p.autoTurretAngles![idx] || 0;
        const tx = Math.cos(p.angle + turret.angleOffset) * turret.offsetDist;
        const ty = Math.sin(p.angle + turret.angleOffset) * turret.offsetDist;

        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(turretAngle);

        // Turret barrel
        turret.barrels.forEach((tb) => {
          ctx.fillStyle = this.theme.barrel;
          ctx.strokeStyle = this.theme.barrelStroke;
          ctx.lineWidth = 2.5;
          ctx.fillRect(0, -tb.width / 2, tb.length, tb.width);
          ctx.strokeRect(0, -tb.width / 2, tb.length, tb.width);
        });

        // Turret dome
        ctx.fillStyle = '#78909C';
        ctx.strokeStyle = '#37474F';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, turret.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      });
    }

    ctx.restore(); // Restore world coords

    // 4. Player Name & Health Bar (rendered upright above tank)
    const isVisibleEnough = p.invisibility < 0.85 || isSelf;
    if (isVisibleEnough) {
      const barY = p.y - radius - 14;
      this.drawHealthBar(ctx, p.x, barY, 48, p.health / p.maxHealth);

      // Name & Level
      ctx.save();
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      const displayName = `${p.name} [Lv ${p.level}]`;
      ctx.strokeText(displayName, p.x, barY - 6);
      ctx.fillText(displayName, p.x, barY - 6);
      ctx.restore();
    }
  }

  private drawHealthBar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    ratio: number,
    height: number = 5
  ) {
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    const hx = x - width / 2;

    ctx.save();
    // Background (Dark)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(hx - 1, y - 1, width + 2, height + 2);

    // Depleted red
    ctx.fillStyle = '#EF5350';
    ctx.fillRect(hx, y, width, height);

    // Current health green
    ctx.fillStyle = '#00E676';
    ctx.fillRect(hx, y, width * clampedRatio, height);
    ctx.restore();
  }

  private updateAndDrawParticles(ctx: CanvasRenderingContext2D, dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = 1 - p.life / p.maxLife;

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private updateAndDrawFloatingTexts(ctx: CanvasRenderingContext2D, dt: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life += dt;
      if (ft.life >= 0.8) {
        this.floatingTexts.splice(i, 1);
        continue;
      }

      ft.y -= dt * 35;
      ft.alpha = 1 - ft.life / 0.8;

      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = ft.color;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }
}
