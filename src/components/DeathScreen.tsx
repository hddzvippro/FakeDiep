/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { DeathReport } from '../../shared/types.ts';
import { Trophy, Clock, Swords, Shapes, RotateCcw, Home } from 'lucide-react';

interface DeathScreenProps {
  report: DeathReport;
  onRespawn: () => void;
  onLobby: () => void;
}

function formatScore(score: number): string {
  if (score >= 1_000_000) return (score / 1_000_000).toFixed(1) + 'M';
  if (score >= 1_000) return (score / 1_000).toFixed(1) + 'K';
  return score.toString();
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const DeathScreen: React.FC<DeathScreenProps> = ({ report, onRespawn, onLobby }) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        onRespawn();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onRespawn]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans select-none animate-fade-in">
      <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center">
        {/* Banner */}
        <div className="inline-block px-4 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold uppercase tracking-wider mb-3">
          Tank Destroyed
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white">
          KILLED BY <span className="text-red-400">{report.killerName}</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">Weapon of choice: {report.killerTank}</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 my-6">
          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Final Score
            </div>
            <div className="text-xl font-black text-amber-400">{formatScore(report.score)}</div>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-1">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              Time Alive
            </div>
            <div className="text-xl font-black text-blue-400">{formatTime(report.timeAliveSec)}</div>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-1">
              <Swords className="w-3.5 h-3.5 text-rose-400" />
              Tanks Defeated
            </div>
            <div className="text-xl font-black text-rose-400">{report.kills}</div>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-1">
              <Shapes className="w-3.5 h-3.5 text-emerald-400" />
              Shapes Farmed
            </div>
            <div className="text-xl font-black text-emerald-400">{report.shapesDestroyed}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={onRespawn}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Instant Respawn (Space)
          </button>

          <button
            onClick={onLobby}
            className="w-full py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            Return to Lobby
          </button>
        </div>
      </div>
    </div>
  );
};
