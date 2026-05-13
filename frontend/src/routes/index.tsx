import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { SettingsModal } from '@/components/SettingsModal';
import { saveSettings, type GameSettings } from '@/store/settings';

export const Route = createFileRoute('/')({
  component: HomePage,
});

type PingResponse = {
  ok: boolean;
  service: string;
  timestamp: string;
};

function HomePage() {
  const navigate = useNavigate();
  const [apiStatus,    setApiStatus]    = useState<'checking' | 'ok' | 'fail'>('checking');
  const [serverTime,   setServerTime]   = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetch('/api/ping')
      .then(r => r.json() as Promise<PingResponse>)
      .then(data => { setApiStatus(data.ok ? 'ok' : 'fail'); setServerTime(data.timestamp); })
      .catch(() => setApiStatus('fail'));
  }, []);

  function handleSaveSettings(s: GameSettings) {
    saveSettings(s);
    setShowSettings(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">

      {/* Kanji décoratif */}
      <p className="font-jp text-vapor-cyan/60 mb-4 text-2xl tracking-widest">
        リズム・ゲーム
      </p>

      {/* Titre */}
      <h1 className="font-display text-neon-pink animate-flicker mb-2 text-7xl md:text-9xl">
        NEON TEMPO
      </h1>

      <p className="font-display text-vapor-cyan mb-12 text-2xl tracking-[0.4em] md:text-3xl">
        ▸ A R C A D E   R H Y T H M ◂
      </p>

      {/* PRESS START */}
      <button
        type="button"
        onClick={() => void navigate({ to: '/songs' })}
        className="
          font-display border-vapor-pink text-vapor-pink hover:bg-vapor-pink hover:text-vapor-bg
          shadow-neon-pink relative border-2 px-12 py-4 text-3xl tracking-widest
          transition-all duration-200 hover:scale-105 active:scale-95
        "
      >
        ▶ PRESS START
      </button>

      {/* Score global */}
      <button
        type="button"
        onClick={() => void navigate({ to: '/leaderboard', search: { songId: undefined } })}
        className="
          font-display border-vapor-purple text-vapor-purple hover:bg-vapor-purple hover:text-vapor-bg
          mt-4 border px-12 py-3 text-xl tracking-widest
          transition-all duration-200 hover:scale-105 active:scale-95
        "
      >
        ◈ SCORE GLOBAL
      </button>

      {/* Paramètres */}
      <button
        type="button"
        onClick={() => setShowSettings(true)}
        className="
          font-display border-vapor-cyan/50 text-vapor-cyan/70 hover:border-vapor-cyan hover:text-vapor-cyan hover:bg-vapor-cyan/10
          mt-3 border px-12 py-3 text-xl tracking-widest
          transition-all duration-200 hover:scale-105 active:scale-95
        "
      >
        ⚙ PARAMÈTRES
      </button>

      {/* Status backend */}
      <div className="font-body fixed bottom-6 left-6 z-20 text-xs">
        <div className="flex items-center gap-2">
          <span className={
            apiStatus === 'ok'   ? 'text-vapor-cyan' :
            apiStatus === 'fail' ? 'text-vapor-pink' : 'text-vapor-white/50'
          }>●</span>
          <span className="text-vapor-white/70">
            {apiStatus === 'ok'       && 'BACKEND ONLINE'}
            {apiStatus === 'checking' && 'CONNECTING...'}
            {apiStatus === 'fail'     && 'BACKEND OFFLINE'}
          </span>
        </div>
        {serverTime && (
          <p className="text-vapor-white/40 mt-1">
            srv: {new Date(serverTime).toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Version */}
      <p className="font-body text-vapor-white/30 fixed right-6 bottom-6 z-20 text-xs">
        v0.7.0
      </p>

      {/* Modal paramètres */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onSave={handleSaveSettings}
        />
      )}
    </div>
  );
}
