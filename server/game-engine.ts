/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WebSocket } from 'ws';
import { GameModeId } from '../shared/types.ts';
import { GameRoom } from './room.ts';

export class GameManager {
  private static instance: GameManager;
  private rooms: Map<GameModeId, GameRoom> = new Map();
  private clientRoomMap: Map<string, { roomId: GameModeId; playerId: string }> = new Map();

  private constructor() {
    this.initRooms();
  }

  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  private initRooms() {
    const modes: GameModeId[] = ['ffa', '2tdm', '4tdm', 'maze', 'siege', 'domination', 'survival', 'juggernaut', 'sandbox', 'zombie'];
    for (const mode of modes) {
      const room = new GameRoom(`room_${mode}`, mode);
      room.start();
      this.rooms.set(mode, room);
    }
  }

  public getRoom(mode: GameModeId): GameRoom {
    let room = this.rooms.get(mode);
    if (!room) {
      room = new GameRoom(`room_${mode}`, mode);
      room.start();
      this.rooms.set(mode, room);
    }
    return room;
  }

  public handleConnection(ws: WebSocket) {
    const clientId = `client_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        this.handleMessage(clientId, ws, msg);
      } catch (err) {
        console.error('Invalid WS packet:', err);
      }
    });

    ws.on('close', () => {
      this.handleDisconnect(clientId);
    });

    ws.on('error', (err) => {
      console.error(`WS error for ${clientId}:`, err);
      this.handleDisconnect(clientId);
    });
  }

  private handleMessage(clientId: string, ws: WebSocket, msg: any) {
    switch (msg.type) {
      case 'join': {
        const mode: GameModeId = msg.mode || 'ffa';
        const name: string = msg.name || 'Tank';
        const color: string | undefined = msg.color;

        // Disconnect from old room if already in one
        this.handleDisconnect(clientId);

        const room = this.getRoom(mode);
        const player = room.addHumanPlayer(clientId, ws, name, color);
        this.clientRoomMap.set(clientId, { roomId: mode, playerId: clientId });

        // Send initialization payload
        ws.send(JSON.stringify({
          type: 'init',
          payload: {
            selfId: player.id,
            arenaSize: room.arenaSize,
            mode: room.mode,
            walls: room.walls,
            team: player.team,
          },
        }));
        break;
      }

      case 'input': {
        const meta = this.clientRoomMap.get(clientId);
        if (!meta) return;
        const room = this.rooms.get(meta.roomId);
        if (room && msg.input) {
          room.handlePlayerInput(meta.playerId, msg.input);
        }
        break;
      }

      case 'upgrade_stat': {
        const meta = this.clientRoomMap.get(clientId);
        if (!meta) return;
        const room = this.rooms.get(meta.roomId);
        if (room && msg.statKey) {
          room.handleStatUpgrade(meta.playerId, msg.statKey);
        }
        break;
      }

      case 'upgrade_tank': {
        const meta = this.clientRoomMap.get(clientId);
        if (!meta) return;
        const room = this.rooms.get(meta.roomId);
        if (room && msg.tankId) {
          room.handleTankUpgrade(meta.playerId, msg.tankId);
        }
        break;
      }

      case 'respawn': {
        const meta = this.clientRoomMap.get(clientId);
        if (!meta) return;
        const room = this.rooms.get(meta.roomId);
        if (room) {
          const respawned = room.respawnPlayer(meta.playerId);
          if (respawned) {
            ws.send(JSON.stringify({
              type: 'respawn_success',
              selfId: respawned.id,
            }));
          }
        }
        break;
      }

      case 'chat': {
        const meta = this.clientRoomMap.get(clientId);
        if (!meta || !msg.text) return;
        const room = this.rooms.get(meta.roomId);
        if (room) {
          const player = room.players.get(meta.playerId);
          if (player) {
            room.broadcastChatMessage(player, msg.text);
          }
        }
        break;
      }

      case 'sandbox_action': {
        const meta = this.clientRoomMap.get(clientId);
        if (!meta) return;
        const room = this.rooms.get(meta.roomId);
        if (room && room.mode === 'sandbox') {
          room.handleSandboxAction(meta.playerId, msg.action, msg.data);
        }
        break;
      }

      case 'cheat': {
        const meta = this.clientRoomMap.get(clientId);
        if (!meta) return;
        const room = this.rooms.get(meta.roomId);
        if (room && msg.code) {
          const feedback = room.handleCheatCode(meta.playerId, msg.code);
          ws.send(JSON.stringify({
            type: 'cheat_feedback',
            message: feedback,
          }));
        }
        break;
      }

      case 'ping': {
        ws.send(JSON.stringify({ type: 'pong', clientTime: msg.clientTime }));
        break;
      }

      default:
        break;
    }
  }

  private handleDisconnect(clientId: string) {
    const meta = this.clientRoomMap.get(clientId);
    if (!meta) return;

    const room = this.rooms.get(meta.roomId);
    if (room) {
      room.removePlayer(meta.playerId);
    }
    this.clientRoomMap.delete(clientId);
  }

  public getRoomStats() {
    const stats: Record<string, { humanCount: number; botCount: number; mode: GameModeId }> = {};
    for (const [mode, room] of this.rooms.entries()) {
      let humans = 0;
      let bots = 0;
      for (const p of room.players.values()) {
        if (p.isBot) bots++;
        else humans++;
      }
      stats[mode] = { humanCount: humans, botCount: bots, mode };
    }
    return stats;
  }
}
