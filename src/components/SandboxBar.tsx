/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TANKS } from '../../shared/tanks.ts';
import { Wrench, Heart, Skull, Shapes, UserPlus, Sparkles } from 'lucide-react';

interface SandboxBarProps {
  onAction: (action: string, data?: any) => void;
  currentTankId: string;
}

export const SandboxBar: React.FC<SandboxBarProps> = ({ onAction, currentTankId }) => {
  const [isOpen, setIsOpen] = useState(true);

  const tankList = Object.values(TANKS);

  return (
    <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 pointer-events-auto select-none">
      <div className="bg-slate-900/90 backdrop-blur-md border border-cyan-500/50 rounded-2xl p-2 shadow-2xl flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-400 font-bold text-xs uppercase tracking-wide hover:bg-cyan-500/30 transition"
        >
          <Wrench className="w-3.5 h-3.5" />
          Sandbox Tools
        </button>

        {isOpen && (
          <div className="flex items-center gap-2 text-xs flex-wrap">
            {/* Tank Selector */}
            <select
              value={currentTankId}
              onChange={(e) => onAction('set_tank', { tankId: e.target.value })}
              className="bg-slate-800 border border-slate-700 text-white font-semibold rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-400"
            >
              {tankList.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.tier}] {t.name}
                </option>
              ))}
            </select>

            {/* Max Level */}
            <button
              onClick={() => onAction('max_level')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold transition"
              title="Instant Level 45"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Lv 45
            </button>

            {/* Heal */}
            <button
              onClick={() => onAction('heal')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold transition"
              title="Heal to Max HP"
            >
              <Heart className="w-3.5 h-3.5" />
              Heal
            </button>

            {/* Spawn Boss */}
            <button
              onClick={() => onAction('spawn_boss', { bossType: 'guardian' })}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold transition"
              title="Spawn Boss"
            >
              <Skull className="w-3.5 h-3.5" />
              Boss
            </button>

            {/* Spawn Shapes */}
            <button
              onClick={() => onAction('spawn_shapes')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 font-bold transition"
              title="Spawn 20 Shapes"
            >
              <Shapes className="w-3.5 h-3.5" />
              Shapes
            </button>

            {/* Spawn Bot */}
            <button
              onClick={() => onAction('spawn_bot')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 font-bold transition"
              title="Spawn Enemy Bot"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Bot
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
