import { useEffect, useRef, useState } from 'react';
import type Phaser from 'phaser';
import { createPhaserGame } from '@/game/PhaserGame';
import { AudioEngine } from '@/game/AudioEngine';
import type { GameScene } from '@/game/scenes/GameScene';

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const audioRef = useRef<AudioEngine>(new AudioEngine());
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    gameRef.current = createPhaserGame(containerRef.current);

    return () => {
      // Critique pour Vite HMR : Phaser garde des refs sur le canvas
      gameRef.current?.destroy(true);
      gameRef.current = null;
      audioRef.current.destroy();
      audioRef.current = new AudioEngine();
    };
  }, []);

  function handleStart() {
    const audio = audioRef.current;
    // unlock() DOIT être dans le handler du clic (user gesture) — Safari iOS
    audio.unlock();
    audio.playTone(440, 0.2);

    const game = gameRef.current;
    if (!game) return;

    // Récupère la scène et lui transmet l'AudioEngine + le signal de départ
    const scene = game.scene.getScene('GameScene') as GameScene | null;
    scene?.setAudio(audio);
    scene?.start();
    setStarted(true);
  }

  return (
    <div className="relative w-full h-full">
      {/* Container Phaser — prend tout l'espace */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Overlay START affiché avant le premier clic */}
      {!started && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-vapor-bg/70">
          <p className="font-jp text-vapor-cyan/60 mb-6 text-xl tracking-widest">
            リズム・ゲーム
          </p>
          <button
            type="button"
            onClick={handleStart}
            className="
              font-display border-vapor-pink text-vapor-pink
              hover:bg-vapor-pink hover:text-vapor-bg
              shadow-neon-pink border-2 px-16 py-5 text-4xl tracking-widest
              transition-all duration-200 hover:scale-105 active:scale-95
            "
          >
            ▶ START GAME
          </button>
          <p className="font-body text-vapor-white/30 mt-8 text-xs tracking-widest">
            D &nbsp;·&nbsp; F &nbsp;·&nbsp; J &nbsp;·&nbsp; K
          </p>
        </div>
      )}
    </div>
  );
}
