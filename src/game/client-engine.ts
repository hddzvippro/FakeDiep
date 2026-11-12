/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  GameModeId,
  PlayerInput,
  GameStateSnapshot,
  ClientPlayerView,
  KillFeedEntry,
  ChatMessage,
  DeathReport,
  StatKey,
  STAT_KEYS,
  TeamColor,
  WallObstacle,
} from '../../shared/types.ts';
import { AudioManager } from './audio-manager.ts';
import { safeGetStorage } from '../utils/storage.ts';
import { CanvasRenderer } from './canvas-renderer.ts';
import { TANKS } from '../../shared/tanks.ts';

export class ClientEngine {
  private ws: WebSocket | null = null;
  public selfId: string | null = null;
  public mode: GameModeId = 'ffa';
  public arenaSize: number = 4000;
  public walls: WallObstacle[] = [];
  public selfTeam: TeamColor = 'neutral';

  public currentSnapshot: GameStateSnapshot | null = null;
  public killFeed: KillFeedEntry[] = [];
  public chatMessages: ChatMessage[] = [];
  public deathReport: DeathReport | null = null;
  public isConnected: boolean = false;

  private renderer: CanvasRenderer;
  private audio: AudioManager = AudioManager.getInstance();

  // Input state
  public input: PlayerInput = {
    up: false,
    down: false,
    left: false,
    right: false,
    mouseX: 0,
    mouseY: 0,
    angle: 0,
    isShooting: false,
    isRepellingDrones: false,
    autoFire: false,
    autoSpin: false,
  };

  private prevLevel: number = 1;
  private prevScore: number = 0;
  private prevHealth: number = 100;
  private isMaxingStat: boolean = false;

  public lastCheatMessage: string | null = null;
  public ping: number = 20;
  public activeWsUrl: string = '';
  private pingInterval: any = null;

  // Listeners for React components
  public onStateChange?: () => void;
  public onDeath?: (report: DeathReport) => void;
  public onCheatFeedback?: (msg: string) => void;

  constructor(renderer: CanvasRenderer) {
    this.renderer = renderer;
    this.setupInputListeners();
  }

  public static getDefaultServerUrl(): string {
    const isGitHub = typeof window !== 'undefined' && window.location.hostname.endsWith('github.io');
    const isLocalFile = typeof window !== 'undefined' && (window.location.protocol === 'file:' || !window.location.host);
    if (isGitHub || isLocalFile) {
      return 'wss://ais-pre-d5hxpyq32mrjf7ks6c3haz-759029979753.asia-east1.run.app';
    }
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
    return `${protocol}//${host}`;
  }

