import { useEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type Phaser from 'phaser';
import { createPhaserGame } from '@/game/PhaserGame';
import { AudioEngine } from '@/game/AudioEngine';
import type { GameScene, GameCompleteData } from '@/game/scenes/GameScene';

type Props = { songId: string };

export function GameCanvas({ songId }: Props) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const audioRef = useRef<AudioEngine>(new AudioEngine());
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState<GameCompleteData | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    const game = createPhaserGame(containerRef.current, songId);
    gameRef.current = game;
    game.events.on('game-complete', setResult);

    return () => {
      // Critique pour Vite HMR : Phaser garde des refs sur le canvas
      game.events.off('game-complete', setResult);
      game.destroy(true);
      gameRef.current = null;
      audioRef.current.destroy();
      audioRef.current = new AudioEngine();
    };
  }, [songId]);

  // Navigation vers /results dès que le résultat arrive
  useEffect(() => {
    if (!result) return;
    void navigate({
      to: '/results',
      search: {
        score: result.score,
        maxCombo: result.maxCombo,
        accuracy: result.accuracy,
        rank: result.rank,
        songId,
      },
    });
  }, [result, navigate, songId]);

  function handleStart() {
    const audio = audioRef.current;
    // unlock() DOIT être dans le handler du clic — contrainte Safari iOS
    audio.unlock();
    audio.playTone(523, 0.12);

    const scene = gameRef.current?.scene.getScene('GameScene') as GameScene | null;
    scene?.setAudio(audio);
    scene?.start();
    setStarted(true);
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {!started && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-vapor-bg/75">
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
