import { useEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type Phaser from 'phaser';
import { createPhaserGame } from '@/game/PhaserGame';
import { AudioEngine } from '@/game/AudioEngine';
import type { GameScene, GameCompleteData } from '@/game/scenes/GameScene';

type Props = { songId: string; chartId: string };

export function GameCanvas({ songId, chartId }: Props) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef      = useRef<Phaser.Game | null>(null);
  const audioRef     = useRef<AudioEngine>(new AudioEngine());
  const rawBytesRef  = useRef<ArrayBuffer | null>(null);

  const [audioReady, setAudioReady] = useState(false);
  const [started,    setStarted]    = useState(false);
  const [result,     setResult]     = useState<GameCompleteData | null>(null);

  // Pré-charge les octets audio en arrière-plan (pas de user gesture requis)
  useEffect(() => {
    setAudioReady(false);
    rawBytesRef.current = null;
    audioRef.current
      .prefetch(`/audio/${songId}.mp3`)
      .then(bytes => { rawBytesRef.current = bytes; })
      .finally(() => setAudioReady(true));
  }, [songId]);

  // Initialise Phaser (chart chargé en preload par GameScene)
  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    const game = createPhaserGame(containerRef.current, chartId);
    gameRef.current = game;
    game.events.on('game-complete', setResult);
    return () => {
      game.events.off('game-complete', setResult);
      game.destroy(true);
      gameRef.current = null;
      audioRef.current.destroy();
      audioRef.current = new AudioEngine();
    };
  }, [chartId]);

  // Dès que le résultat arrive, navigue vers /results
  useEffect(() => {
    if (!result) return;
    void navigate({
      to: '/results',
      search: {
        score:    result.score,
        maxCombo: result.maxCombo,
        accuracy: result.accuracy,
        rank:     result.rank,
        songId,
        chartId,
      },
    });
  }, [result, navigate, songId, chartId]);

  async function handleStart() {
    const audio = audioRef.current;
    audio.unlock(); // user gesture — crée l'AudioContext (obligatoire Safari iOS)

    if (rawBytesRef.current) {
      try {
        const buffer = await audio.decodeAudioData(rawBytesRef.current);
        audio.play(buffer); // startTime calé sur context.currentTime
      } catch {
        audio.markStart(); // fallback : pas de son mais timing correct
      }
    } else {
      audio.playTone(523, 0.12);
      audio.markStart();
    }

    const scene = gameRef.current?.scene.getScene('GameScene') as GameScene | null;
    scene?.setAudio(audio);
    scene?.start();
    setStarted(true);
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* Overlay START — visible jusqu'au premier clic */}
      {!started && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-vapor-bg/75">
          <p className="font-jp text-vapor-cyan/60 mb-6 text-xl tracking-widest">
            リズム・ゲーム
          </p>

          {!audioReady ? (
            <p className="font-display text-vapor-white/50 text-2xl tracking-widest animate-pulse-slow">
              LOADING...
            </p>
          ) : (
            <button
              type="button"
              onClick={() => void handleStart()}
              className="
                font-display border-vapor-pink text-vapor-pink
                hover:bg-vapor-pink hover:text-vapor-bg
                shadow-neon-pink border-2 px-16 py-5 text-4xl tracking-widest
                transition-all duration-200 hover:scale-105 active:scale-95
              "
            >
              ▶ START GAME
            </button>
          )}

          <p className="font-body text-vapor-white/30 mt-8 text-xs tracking-widest">
            D &nbsp;·&nbsp; F &nbsp;·&nbsp; J &nbsp;·&nbsp; K
          </p>
        </div>
      )}
    </div>
  );
}
