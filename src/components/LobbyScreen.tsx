/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameModeId } from '../../shared/types.ts';
import {
  Shield,
  Swords,
  Crown,
  Grid3X3,
  Flame,
  Wrench,
  Volume2,
  VolumeX,
  Keyboard,
  Palette,
  Play,
  Users,
  Download,
  ArrowRight,
  Monitor,
  Loader2,
  CheckCircle2,
  Copy,
  Check,
  Target,
  Radio,
  FileCode,
  Globe,
  Server,
  X,
  Share2,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { AudioManager } from '../game/audio-manager.ts';

interface LobbyScreenProps {
  onJoin: (name: string, mode: GameModeId, color: string) => void;
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}

const MODES: { id: GameModeId; title: string; subtitle: string; desc: string; icon: any; color: string; tag?: string }[] = [
  {
    id: 'ffa',
    title: 'Free For All (FFA)',
    subtitle: 'Đấu trường sinh tồn tự do',
    desc: 'Bắn hạ tất cả mọi người, chiếm tổ Pentagon ở trung tâm và săn lùng Boss.',
    icon: Swords,
    color: 'from-amber-500/25 to-orange-500/10 border-amber-500/60 text-amber-400',
    tag: 'Phổ biến',
  },
  {
    id: '2tdm',
    title: '2-Team Deathmatch',
    subtitle: 'Đại chiến Xanh vs Đỏ',
    desc: 'Chia 2 phe Xanh - Đỏ. Căn cứ an toàn có siêu Drone bảo vệ chống kẻ địch.',
    icon: Shield,
    color: 'from-blue-500/25 to-red-500/10 border-blue-500/60 text-blue-400',
    tag: 'Đồng đội',
  },
  {
    id: '4tdm',
    title: '4-Team Conquest',
    subtitle: 'Hỗn chiến 4 phe',
    desc: '4 góc 4 màu: Xanh dương, Đỏ, Xanh lá, Vàng cùng tranh giành lãnh địa.',
    icon: Crown,
    color: 'from-emerald-500/25 to-teal-500/10 border-emerald-500/60 text-emerald-400',
    tag: '4 Phe',
  },
  {
    id: 'domination',
    title: 'Domination',
    subtitle: 'Chiếm 4 Pháo Đài Dominator',
    desc: 'Tranh giành và kiểm soát 4 Siêu Pháo Đài Dominator đạn cực khủng ở 4 góc chiến lược.',
    icon: Target,
    color: 'from-yellow-500/25 to-amber-500/10 border-yellow-500/60 text-yellow-400',
    tag: 'Cứ Điểm',
  },
  {
    id: 'survival',
    title: 'Survival (Battle Royale)',
    subtitle: 'Vòng Bo Đỏ Thu Hẹp',
    desc: 'Vòng Bo Đỏ (Storm Barrier) thu hẹp liên tục ép mọi xe tăng vào tử chiến!',
    icon: Radio,
    color: 'from-red-600/25 to-orange-600/10 border-red-500/60 text-red-400',
    tag: 'Bo Đỏ HOT',
  },
  {
    id: 'juggernaut',
    title: 'Juggernaut Hunt',
    subtitle: '1 Chống Tất Cả',
    desc: '1 Siêu Xe Tăng Juggernaut (máu siêu trâu) đối đầu với toàn bộ người chơi trong phòng!',
    icon: Crown,
    color: 'from-fuchsia-500/25 to-purple-500/10 border-fuchsia-500/60 text-fuchsia-400',
    tag: '1 Chống All',
  },
  {
    id: 'maze',
    title: 'Labyrinth Maze',
    subtitle: 'Mê cung rình rập',
    desc: 'Hành lang hẹp và góc khuất. Cực kỳ thích hợp cho tank bắn lén hoặc phục kích.',
    icon: Grid3X3,
    color: 'from-violet-500/25 to-purple-500/10 border-violet-500/60 text-violet-400',
    tag: 'Chiến thuật',
  },
  {
    id: 'siege',
    title: 'Boss Siege',
    subtitle: 'Săn Siêu Boss Co-op',
    desc: 'Hợp tác cùng tất cả người chơi tiêu diệt các Siêu Boss khổng lồ cực trâu.',
    icon: Flame,
    color: 'from-rose-500/25 to-pink-500/10 border-rose-500/60 text-rose-400',
    tag: 'Đánh Boss',
  },
  {
    id: 'sandbox',
    title: 'Sandbox Arena',
    subtitle: 'Thử nghiệm & Đổi Tank',
    desc: 'Lên ngay Cấp 45, tự do đổi sang bất kỳ loại tank nào, spawn Boss và Bot tùy ý.',
    icon: Wrench,
    color: 'from-cyan-500/25 to-teal-500/10 border-cyan-500/60 text-cyan-400',
    tag: 'Tự do',
  },
];

const TANK_COLORS = [
  { hex: '#00B0FF', name: 'Xanh dương' },
  { hex: '#00E676', name: 'Xanh lá' },
  { hex: '#FF5252', name: 'Đỏ' },
  { hex: '#FFD600', name: 'Vàng' },
  { hex: '#FF4081', name: 'Hồng' },
  { hex: '#E040FB', name: 'Tím' },
  { hex: '#7C4DFF', name: 'Chàm' },
  { hex: '#FF6E40', name: 'Cam' },
];

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  onJoin,
  currentTheme,
  onThemeChange,
}) => {
  const [name, setName] = useState<string>(() => localStorage.getItem('arras_player_name') || '');
  const [selectedMode, setSelectedMode] = useState<GameModeId>('ffa');
  const [selectedColor, setSelectedColor] = useState<string>('#00B0FF');
  const [isMuted, setIsMuted] = useState<boolean>(() => AudioManager.getInstance().isMuted);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [showGithubModal, setShowGithubModal] = useState<boolean>(false);
  const [showServerModal, setShowServerModal] = useState<boolean>(false);
  const [customServerInput, setCustomServerInput] = useState<string>(() => localStorage.getItem('arras_server_url') || '');
  const [serverStatusText, setServerStatusText] = useState<string | null>(null);
  const [roomStats, setRoomStats] = useState<Record<string, { humanCount: number; botCount: number }>>({});
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const handleCopyLink = (path: string) => {
    const fullUrl = window.location.origin + path;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3500);
    }).catch(() => {
      // fallback
      prompt('Sao chép đường link tải file tại đây:', fullUrl);
    });
  };

  useEffect(() => {
    const fetchRooms = () => {
      fetch('/api/rooms')
        .then((res) => res.json())
        .then((data) => setRoomStats(data))
        .catch(() => {});
    };

    fetchRooms();
    const interval = setInterval(fetchRooms, 3000);
    return () => clearInterval(interval);
  }, []);

  // Quick launch into a specific mode
  const handleLaunchMode = (modeId: GameModeId) => {
    setSelectedMode(modeId);
    const finalName = name.trim() || 'Tank';
    localStorage.setItem('arras_player_name', finalName);
    onJoin(finalName, modeId, selectedColor);
  };

  const handleStartSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    handleLaunchMode(selectedMode);
  };

  const handleToggleMute = () => {
    const muted = AudioManager.getInstance().toggleMute();
    setIsMuted(muted);
  };

  // Safe file downloader using fetch + blob URL (bypasses iframe navigation errors)
  const handleDownloadFile = async (url: string, filename: string) => {
    setDownloading(filename);
    setDownloadSuccess(null);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
      setDownloadSuccess(filename);
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (err) {
      console.warn('Fallback download:', err);
      window.open(url, '_blank');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="w-full min-h-screen py-8 px-4 flex flex-col items-center justify-center font-sans select-none text-slate-100">
      <div className="w-full max-w-4xl bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl shadow-black/90">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Máy Chủ Multiplayer Trực Tuyến Đang Hoạt Động
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white drop-shadow-md">
            ARRAS<span className="text-blue-500">.IO</span>
          </h1>
          <p className="mt-1 text-slate-400 text-sm max-w-lg mx-auto">
            Hơn 40 loại tank tiến hóa • 9 chế độ chơi • Bảng mã Cheat Code • Bảng xếp hạng Real-time
          </p>
        </div>

        {/* Pilot Name and Launch Form */}
        <form onSubmit={handleStartSubmit} className="space-y-6">
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 shadow-inner">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Name Input */}
              <div className="flex-1 w-full">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Đặt tên người chơi (Nickname)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập tên xe tăng của bạn..."
                  maxLength={16}
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-base font-bold text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>

              {/* Tank Color Picker */}
              <div className="w-full sm:w-auto">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Màu sắc
                </label>
                <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-2 rounded-xl border border-slate-700">
                  {TANK_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setSelectedColor(c.hex)}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                      className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                        selectedColor === c.hex ? 'scale-125 border-white shadow-md' : 'border-black/50 hover:scale-110'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Fast Play Button */}
              <div className="w-full sm:w-auto sm:self-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Vào Bắn Ngay
                </button>
              </div>
            </div>
          </div>

          {/* Game Modes Selection: Click ANY mode to join immediately! */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Chọn 1 Chế Độ Dưới Đây Để Vào Chơi Ngay:
              </span>
              <span className="text-xs text-blue-400 font-semibold hidden sm:inline">
                👉 Bấm trực tiếp vào chế độ để chơi
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {MODES.map((mode) => {
                const Icon = mode.icon;
                const isSelected = selectedMode === mode.id;
                const stat = roomStats[mode.id];
                const activeCount = stat ? stat.humanCount + stat.botCount : 16;

                return (
                  <div
                    key={mode.id}
                    onClick={() => handleLaunchMode(mode.id)}
                    className={`group relative text-left p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer bg-gradient-to-br ${
                      isSelected
                        ? `${mode.color} shadow-xl scale-[1.02] bg-slate-800 ring-2 ring-blue-500/40`
                        : 'from-slate-800/60 to-slate-900/60 border-slate-700/80 hover:border-slate-500 hover:bg-slate-800/90 hover:scale-[1.01]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 group-hover:border-blue-400 transition">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {mode.tag && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white uppercase tracking-wider">
                            {mode.tag}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[11px] font-medium text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded-full border border-slate-800">
                          <Users className="w-3 h-3 text-emerald-400" />
                          {activeCount}
                        </span>
                      </div>
                    </div>

                    <h3 className="mt-2.5 text-base font-black text-white group-hover:text-blue-300 transition">
                      {mode.title}
                    </h3>
                    <div className="text-[11px] font-semibold text-slate-300 mb-1">
                      {mode.subtitle}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {mode.desc}
                    </p>

                    {/* Instant Action Button */}
                    <div className="mt-3 pt-2.5 border-t border-slate-700/50 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-blue-400 group-hover:text-cyan-300 flex items-center gap-1">
                        Bấm để chơi ngay <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-blue-600 group-hover:bg-blue-500 text-white text-[11px] font-black uppercase transition shadow">
                        VÀO CHƠI ▶
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* HTML Standalone & GitHub Multiplayer Section */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-500/50 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    Tải File HTML Đơn (arras-io-online.html)
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 uppercase font-bold">
                      Đưa lên GitHub Chơi Online
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    1 File HTML duy nhất chứa toàn bộ game, tự động kết nối Server online để bạn bè cùng bắn và chat với nhau!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {/* Button 1: Download HTML */}
              <button
                type="button"
                disabled={Boolean(downloading)}
                onClick={() => handleDownloadFile('/api/download/html', 'arras-io-online.html')}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Tải File .HTML (arras-io-online.html)</span>
              </button>

              {/* Button 2: GitHub Guide */}
              <button
                type="button"
                onClick={() => setShowGithubModal(true)}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
              >
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Hướng Dẫn Up GitHub & Chơi Online</span>
              </button>

              {/* Button 3: Server Settings */}
              <button
                type="button"
                onClick={() => setShowServerModal(true)}
                className="py-3 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Cài đặt địa chỉ máy chủ WebSocket"
              >
                <Server className="w-4 h-4 text-cyan-400" />
                <span className="whitespace-nowrap">Cài đặt Server</span>
              </button>
            </div>
          </div>

          {/* Windows .EXE Download Section */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-500/40 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    Tải Game Về Máy Tính Windows (.EXE)
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 uppercase font-bold">
                      1 Chạm Bật Chơi Ngay
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Không cần cài đặt Node.js hay phần mềm phụ trợ, bấm đúp vào file là chơi offline mượt mà.
                  </p>
                </div>
              </div>

              {/* Status Indicator */}
              {downloading && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-500/20 text-blue-300 text-xs font-bold animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang tải {downloading}...
                </div>
              )}
              {downloadSuccess && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Đã tải xong {downloadSuccess}!
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {/* Button 1: Direct .EXE Download */}
              <button
                type="button"
                disabled={Boolean(downloading)}
                onClick={() => handleDownloadFile('/api/download/exe', 'arras-io-tank-arena.exe')}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Tải File .EXE (arras-io-tank-arena.exe)</span>
              </button>

              {/* Button 2: Windows Full Release Package */}
              <button
                type="button"
                disabled={Boolean(downloading)}
                onClick={() => handleDownloadFile('/api/download/windows-release', 'arras-io-windows-edition.zip')}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Tải Gói Đầy Đủ (.ZIP kèm .EXE)</span>
              </button>

              {/* Button 3: Copy Link */}
              <button
                type="button"
                onClick={() => handleCopyLink('/api/download/exe')}
                className="py-3 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Sao chép đường dẫn tải file .EXE"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                <span className="whitespace-nowrap">{copiedLink ? 'Đã chép link!' : 'Chép link'}</span>
              </button>
            </div>

            {/* Direct Link fallback */}
            <div className="mt-2.5 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>💡 Nếu trình duyệt chặn tải tự động, bạn có thể:</span>
              <a
                href="/api/download/exe"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline font-semibold flex items-center gap-1"
              >
                Mở link tải trong tab mới ↗
              </a>
            </div>
          </div>

          {/* Bottom Bar: Settings, Controls & Source Code */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
            <div className="flex items-center gap-2">
              {/* Controls Modal */}
              <button
                type="button"
                onClick={() => setShowControls(true)}
                className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Keyboard className="w-4 h-4 text-blue-400" />
                Hướng dẫn phím
              </button>

              {/* Mute Toggle */}
              <button
                type="button"
                onClick={handleToggleMute}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400" />}
              </button>

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={() => {
                  const nextTheme = currentTheme === 'classic' ? 'dark' : currentTheme === 'dark' ? 'neon' : 'classic';
                  onThemeChange(nextTheme);
                }}
                className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Palette className="w-4 h-4 text-amber-400" />
                <span className="capitalize">{currentTheme}</span>
              </button>
            </div>

            {/* Source Code & Render.yaml Download */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={Boolean(downloading)}
                onClick={() => handleDownloadFile('/api/download/source-zip', 'arras-io-full-source-render.zip')}
                className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 text-purple-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow"
                title="Tải trọn bộ mã nguồn kèm file render.yaml để deploy Render.com"
              >
                <Download className="w-3.5 h-3.5 text-purple-400" />
                <span>Tải ZIP (Có file render.yaml)</span>
              </button>
              <button
                type="button"
                disabled={Boolean(downloading)}
                onClick={() => handleDownloadFile('/api/download/render-yaml', 'render.yaml')}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                title="Tải riêng file cấu hình render.yaml"
              >
                <FileCode className="w-3 h-3 text-cyan-400" />
                <span>render.yaml</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Controls & Hotkeys Modal */}
      {showControls && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-blue-400" />
              Hướng Dẫn Phím Điều Khiển Trong Game
            </h3>

            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400">Di chuyển xe tăng</span>
                <span className="font-bold text-white bg-slate-800 px-2 py-1 rounded">W, A, S, D hoặc Mũi Tên</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400">Ngắm & Bắn</span>
                <span className="font-bold text-white bg-slate-800 px-2 py-1 rounded">Chuột + Chuột Trái / Phím Space</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400">Đẩy Drone / Kiểm soát xa</span>
                <span className="font-bold text-white bg-slate-800 px-2 py-1 rounded">Chuột Phải / Phím Shift</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400">Tự động bắn (Auto-Fire)</span>
                <span className="font-bold text-white bg-slate-800 px-2 py-1 rounded">Phím E</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400">Tự động xoay nòng (Auto-Spin)</span>
                <span className="font-bold text-white bg-slate-800 px-2 py-1 rounded">Phím C</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400">Nâng cấp 8 chỉ số</span>
                <span className="font-bold text-white bg-slate-800 px-2 py-1 rounded">Phím 1 đến 8</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400">Nâng max chỉ số ngay</span>
                <span className="font-bold text-white bg-slate-800 px-2 py-1 rounded">Giữ M + [1-8]</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400">Bật ô trò chuyện (Chat)</span>
                <span className="font-bold text-white bg-slate-800 px-2 py-1 rounded">Phím Enter</span>
              </div>
            </div>

            <button
              onClick={() => setShowControls(false)}
              className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition cursor-pointer"
            >
              Đã hiểu, vào chơi!
            </button>
          </div>
        </div>
      )}

      {/* GitHub Multiplayer Deployment Guide Modal */}
      {showGithubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    Hướng Dẫn Đưa Lên GitHub Để Chơi & Chat Online
                  </h3>
                  <p className="text-xs text-emerald-400">
                    Chỉ mất 2 phút để có một trang web game riêng cho bạn bè cùng chơi!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGithubModal(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-300">
              {/* Option 1: GitHub Pages (Fastest) */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/30 space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs border border-emerald-500/40">1</span>
                  Cách 1: Chơi Ngay Bằng GitHub Pages (Siêu Nhanh - 1 File HTML)
                </div>
                <ol className="list-decimal list-inside space-y-2 pl-2 text-slate-300 leading-relaxed">
                  <li>
                    Bấm nút <strong>"Tải File .HTML (arras-io-online.html)"</strong> ở sảnh chờ.
                  </li>
                  <li>
                    Đổi tên file đã tải thành <code className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded font-mono">index.html</code>.
                  </li>
                  <li>
                    Vào <a href="https://github.com" target="_blank" rel="noreferrer" className="text-blue-400 underline font-semibold">GitHub.com</a>, tạo một Repository mới (ví dụ: <code className="bg-slate-800 text-emerald-300 px-1 rounded">arras-online</code>) ở chế độ <strong>Public</strong>.
                  </li>
                  <li>
                    Kéo thả file <code className="bg-slate-800 text-amber-300 px-1 rounded font-mono">index.html</code> vào mục <strong>Add file &rarr; Upload files</strong>, sau đó nhấn <strong>Commit changes</strong>.
                  </li>
                  <li>
                    Vào tab <strong>Settings</strong> của repo &rarr; chọn mục <strong>Pages</strong> (ở thanh bên trái) &rarr; Trong phần <em>Branch</em>, chọn <code className="bg-slate-800 text-white px-1.5 py-0.5 rounded font-mono">main</code> và nhấn <strong>Save</strong>.
                  </li>
                  <li>
                    Sau 1 phút, GitHub sẽ cấp cho bạn đường link chơi trực tiếp dạng:
                    <div className="mt-1.5 p-2 bg-slate-900 rounded-xl font-mono text-xs text-cyan-300 border border-slate-700 select-all">
                      https://[ten-github-cua-ban].github.io/arras-online/
                    </div>
                  </li>
                </ol>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4 flex-shrink-0" />
                  <span><strong>Kỳ diệu:</strong> File HTML đã được lập trình sẵn để tự động kết nối chung một máy chủ Cloud Multiplayer. Bạn và bạn bè ở bất kỳ đâu chỉ cần mở link là gặp nhau, bắn nhau và chat trực tiếp!</span>
                </div>
              </div>

              {/* Option 2: Full Server Host on Render / Railway */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-xs border border-cyan-500/40">2</span>
                  Cách 2: Tự Host Máy Chủ Riêng Biệt 24/7 (Render / Railway)
                </div>
                <p className="text-slate-400 leading-relaxed text-xs">
                  Nếu bạn muốn một máy chủ độc quyền 100% không chung với ai:
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs text-slate-300">
                  <li>Tải mã nguồn dự án (.zip) ở góc dưới sảnh chờ và giải nén lên GitHub.</li>
                  <li>Đăng nhập <a href="https://render.com" target="_blank" rel="noreferrer" className="text-blue-400 underline font-semibold">Render.com</a> (miễn phí), chọn <strong>New + &rarr; Web Service</strong> &rarr; Kết nối repo GitHub của bạn.</li>
                  <li>Render sẽ tự chạy lệnh build và cấp cho bạn một domain riêng (ví dụ: <code className="text-yellow-300">https://my-tank-server.onrender.com</code>).</li>
                  <li>Vào mục <strong>Cài đặt Server</strong> ở sảnh chờ dán link đó vào là bạn đã làm chủ máy chủ của riêng mình!</li>
                </ul>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGithubModal(false)}
              className="mt-6 w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl transition cursor-pointer shadow-lg"
            >
              Đã hiểu, đóng hướng dẫn!
            </button>
          </div>
        </div>
      )}

      {/* Server Settings Modal */}
      {showServerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-slate-900 border-2 border-cyan-500/60 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Cài Đặt Máy Chủ WebSocket (Server URL)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tùy chỉnh máy chủ kết nối để chơi online cùng bạn bè
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowServerModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Địa chỉ máy chủ (WebSocket URL)
                </label>
                <input
                  type="text"
                  value={customServerInput}
                  onChange={(e) => setCustomServerInput(e.target.value)}
                  placeholder="wss://ais-pre-d5hxpyq32mrjf7ks6c3haz-759029979753.asia-east1.run.app"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 Để trống hoặc bấm "Mặc Định" để kết nối vào máy chủ Cloud Online chính.
                </p>
              </div>

              {serverStatusText && (
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{serverStatusText}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const val = customServerInput.trim();
                    if (val) {
                      localStorage.setItem('arras_server_url', val);
                      setServerStatusText('Đã lưu máy chủ tùy chỉnh!');
                    } else {
                      localStorage.removeItem('arras_server_url');
                      setServerStatusText('Đã đặt lại về máy chủ Cloud mặc định!');
                    }
                    setTimeout(() => setServerStatusText(null), 3000);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase transition cursor-pointer shadow"
                >
                  Lưu Cài Đặt
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomServerInput('wss://ais-pre-d5hxpyq32mrjf7ks6c3haz-759029979753.asia-east1.run.app');
                    localStorage.removeItem('arras_server_url');
                    setServerStatusText('Đã khôi phục máy chủ Cloud mặc định!');
                    setTimeout(() => setServerStatusText(null), 3000);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Mặc Định
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
