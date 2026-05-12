import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/leaderboard')({
  validateSearch: (search: Record<string, unknown>) => ({
    songId: typeof search.songId === 'string' ? search.songId : '',
  }),
  component: LeaderboardPage,
});

type Entry = {
  id:         string;
  playerName: string;
  score:      number;
  maxCombo:   number;
  accuracy:   number;
  rank:       string;
  songTitle:  string;
  createdAt:  string;
};

const RANK_COLORS: Record<string, string> = {
  SS: '#fffb96', S: '#01cdfe', A: '#b967ff', B: '#ff71ce', C: '#ffb3e0', D: '#fff8fc',
};

function LeaderboardPage() {
  const navigate = useNavigate();
  const { songId } = Route.useSearch();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = songId
      ? `/api/leaderboard/song/${songId}`
      : '/api/leaderboard/global';

    fetch(url)
      .then(r => r.json() as Promise<Entry[]>)
      .then(data => setEntries(Array.isArray(data) ? data : []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [songId]);

  const pageTitle = songId ? (entries[0]?.songTitle ?? songId.toUpperCase()) : 'GLOBAL';

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-12">
      {/* Header */}
      <p className="font-jp text-vapor-cyan/60 mb-2 text-xl tracking-widest">スコア</p>
      <h1 className="font-display text-vapor-pink mb-2 text-5xl tracking-widest">
        LEADERBOARD
      </h1>
      <p className="font-body text-vapor-white/40 mb-10 text-xs tracking-widest">
        {pageTitle}
      </p>

      {/* Table */}
      <div className="w-full max-w-2xl">
        {/* Header row */}
        <div className="font-body grid grid-cols-[2.5rem_2.5rem_1fr_8rem_5rem_5rem] gap-x-3 border-b border-vapor-white/10 pb-2 text-xs tracking-widest text-vapor-white/40">
          <span>#</span>
          <span>RK</span>
          <span>PLAYER</span>
          <span className="text-right">SCORE</span>
          <span className="text-right">COMBO</span>
          <span className="text-right">ACC</span>
        </div>

        {loading && (
          <p className="font-display text-vapor-white/30 text-center py-16 text-2xl tracking-widest animate-pulse-slow">
            LOADING...
          </p>
        )}

        {!loading && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="font-jp text-vapor-white/20 text-4xl">空</p>
            <p className="font-body text-vapor-white/30 text-xs tracking-widest">
              NO SCORES YET — BE THE FIRST
            </p>
          </div>
        )}

        {!loading && entries.map((e, i) => (
          <div
            key={e.id}
            className="font-body grid grid-cols-[2.5rem_2.5rem_1fr_8rem_5rem_5rem] gap-x-3 border-b border-vapor-white/5 py-2 text-sm items-center"
          >
            <span className="text-vapor-white/30 text-xs">#{i + 1}</span>
            <span
              className="font-display text-base"
              style={{ color: RANK_COLORS[e.rank] ?? '#fff8fc' }}
            >
              {e.rank}
            </span>
            <span className="text-vapor-white truncate">{e.playerName}</span>
            <span className="text-right text-vapor-yellow font-display text-base">
              {e.score.toString().padStart(8, '0')}
            </span>
            <span className="text-right text-vapor-white/50 text-xs">
              {e.maxCombo}×
            </span>
            <span className="text-right text-vapor-cyan text-xs">
              {e.accuracy.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex gap-4 mt-10">
        {songId && (
          <button
            type="button"
            onClick={() => void navigate({ to: '/game', search: { songId, chartId: songId + '-normal' } })}
            className="
              font-display border-vapor-pink text-vapor-pink
              hover:bg-vapor-pink hover:text-vapor-bg
              border-2 px-6 py-2 text-xl tracking-widest
              transition-all duration-200 hover:scale-105 active:scale-95
            "
          >
            ▶ PLAY
          </button>
        )}
        <button
          type="button"
          onClick={() => void navigate({ to: '/songs' })}
          className="
            font-display border-vapor-cyan text-vapor-cyan
            hover:bg-vapor-cyan hover:text-vapor-bg
            border-2 px-6 py-2 text-xl tracking-widest
            transition-all duration-200 hover:scale-105 active:scale-95
          "
        >
          ◀ SONGS
        </button>
      </div>
    </div>
  );
}
