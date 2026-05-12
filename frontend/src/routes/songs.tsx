import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { MOCK_SONGS, fetchSongs } from '@/api/songs';
import type { SongInfo, DifficultyInfo } from '@/types/song';

export const Route = createFileRoute('/songs')({
  component: SongsPage,
});

function SongsPage() {
  const navigate = useNavigate();
  const [songs,   setSongs]   = useState<SongInfo[]>(MOCK_SONGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSongs()
      .then(setSongs)
      .finally(() => setLoading(false));
  }, []);

  function handleSelect(song: SongInfo, chartId: string) {
    if (!song.available) return;
    void navigate({ to: '/game', search: { songId: song.id, chartId } });
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-12">
      {/* Header */}
      <p className="font-jp text-vapor-cyan/60 mb-2 text-xl tracking-widest">
        楽曲選択
      </p>
      <h1 className="font-display text-vapor-pink mb-12 text-6xl tracking-widest">
        SONG SELECT
      </h1>

      {/* Song list */}
      <div className="w-full max-w-2xl flex flex-col gap-4">
        {loading ? (
          <p className="font-display text-vapor-white/30 text-center py-10 text-2xl tracking-widest animate-pulse-slow">
            LOADING...
          </p>
        ) : (
          songs.map((song) => (
            <SongCard key={song.id} song={song} onSelect={(s, cId) => handleSelect(s, cId)} />
          ))
        )}
      </div>

      {/* Back */}
      <button
        type="button"
        onClick={() => void navigate({ to: '/' })}
        className="font-body text-vapor-white/40 hover:text-vapor-white mt-12 text-xs tracking-widest transition-colors"
      >
        ← BACK
      </button>
    </div>
  );
}

function SongCard({
  song,
  onSelect,
}: {
  song: SongInfo;
  onSelect: (s: SongInfo, chartId: string) => void;
}) {
  const minutes = Math.floor(song.duration / 60);
  const seconds = (song.duration % 60).toString().padStart(2, '0');

  if (!song.available) {
    return (
      <div className="border border-vapor-white/10 bg-vapor-bg-mid/20 p-5 opacity-40 cursor-not-allowed select-none">
        <div className="flex justify-between items-start mb-2">
          <h2 className="font-display text-vapor-white text-2xl">{song.title}</h2>
          <span className="font-body text-vapor-white/50 text-xs">BPM {song.bpm}</span>
        </div>
        <p className="font-jp text-vapor-white/40 text-sm mb-3">{song.artist}</p>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {song.difficulties.map((d) => (
              <DiffBadge key={d.id} diff={d} />
            ))}
          </div>
          <span className="font-body text-vapor-white/30 text-xs tracking-widest">
            COMING SOON
          </span>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(song, song.difficulties[0]?.id ?? song.id + '-normal')}
      className="
        text-left border border-vapor-pink/40 bg-vapor-bg-mid/40 p-5
        hover:border-vapor-pink hover:bg-vapor-bg-mid/70
        shadow-neon-pink/0 hover:shadow-neon-pink
        transition-all duration-200 group
      "
    >
      <div className="flex justify-between items-start mb-2">
        <h2 className="font-display text-vapor-pink text-2xl group-hover:text-neon-pink transition-colors">
          {song.title}
        </h2>
        <span className="font-body text-vapor-cyan text-xs">BPM {song.bpm}</span>
      </div>
      <p className="font-jp text-vapor-cyan/60 text-sm mb-3">{song.artist}</p>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {song.difficulties.map((d) => (
            <DiffBadge key={d.id} diff={d} />
          ))}
        </div>
        <span className="font-body text-vapor-white/40 text-xs">
          {minutes}:{seconds}
        </span>
      </div>
    </button>
  );
}

function DiffBadge({ diff }: { diff: DifficultyInfo }) {
  const colors: Record<string, string> = {
    EASY:   'border-vapor-cyan   text-vapor-cyan',
    NORMAL: 'border-vapor-purple text-vapor-purple',
    HARD:   'border-vapor-pink   text-vapor-pink',
  };
  return (
    <span
      className={`font-body border px-2 py-0.5 text-xs tracking-wider ${colors[diff.level] ?? ''}`}
    >
      {diff.level} {diff.rating}
    </span>
  );
}
