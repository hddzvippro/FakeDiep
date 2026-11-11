/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ClientPlayerView,
  LeaderboardEntry,
  KillFeedEntry,
  ChatMessage,
  StatKey,
  STAT_KEYS,
  STAT_NAMES,
  STAT_COLORS,
  GameModeId,
  BossEntityView,
} from '../../shared/types.ts';
import { TANKS, getExpProgress } from '../../shared/tanks.ts';
import {
  Volume2,
  VolumeX,
  LogOut,
  ChevronUp,
  MessageSquare,
  Send,
  Zap,
  RotateCw,
  Sparkles,
  Shield,
  X,
  Sliders,
} from 'lucide-react';
import { AudioManager } from '../game/audio-manager.ts';

interface GameHUDProps {
  player: ClientPlayerView | undefined;
  leaderboard: LeaderboardEntry[];
  killFeed: KillFeedEntry[];
  chatMessages: ChatMessage[];
  bosses: BossEntityView[];
  arenaSize: number;
  mode: GameModeId;
  autoFire: boolean;
  autoSpin: boolean;
  cheatFeedback?: string | null;
  ping?: number;
  onUpgradeStat: (statKey: StatKey) => void;
  onUpgradeTank: (tankId: string) => void;
  onSendChat: (text: string) => void;
  onSendCheat?: (code: string) => void;
  onLeaveGame: () => void;
  onSwitchMode?: (mode: GameModeId) => void;
}

function formatScore(score: number): string {
  if (score >= 1_000_000) {
    return (score / 1_000_000).toFixed(1) + 'M';
  }
  if (score >= 1_000) {
    return (score / 1_000).toFixed(1) + 'K';
  }
  return score.toString();
}

const CHEAT_PRESETS = [
  { code: 'god', label: '🛡️ Godmode (Bất Tử)', desc: 'Không nhận sát thương từ đạn, quái hay xe khác' },
  { code: 'max', label: '⭐ Max Cấp 45 (+33 Điểm)', desc: 'Lên ngay Cấp 45 và nhận 33 điểm nâng cấp' },
  { code: 'nuke', label: '💣 Nuke Toàn Sân', desc: 'Xóa sổ mọi mục tiêu trong bán kính 950px' },
  { code: 'closer', label: '👑 Arena Closer', desc: 'Biến thành Thần Arena Closer bất khả chiến bại' },
  { code: 'dominator', label: '🏰 Dominator', desc: 'Biến thành Pháo Đài Dominator 3000 Máu' },
  { code: 'mothership', label: '🛸 Mothership', desc: 'Tàu mẹ khổng lồ thả 32 siêu Drone' },
  { code: 'speed', label: '⚡ Siêu Tốc Độ 3x', desc: 'Tăng tốc độ di chuyển siêu nhanh' },
  { code: 'score', label: '💰 +50,000 XP', desc: 'Cộng thêm 50,000 kinh nghiệm ngay lập tức' },
  { code: 'rainbow', label: '🌈 Skin Cầu Vồng 7 Màu', desc: 'Đổi màu liên tục cực ảo diệu' },
  { code: 'heal', label: '❤️ Hồi 100% Máu', desc: 'Hồi đầy máu lập tức' },
  { code: 'boss', label: '👹 Triệu Hồi Boss', desc: 'Spawn Siêu Boss Guardian' },
];