  public connect(playerName: string, mode: GameModeId, preferredColor?: string) {
    this.mode = mode;
    this.deathReport = null;

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    let wsUrl = safeGetStorage('arras_server_url', '').trim();
    if (!wsUrl) {
      wsUrl = ClientEngine.getDefaultServerUrl();
    } else {
      if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
        const proto = wsUrl.startsWith('https://') ? 'wss://' : 'ws://';
        wsUrl = proto + wsUrl.replace(/^https?:\/\//, '');
      }
    }
    this.activeWsUrl = wsUrl;

    try {
      this.ws = new WebSocket(wsUrl);
    } catch (err) {
      console.warn('Failed to construct WebSocket with URL:', wsUrl, err);
      // Fallback to default cloud server
      this.activeWsUrl = 'wss://ais-pre-d5hxpyq32mrjf7ks6c3haz-759029979753.asia-east1.run.app';
      this.ws = new WebSocket(this.activeWsUrl);
    }

    this.ws.onopen = () => {
      this.isConnected = true;
      this.ws?.send(
        JSON.stringify({
          type: 'join',
          name: playerName,
          mode,
          color: preferredColor,
        })
      );
      this.onStateChange?.();

      // Start ping loop
      this.pingInterval = setInterval(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'ping', clientTime: Date.now() }));
        }
      }, 3500);
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.handleServerMessage(msg);
      } catch (err) {
        console.error('Failed to parse WS msg:', err);
      }
    };

    this.ws.onclose = () => {
      this.isConnected = false;
      if (this.pingInterval) clearInterval(this.pingInterval);
      this.onStateChange?.();
    };

    this.ws.onerror = (err) => {
      console.error('WS Error:', err);
    };
  }

  public disconnect() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  public switchMode(newMode: GameModeId) {
    this.mode = newMode;
    this.deathReport = null;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const self = this.getSelfPlayer();
      this.ws.send(JSON.stringify({
        type: 'join',
        name: self?.name || safeGetStorage('arras_player_name', 'Tank') || 'Tank',
        mode: newMode,
        color: self?.color,
      }));
    }
  }

  private handleServerMessage(msg: any) {
    switch (msg.type) {
      case 'init': {
        this.selfId = msg.payload.selfId;
        this.arenaSize = msg.payload.arenaSize;
        this.mode = msg.payload.mode;
        this.walls = msg.payload.walls;
        this.selfTeam = msg.payload.team;
        this.onStateChange?.();
        break;
      }

      case 'state_update': {
        const snapshot: GameStateSnapshot = msg.snapshot;
        this.currentSnapshot = snapshot;
        if (msg.killFeed) {
          this.killFeed = msg.killFeed;
        }

        // Check self player events (level up, damage, kill sounds)
        const self = this.getSelfPlayer();
        if (self) {
          if (self.level > this.prevLevel) {
            this.audio.playLevelUp();
            this.renderer.addFloatingText(self.x, self.y - 40, `LEVEL UP! [Lv ${self.level}]`, '#00E676');
            this.prevLevel = self.level;
          }
          if (self.score > this.prevScore) {
            const gained = self.score - this.prevScore;
            if (gained >= 30) {
              this.renderer.addFloatingText(self.x, self.y - 25, `+${gained}`, '#FFE600');
            }
            this.prevScore = self.score;
          }
          if (self.health < this.prevHealth) {
            this.audio.playHit();
            this.renderer.addDamageSpark(self.x, self.y, '#FF5252', 6);
          }
          this.prevHealth = self.health;
        }

        this.onStateChange?.();
        break;
      }

      case 'player_death': {
        this.deathReport = msg.report;
        this.audio.playDeath();
        this.onDeath?.(msg.report);
        this.onStateChange?.();
        break;
      }

      case 'respawn_success': {
        this.deathReport = null;
        this.prevLevel = 1;
        this.onStateChange?.();
        break;
      }

      case 'chat_message': {
        this.chatMessages.push(msg.chat);
        if (this.chatMessages.length > 25) {
          this.chatMessages.shift();
        }
        this.onStateChange?.();
        break;
      }

      case 'cheat_feedback': {
        this.lastCheatMessage = msg.message;
        const self = this.getSelfPlayer();
        if (self) {
          this.renderer.addFloatingText(self.x, self.y - 60, msg.message, '#00E676');
        }
        this.onCheatFeedback?.(msg.message);
        this.onStateChange?.();
        break;
      }

      case 'pong': {
        if (msg.clientTime) {
          this.ping = Math.max(1, Math.round(Date.now() - msg.clientTime));
          this.onStateChange?.();
        }
        break;
      }

      default:
        break;
    }
  }

  public getSelfPlayer(): ClientPlayerView | undefined {
    if (!this.selfId || !this.currentSnapshot) return undefined;
    return this.currentSnapshot.players.find((p) => p.id === this.selfId);
  }

  public respawn() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'respawn' }));
  }

  public upgradeStat(statKey: StatKey) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'upgrade_stat', statKey }));
  }

  public upgradeTank(tankId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'upgrade_tank', tankId }));
  }

  public sendCheat(code: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !code.trim()) return;
    this.ws.send(JSON.stringify({ type: 'cheat', code: code.trim() }));
  }

  public sendChat(text: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !text.trim()) return;
    this.ws.send(JSON.stringify({ type: 'chat', text: text.trim() }));
  }

  public sendSandboxAction(action: string, data?: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'sandbox_action', action, data }));
  }

  private sendInput() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        type: 'input',
        input: this.input,
      })
    );
  }

  private setupInputListeners() {
    window.addEventListener('keydown', (e) => {
      // Ignore if user is currently typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const code = e.code;

      if (code === 'KeyW' || code === 'ArrowUp') this.input.up = true;
      if (code === 'KeyS' || code === 'ArrowDown') this.input.down = true;
      if (code === 'KeyA' || code === 'ArrowLeft') this.input.left = true;
      if (code === 'KeyD' || code === 'ArrowRight') this.input.right = true;

      if (code === 'KeyE') {
        this.input.autoFire = !this.input.autoFire;
      }
      if (code === 'KeyC') {
        this.input.autoSpin = !this.input.autoSpin;
      }
      if (code === 'KeyM') {
        this.isMaxingStat = true;
      }

      // Hotkeys 1-8 for Stat Upgrades
      const digit = parseInt(e.key, 10);
      if (digit >= 1 && digit <= 8) {
        const statKey = STAT_KEYS[digit - 1];
        if (statKey) {
          const repeat = this.isMaxingStat ? 7 : 1;
          for (let i = 0; i < repeat; i++) {
            this.upgradeStat(statKey);
          }
        }
      }

      this.sendInput();
    });

    window.addEventListener('keyup', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') this.input.up = false;
      if (code === 'KeyS' || code === 'ArrowDown') this.input.down = false;
      if (code === 'KeyA' || code === 'ArrowLeft') this.input.left = false;
      if (code === 'KeyD' || code === 'ArrowRight') this.input.right = false;

      if (code === 'KeyM') {
        this.isMaxingStat = false;
      }

      this.sendInput();
    });

    window.addEventListener('mousemove', (e) => {
      // Calculate world coordinate from canvas screen position
      const canvas = document.querySelector('canvas');
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      const viewW = canvas.clientWidth;
      const viewH = canvas.clientHeight;

      // Reverse transform: Screen -> World
      const worldX = (screenX - viewW / 2) / this.renderer.zoom + this.renderer.cameraX;
      const worldY = (screenY - viewH / 2) / this.renderer.zoom + this.renderer.cameraY;

      this.input.mouseX = worldX;
      this.input.mouseY = worldY;

      const self = this.getSelfPlayer();
      if (self) {
        this.input.angle = Math.atan2(worldY - self.y, worldX - self.x);
      }

      this.sendInput();
    });

    window.addEventListener('mousedown', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.closest('button') || target.tagName === 'INPUT') return;

      if (e.button === 0) {
        // Left click: shoot
        this.input.isShooting = true;
      } else if (e.button === 2) {
        // Right click: repel drones
        this.input.isRepellingDrones = true;
      }
      this.sendInput();
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.input.isShooting = false;
      } else if (e.button === 2) {
        this.input.isRepellingDrones = false;
      }
      this.sendInput();
    });

    // Disable context menu on canvas for right-click repel
    window.addEventListener('contextmenu', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'CANVAS') {
        e.preventDefault();
      }
    });
  }
}
