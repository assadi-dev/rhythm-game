import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

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
  const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'fail'>(
    'checking'
  );
  const [serverTime, setServerTime] = useState<string | null>(null);

  // Test simple : on ping le backend pour vérifier que tout est connecté
  useEffect(() => {
    fetch('/api/ping')
      .then((r) => r.json() as Promise<PingResponse>)
      .then((data) => {
        setApiStatus(data.ok ? 'ok' : 'fail');
        setServerTime(data.timestamp);
      })
      .catch(() => setApiStatus('fail'));
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      {/* Kanji décoratif en haut */}
      <p className="font-jp text-vapor-cyan/60 mb-4 text-2xl tracking-widest">
        リズム・ゲーム
      </p>

      {/* Titre principal */}
      <h1 className="font-display text-neon-pink animate-flicker mb-2 text-7xl md:text-9xl">
        NEON TEMPO
      </h1>

      <p className="font-display text-vapor-cyan mb-12 text-2xl tracking-[0.4em] md:text-3xl">
        ▸ A R C A D E   R H Y T H M ◂
      </p>

      {/* Bouton principal */}
      <button
        type="button"
        className="
          font-display border-vapor-pink text-vapor-pink hover:bg-vapor-pink hover:text-vapor-bg
          shadow-neon-pink relative border-2 px-12 py-4 text-3xl tracking-widest
          transition-all duration-200 hover:scale-105
          active:scale-95
        "
        onClick={() => void navigate({ to: '/game' })}
      >
        ▶ PRESS START
      </button>

      {/* Status backend en bas */}
      <div className="font-body fixed bottom-6 left-6 z-20 text-xs">
        <div className="flex items-center gap-2">
          <span
            className={
              apiStatus === 'ok'
                ? 'text-vapor-cyan'
                : apiStatus === 'fail'
                  ? 'text-vapor-pink'
                  : 'text-vapor-white/50'
            }
          >
            ●
          </span>
          <span className="text-vapor-white/70">
            {apiStatus === 'ok' && 'BACKEND ONLINE'}
            {apiStatus === 'checking' && 'CONNECTING...'}
            {apiStatus === 'fail' && 'BACKEND OFFLINE'}
          </span>
        </div>
        {serverTime && (
          <p className="text-vapor-white/40 mt-1">
            srv: {new Date(serverTime).toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Version en bas à droite */}
      <p className="font-body text-vapor-white/30 fixed right-6 bottom-6 z-20 text-xs">
        v0.2.0 — étape 2
      </p>
    </div>
  );
}
