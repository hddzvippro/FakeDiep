/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CanvasRenderer, THEMES } from './game/canvas-renderer.ts';
import { ClientEngine } from './game/client-engine.ts';
import { GameHUD } from './components/GameHUD.tsx';
import { LobbyScreen } from './components/LobbyScreen.tsx';
import { DeathScreen } from './components/DeathScreen.tsx';
import { SandboxBar } from './components/SandboxBar.tsx';
import { GameModeId, StatKey } from '../shared/types.ts';
import { safeGetStorage, safeSetStorage } from './utils/storage.ts';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const engineRef = useRef<ClientEngine | null>(null);

  const [inLobby, setInLobby] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<string>(() => safeGetStorage('arras_theme', 'classic'));
  const [, setTick] = useState(0); // For forcing React re-renders on socket state updates

  const handleStateChange = useCallback(() => {
    setTick((t) => (t + 1) % 1000000);
  }, []);

  // Initialize Canvas Renderer and Client Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new CanvasRenderer(canvas);
    renderer.setTheme(currentTheme);
    rendererRef.current = renderer;

    const engine = new ClientEngine(renderer);
    engine.onStateChange = handleStateChange;
    engineRef.current = engine;

    const handleResize = () => {
      renderer.resize(window.innerWidth, window.innerHeight);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // 60-120 FPS Main Render Loop
    let lastTime = performance.now();
    let animId: number;

    const renderLoop = (now: number) => {
      const dt = Math.min(0.06, (now - lastTime) / 1000);
      lastTime = now;

      if (engineRef.current && rendererRef.current) {
        const eng = engineRef.current;
        const snap = eng.currentSnapshot;
        const selfPlayer = eng.getSelfPlayer();

        if (snap) {
          rendererRef.current.render(
            dt,
            selfPlayer,
            snap.players,
            snap.projectiles,
            snap.shapes,
            snap.bosses,
            snap.walls,
            snap.arenaSize,
            snap.mode
          );
        } else {
          // Idle render when connecting
          rendererRef.current.render(dt, undefined, [], [], [], [], [], 4000, 'ffa');
        }
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      engine.disconnect();
    };
  }, [handleStateChange, currentTheme]);

  const handleJoin = (name: string, mode: GameModeId, color: string) => {
    if (engineRef.current) {
      engineRef.current.connect(name, mode, color);
      setInLobby(false);
    }
  };

  const handleLeave = () => {
    if (engineRef.current) {
      engineRef.current.disconnect();
    }
    setInLobby(true);
  };

  const handleThemeChange = (newTheme: string) => {
    setCurrentTheme(newTheme);
    safeSetStorage('arras_theme', newTheme);
    if (rendererRef.current && THEMES[newTheme]) {
      rendererRef.current.setTheme(newTheme);
    }
  };

  const handleRespawn = () => {
    if (engineRef.current) {
      engineRef.current.respawn();
    }
  };

  const handleUpgradeStat = (statKey: StatKey) => {
    if (engineRef.current) {
      engineRef.current.upgradeStat(statKey);
    }
  };

  const handleUpgradeTank = (tankId: string) => {
    if (engineRef.current) {
      engineRef.current.upgradeTank(tankId);
    }
  };

  const handleSendChat = (text: string) => {
    if (engineRef.current) {
      engineRef.current.sendChat(text);
    }
  };

  const handleSandboxAction = (action: string, data?: any) => {
    if (engineRef.current) {
      engineRef.current.sendSandboxAction(action, data);
    }
  };

  const handleSwitchMode = (newMode: GameModeId) => {
    if (engineRef.current) {
      engineRef.current.switchMode(newMode);
    }
  };

  const engine = engineRef.current;
  const selfPlayer = engine?.getSelfPlayer();
  const snapshot = engine?.currentSnapshot;

  return (
    <ErrorBoundary>
      <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none" style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#020617' }}>
        {/* Game Canvas */}
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
          className="absolute inset-0 w-full h-full block cursor-crosshair"
        />

        {/* Lobby Screen Overlay */}
        {inLobby ? (
          <div
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, overflowY: 'auto', backgroundColor: 'rgba(2, 6, 23, 0.96)' }}
            className="absolute inset-0 z-40 overflow-y-auto bg-slate-950/95 backdrop-blur-md"
          >
            <LobbyScreen
              onJoin={handleJoin}
              currentTheme={currentTheme}
              onThemeChange={handleThemeChange}
            />
          </div>
        ) : (
        <>
          {/* In-Game HUD */}
          <GameHUD
            player={selfPlayer}
            leaderboard={snapshot?.leaderboard || []}
            killFeed={engine?.killFeed || []}
            chatMessages={engine?.chatMessages || []}
            bosses={snapshot?.bosses || []}
            arenaSize={engine?.arenaSize || 4000}
            mode={engine?.mode || 'ffa'}
            autoFire={engine?.input.autoFire || false}
            autoSpin={engine?.input.autoSpin || false}
            onUpgradeStat={handleUpgradeStat}
            onUpgradeTank={handleUpgradeTank}
            onSendChat={handleSendChat}
            onSendCheat={(code) => engineRef.current?.sendCheat(code)}
            cheatFeedback={engine?.lastCheatMessage}
            ping={engine?.ping || 20}
            onLeaveGame={handleLeave}
            onSwitchMode={handleSwitchMode}
          />

          {/* Sandbox Toolbar */}
          {engine?.mode === 'sandbox' && (
            <SandboxBar
              onAction={handleSandboxAction}
              currentTankId={selfPlayer?.tankId || 'basic'}
            />
          )}

          {/* Death Screen Modal */}
          {engine?.deathReport && (
            <DeathScreen
              report={engine.deathReport}
              onRespawn={handleRespawn}
              onLobby={handleLeave}
            />
          )}
        </>
      )}
      </div>
    </ErrorBoundary>
  );
}

