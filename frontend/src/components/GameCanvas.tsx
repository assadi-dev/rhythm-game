import { useEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type Phaser from 'phaser';
import { createPhaserGame } from '@/game/PhaserGame';
import { AudioEngine } from '@/game/AudioEngine';
import type { GameScene, GameCompleteData } from '@/game/scenes/GameScene';
import { PauseMenu } from './PauseMenu';
import { SettingsModal } from './SettingsModal';
import { getSettings, displayCode, type GameSettings } from '@/store/settings';
import type { Difficulty } from '@/game/beatGenerator';

type Props = { songId: string; chartId: string; difficulty: Difficulty };

export function GameCanvas({ songId, chartId, difficulty }: Props) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef      = useRef<Phaser.Game | null>(null);
  const audioRef     = useRef<AudioEngine>(new AudioEngine());
  const rawBytesRef  = useRef<ArrayBuffer | null>(null);

  const [audioReady,   setAudioReady]   = useState(false);
  const [started,      setStarted]      = useState(false);
  const [isPaused,     setIsPaused]     = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [result,       setResult]       = useState<GameCompleteData | null>(null);

  // Pré-charge les octets audio + applique le volume sauvegardé
  useEffect(() => {
    setAudioReady(false);
    rawBytesRef.current = null;
    const { volume } = getSettings();
    audioRef.current.setVolume(volume);
    audioRef.current
      .prefetch(`/audio/${songId}.mp3`)
      .then(bytes => { rawBytesRef.current = bytes; })
      .finally(() => setAudioReady(true));
  }, [songId]);

  // Initialise Phaser + abonnement aux événements
  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    const game = createPhaserGame(containerRef.current, chartId, difficulty);
    gameRef.current = game;

    game.events.on('game-complete', setResult);
    game.events.on('game-paused',   () => { audioRef.current.pauseAudio(); setIsPaused(true); });
    game.events.on('game-resumed',  () => { setIsPaused(false); });
    game.events.on('game-exit',     () => { void navigate({ to: '/songs' }); });

    return () => {
      game.events.removeAllListeners('game-complete');
      game.events.removeAllListeners('game-paused');
      game.events.removeAllListeners('game-resumed');
      game.events.removeAllListeners('game-exit');
      game.destroy(true);
      gameRef.current = null;
      audioRef.current.destroy();
      audioRef.current = new AudioEngine();
    };
  }, [chartId, navigate]);

  // Quand le résultat arrive, navigue vers /results
  useEffect(() => {
    if (!result) return;
    void navigate({
      to: '/results',
      search: { score: result.score, maxCombo: result.maxCombo, accuracy: result.accuracy, rank: result.rank, songId, chartId, difficulty },
    });
  }, [result, navigate, songId, chartId]);

  // Désactive le clavier Phaser pendant le remapping de touches
  useEffect(() => {
    const scene = getScene();
    if (!scene) return;
    scene.setKeyboardEnabled(!showSettings);
  }, [showSettings]);

  function getScene(): GameScene | null {
    return gameRef.current?.scene.getScene('GameScene') as GameScene | null ?? null;
  }

  async function handleStart() {
    const audio = audioRef.current;
    const { volume } = getSettings();
    audio.setVolume(volume);
    audio.unlock();

    if (rawBytesRef.current) {
      try {
        const buffer = await audio.decodeAudioData(rawBytesRef.current);
        audio.play(buffer);
      } catch {
        audio.markStart();
      }
    } else {
      audio.playTone(523, 0.12);
      audio.markStart();
    }

    getScene()?.setAudio(audio);
    getScene()?.start();
    setStarted(true);
  }

  function handleResume() {
    audioRef.current.resumeAudio();
    getScene()?.resume(); // émet game-resumed → setIsPaused(false)
  }

  function handleOpenSettings() {
    setShowSettings(true);
    // keyboardEnabled=false posé par le useEffect sur showSettings
  }

  function handleCloseSettings() {
    setShowSettings(false);
    // keyboardEnabled=true restauré par le useEffect
  }

  function handleSaveSettings(newSettings: GameSettings) {
    audioRef.current.setVolume(newSettings.volume);
    getScene()?.refreshKeyLabels();
    setShowSettings(false);
  }

  // Touche clavier pour reprendre directement via ESC (déjà géré dans GameScene)
  // mais on écoute aussi ici pour les cas où GameScene est en pause
  useEffect(() => {
    if (!isPaused || showSettings) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') handleResume();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused, showSettings]);

  const { keys } = getSettings();
  const keyHints = (['lane0', 'lane1', 'lane2', 'lane3'] as const)
    .map(k => displayCode(keys[k]))
    .join(' · ');

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* ── Overlay START ── */}
      {!started && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-vapor-bg/75">
          <p className="font-jp text-vapor-cyan/60 mb-6 text-xl tracking-widest">リズム・ゲーム</p>
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
          <p className="font-body text-vapor-white/30 mt-8 text-xs tracking-widest">{keyHints}</p>
        </div>
      )}

      {/* ── Menu Pause ── */}
      {started && isPaused && !showSettings && (
        <PauseMenu
          onResume={handleResume}
          onSettings={handleOpenSettings}
          onQuit={() => void navigate({ to: '/songs' })}
        />
      )}

      {/* ── Modal Paramètres ── */}
      {showSettings && (
        <SettingsModal
          onClose={handleCloseSettings}
          onSave={handleSaveSettings}
        />
      )}
    </div>
  );
}