export const GameHUD: React.FC<GameHUDProps> = ({
  player,
  leaderboard,
  killFeed,
  chatMessages,
  bosses,
  arenaSize,
  mode,
  autoFire,
  autoSpin,
  onUpgradeStat,
  onUpgradeTank,
  onSendChat,
  onSendCheat,
  cheatFeedback,
  ping = 20,
  onLeaveGame,
  onSwitchMode,
}) => {
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(() => AudioManager.getInstance().isMuted);
  const [fps, setFps] = useState(60);
  const [isCheatMenuOpen, setIsCheatMenuOpen] = useState(false);
  const [cheatInput, setCheatInput] = useState('');
  const [showStatsOverride, setShowStatsOverride] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const chatInputRef = useRef<HTMLInputElement>(null);
  const cheatInputRef = useRef<HTMLInputElement>(null);
  const minimapCanvasRef = useRef<HTMLCanvasElement>(null);

  // Sync incoming cheat feedback to toast
  useEffect(() => {
    if (cheatFeedback) {
      setToastMessage(cheatFeedback);
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [cheatFeedback]);

  // Measure FPS
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const loop = (now: number) => {
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Handle Enter key for chat & U for stats toggle & '/' for cheat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'Enter') {
        if (isChatOpen) {
          if (chatInput.trim()) {
            onSendChat(chatInput);
            setChatInput('');
          }
          setIsChatOpen(false);
        } else {
          setIsChatOpen(true);
          setTimeout(() => chatInputRef.current?.focus(), 50);
        }
      } else if (e.code === 'KeyU') {
        setShowStatsOverride((prev) => !prev);
      } else if (e.key === '/' || e.code === 'KeyK') {
        setIsCheatMenuOpen((prev) => !prev);
        if (!isCheatMenuOpen) {
          setTimeout(() => cheatInputRef.current?.focus(), 80);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isChatOpen, chatInput, onSendChat, isCheatMenuOpen]);

  // Render Minimap
  useEffect(() => {
    const canvas = minimapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 150;
    canvas.width = size;
    canvas.height = size;

    // Background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(0, 0, size, size);

    // Border
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, size, size);

    const worldToMap = (wx: number, wy: number) => {
      const half = arenaSize / 2;
      const mx = ((wx + half) / arenaSize) * size;
      const my = ((wy + half) / arenaSize) * size;
      return { x: mx, y: my };
    };

    // Central Nest
    if (mode !== 'maze') {
      const nestCenter = worldToMap(0, 0);
      const nestRadius = (450 / arenaSize) * size;
      ctx.beginPath();
      ctx.arc(nestCenter.x, nestCenter.y, nestRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(124, 77, 255, 0.15)';
      ctx.fill();
    }

    // Team base markers
    if (mode === '2tdm') {
      const bw = (450 / arenaSize) * size;
      ctx.fillStyle = 'rgba(0, 176, 255, 0.3)';
      ctx.fillRect(0, 0, bw, size);
      ctx.fillStyle = 'rgba(255, 82, 82, 0.3)';
      ctx.fillRect(size - bw, 0, bw, size);
    } else if (mode === '4tdm') {
      const bw = (550 / arenaSize) * size;
      ctx.fillStyle = 'rgba(0, 176, 255, 0.3)';
      ctx.fillRect(0, 0, bw, bw);
      ctx.fillStyle = 'rgba(255, 82, 82, 0.3)';
      ctx.fillRect(size - bw, 0, bw, bw);
      ctx.fillStyle = 'rgba(0, 230, 118, 0.3)';
      ctx.fillRect(0, size - bw, bw, bw);
      ctx.fillStyle = 'rgba(255, 214, 0, 0.3)';
      ctx.fillRect(size - bw, size - bw, bw, bw);
    }

    // Boss locations
    bosses.forEach((boss) => {
      const pos = worldToMap(boss.x, boss.y);
      ctx.fillStyle = '#FF1744';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Player position dot
    if (player) {
      const pos = worldToMap(player.x, player.y);
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = player.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Heading line
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(pos.x + Math.cos(player.angle) * 8, pos.y + Math.sin(player.angle) * 8);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [player, bosses, arenaSize, mode]);

  const currentTank = TANKS[player?.tankId || 'basic'] || TANKS['basic'];
  const expProgress = getExpProgress(player?.score || 0);

  const toggleMute = () => {
    const muted = AudioManager.getInstance().toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden font-sans select-none text-white z-20">
      {/* Top Bar: Status, Toggles & Leave */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between pointer-events-auto">
        <div className="flex items-center gap-2">
          {/* Quick Mode Switcher */}
          {onSwitchMode ? (
            <select
              value={mode}
              onChange={(e) => onSwitchMode(e.target.value as GameModeId)}
              className="px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-blue-500/60 text-xs font-bold uppercase tracking-wider text-blue-300 shadow cursor-pointer focus:outline-none hover:border-blue-400"
              title="Đổi chế độ chơi"
            >
              <option value="ffa">⚔️ FFA</option>
              <option value="2tdm">🛡️ 2-TDM</option>
              <option value="4tdm">👑 4-TDM</option>
              <option value="maze">🌀 Maze</option>
              <option value="domination">🏰 Domination</option>
              <option value="survival">🔥 Survival (Vòng Bo)</option>
              <option value="juggernaut">👑 Juggernaut Hunt</option>
              <option value="siege">👹 Boss Siege</option>
              <option value="sandbox">🧪 Sandbox</option>
            </select>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-xs font-bold uppercase tracking-wider text-slate-300 shadow">
              Mode: <span className="text-blue-400">{mode.toUpperCase()}</span>
            </div>
          )}

          {/* Auto-Fire Indicator */}
          <div
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border backdrop-blur-md flex items-center gap-1.5 transition ${
              autoFire
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900/70 border-slate-800 text-slate-500'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            [E] Auto-Fire: {autoFire ? 'ON' : 'OFF'}
          </div>

          {/* Auto-Spin Indicator */}
          <div
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border backdrop-blur-md flex items-center gap-1.5 transition ${
              autoSpin
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-slate-900/70 border-slate-800 text-slate-500'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            [C] Auto-Spin: {autoSpin ? 'ON' : 'OFF'}
          </div>

          {/* FPS & Ping Counter */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400">
            <span>{fps} FPS</span>
            <span className="text-slate-600">•</span>
            <span className={ping < 65 ? 'text-emerald-400' : ping < 140 ? 'text-amber-400' : 'text-red-400'}>
              {ping}ms
            </span>
          </div>
        </div>

        {/* Right Top Actions */}
        <div className="flex items-center gap-2">
          {/* Cheat Code Button */}
          {onSendCheat && (
            <button
              onClick={() => setIsCheatMenuOpen((prev) => !prev)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/60 text-amber-300 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer transition active:scale-95"
              title="Mở bảng mã gian lận Cheat Code (Phím / hoặc K)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Cheat Code</span>
            </button>
          )}

          <button
            onClick={toggleMute}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition shadow cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400" />}
          </button>
          <button
            onClick={onLeaveGame}
            className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-red-950/80 border border-slate-700 hover:border-red-800 text-xs font-bold text-slate-300 hover:text-red-400 transition flex items-center gap-1.5 shadow cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Leave
          </button>
        </div>
      </div>

      {/* Top Right: Live Leaderboard & Kill Feed */}
      <div className="absolute top-14 right-3 w-56 sm:w-64 flex flex-col gap-2 pointer-events-auto">
        {/* Scoreboard */}
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-2xl p-3 shadow-xl">
          <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2 text-center border-b border-slate-800 pb-1.5">
            Leaderboard
          </div>
          <div className="space-y-1">
            {leaderboard.map((entry, index) => {
              const isSelf = entry.id === player?.id;
              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between px-2 py-0.5 rounded-lg text-xs transition ${
                    isSelf ? 'bg-blue-500/25 border border-blue-400/40 font-bold' : 'hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono text-slate-400 text-[10px] w-3.5">{index + 1}.</span>
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="truncate text-slate-200" title={entry.name}>
                      {entry.name}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-amber-400 flex-shrink-0 ml-2">
                    {formatScore(entry.score)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kill Feed */}
        <div className="space-y-1 overflow-hidden pointer-events-none">
          {killFeed.slice(0, 4).map((k) => (
            <div
              key={k.id}
              className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/80 rounded-xl px-2.5 py-1 text-[11px] flex items-center gap-1.5 justify-between shadow-sm animate-fade-in"
            >
              <span className="font-semibold text-white truncate max-w-[90px]">{k.killerName}</span>
              <span className="text-red-400 text-[10px] font-mono">💥</span>
              <span className="text-slate-400 truncate max-w-[90px]">{k.victimName}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Left: Tank Evolution Options */}
      {player && player.availableUpgrades && player.availableUpgrades.length > 0 && (
        <div className="absolute top-16 left-3 max-w-sm pointer-events-auto">
          <div className="bg-slate-900/90 backdrop-blur-lg border border-blue-500/40 rounded-2xl p-3 shadow-2xl animate-bounce-short">
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1">
                <ChevronUp className="w-4 h-4 text-emerald-400" />
                Evolution Available!
              </span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono">
                Tier {TANKS[player.availableUpgrades[0]]?.tier || 2}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
              {player.availableUpgrades.map((tId) => {
                const tank = TANKS[tId];
                if (!tank) return null;
                return (
                  <button
                    key={tId}
                    onClick={() => onUpgradeTank(tId)}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-blue-600/30 border border-slate-700 hover:border-blue-400 text-left transition group"
                  >
                    <div className="font-bold text-xs text-white group-hover:text-blue-300 truncate">
                      {tank.name}
                    </div>
                    <div className="text-[9px] text-slate-400 line-clamp-2 mt-0.5 leading-tight">
                      {tank.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Left: Stat Upgrade Panel (Auto-hides when 0 stat points, or toggled via U) */}
      {player && (player.statPoints > 0 || showStatsOverride) && (
        <div className="absolute bottom-20 left-3 w-64 pointer-events-auto transition-all animate-fade-in">
          {player.statPoints > 0 ? (
            <div className="mb-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-bold tracking-wide flex items-center justify-between animate-pulse shadow-lg">
              <span>{player.statPoints} Điểm Nâng Cấp!</span>
              <span className="text-[10px] text-emerald-400/80">Phím [1-8]</span>
            </div>
          ) : (
            <div className="mb-1.5 px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-between shadow">
              <span>Bảng chỉ số (Đã nâng hết)</span>
              <button
                onClick={() => setShowStatsOverride(false)}
                className="text-slate-400 hover:text-white px-1"
                title="Ẩn bảng chỉ số"
              >
                ✕
              </button>
            </div>
          )}

          <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-2xl p-2.5 shadow-xl space-y-1">
            {STAT_KEYS.map((key, index) => {
              const currentVal = player.stats[key] || 0;
              const maxVal = 7;
              const hotkey = index + 1;
              const statColor = STAT_COLORS[key];

              return (
                <div key={key} className="flex items-center gap-1.5 text-xs">
                  {/* Plus / Hotkey Button */}
                  <button
                    disabled={player.statPoints <= 0 || currentVal >= maxVal}
                    onClick={() => onUpgradeStat(key)}
                    className={`w-5 h-5 rounded flex items-center justify-center font-mono font-bold text-[10px] transition ${
                      player.statPoints > 0 && currentVal < maxVal
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow cursor-pointer active:scale-95'
                        : 'bg-slate-800 text-slate-500 cursor-default'
                    }`}
                    title={`Upgrade ${STAT_NAMES[key]} (Hotkey ${hotkey})`}
                  >
                    {hotkey}
                  </button>

                  {/* Stat Name */}
                  <span className="w-24 text-[10px] font-medium text-slate-300 truncate">
                    {STAT_NAMES[key]}
                  </span>

                  {/* 7 Segment Pips */}
                  <div className="flex-1 flex gap-1 h-3.5 bg-slate-950/80 p-0.5 rounded border border-slate-800">
                    {Array.from({ length: maxVal }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-[2px] transition-all"
                        style={{
                          backgroundColor: i < currentVal ? statColor : 'rgba(255,255,255,0.06)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Small Stat Inspection Toggle Button when 0 points */}
      {player && player.statPoints === 0 && !showStatsOverride && (
        <div className="absolute bottom-20 left-3 pointer-events-auto">
          <button
            onClick={() => setShowStatsOverride(true)}
            className="px-2.5 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-[11px] font-bold text-slate-300 hover:text-white transition flex items-center gap-1.5 shadow-md cursor-pointer"
            title="Xem bảng chỉ số xe tăng (Phím U)"
          >
            <Sliders className="w-3 h-3 text-blue-400" />
            <span>Chỉ Số [U]</span>
          </button>
        </div>
      )}

      {/* Top Center Toast Notification Banner */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-auto z-50 animate-bounce-short">
          <div className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500/90 via-orange-500/90 to-yellow-500/90 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-2xl shadow-amber-500/30 flex items-center gap-2 border border-yellow-200">
            <Sparkles className="w-4 h-4 fill-current text-slate-950" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Interactive Cheat Code Modal */}
      {isCheatMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md pointer-events-auto">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl shadow-amber-500/20 text-white animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-1.5">
                    Bảng Mã Gian Lận (Cheat Menu)
                  </h3>
                  <p className="text-[11px] text-amber-400/90">
                    Bấm 1 chạm kích hoạt ngay hoặc tự gõ lệnh tùy ý
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCheatMenuOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Custom Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (cheatInput.trim() && onSendCheat) {
                  onSendCheat(cheatInput);
                  setCheatInput('');
                }
              }}
              className="flex items-center gap-2 mb-4 bg-slate-950 border border-slate-700 focus-within:border-amber-400 rounded-2xl p-1.5 transition"
            >
              <input
                ref={cheatInputRef}
                type="text"
                value={cheatInput}
                onChange={(e) => setCheatInput(e.target.value)}
                placeholder="Nhập mã cheat: god, max, nuke, closer, speed..."
                className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow cursor-pointer transition active:scale-95"
              >
                Kích Hoạt
              </button>
            </form>

            {/* Quick 1-Tap Buttons Grid */}
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Các Lệnh Nhanh 1 Chạm:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {CHEAT_PRESETS.map((cheat) => (
                <button
                  key={cheat.code}
                  type="button"
                  onClick={() => {
                    if (onSendCheat) {
                      onSendCheat(cheat.code);
                    }
                  }}
                  className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-500/60 text-left transition group cursor-pointer active:scale-98"
                >
                  <div className="font-bold text-xs text-white group-hover:text-amber-300">
                    {cheat.label}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {cheat.desc}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Phím tắt mở cheat: <span className="text-amber-300 font-mono font-bold">/</span> hoặc <span className="text-amber-300 font-mono font-bold">K</span></span>
              <button
                onClick={() => setIsCheatMenuOpen(false)}
                className="text-slate-300 hover:text-white font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Center: Level & EXP Progress Bar */}
      {player && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pointer-events-auto">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-2.5 shadow-2xl">
            <div className="flex items-center justify-between text-xs font-bold mb-1 px-1">
              <span className="text-blue-400">
                Lv {player.level} • {currentTank.name}
              </span>
              <span className="font-mono text-amber-400">Score: {formatScore(player.score)}</span>
            </div>

            {/* EXP Bar */}
            <div className="relative w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-700/60">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-300 rounded-full"
                style={{ width: `${Math.round(expProgress.ratio * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Right: Radar Minimap */}
      <div className="absolute bottom-3 right-3 pointer-events-auto">
        <canvas
          ref={minimapCanvasRef}
          className="rounded-2xl border border-slate-700/80 shadow-2xl backdrop-blur-md"
        />
      </div>

      {/* Quick Chat Overlay */}
      <div className="absolute bottom-60 left-3 max-w-xs pointer-events-auto">
        {/* Chat log */}
        <div className="space-y-1 max-h-36 overflow-y-auto mb-2 text-xs">
          {chatMessages.slice(-5).map((m) => (
            <div key={m.id} className="bg-slate-900/75 backdrop-blur-sm rounded-lg px-2 py-1 border border-slate-800">
              <span className="font-bold text-blue-300">{m.senderName}: </span>
              <span className="text-slate-200">{m.text}</span>
            </div>
          ))}
        </div>

        {/* Input box */}
        {isChatOpen ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (chatInput.trim()) {
                onSendChat(chatInput);
                setChatInput('');
              }
              setIsChatOpen(false);
            }}
            className="flex items-center gap-1.5 bg-slate-900/95 border border-blue-500 rounded-xl px-2 py-1 shadow-lg"
          >
            <input
              ref={chatInputRef}
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Press Enter to send..."
              maxLength={80}
              className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-48"
            />
            <button type="submit" className="text-blue-400 hover:text-blue-300">
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <button
            onClick={() => {
              setIsChatOpen(true);
              setTimeout(() => chatInputRef.current?.focus(), 50);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition"
          >
            <MessageSquare className="w-3 h-3" />
            Chat [Enter]
          </button>
        )}
      </div>
    </div>
  );
};
