import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { MOCK_SONGS, fetchSongs } from '@/api/songs';
import { ACTIVE_LANES, type Difficulty } from '@/game/beatGenerator';
import type { SongInfo, DifficultyInfo } from '@/types/song';

export const Route = createFileRoute('/songs')({
  component: SongsPage,
});

// ─── Sélecteur de difficulté ─────────────────────────────────────────────────

const DIFF_META: {
  key:       Difficulty;
  label:     string;
  jp:        string;
  color:     string;
  border:    string;
}[] = [
  { key: 'EASY',   label: 'FACILE',    jp: '易しい',  color: 'text-vapor-cyan',   border: 'border-vapor-cyan'   },
  { key: 'NORMAL', label: 'NORMAL',    jp: '普通',    color: 'text-vapor-purple', border: 'border-vapor-purple' },
  { key: 'HARD',   label: 'DIFFICILE', jp: '難しい',  color: 'text-vapor-pink',   border: 'border-vapor-pink'   },
];

// Dots visuels représentant les 4 lanes (● = active, · = inactive)
function LaneDots({ difficulty }: { difficulty: Difficulty }) {
  const active   = ACTIVE_LANES[difficulty] as readonly number[];
  const COLORS   = ['#ff71ce', '#01cdfe', '#b967ff', '#ff71ce'];
  return (
    <div className="flex gap-1.5 items-center">
      {[0, 1, 2, 3].map(i => (
        <span
          key={i}
          style={{ color: active.includes(i) ? COLORS[i] : undefined }}
          className={active.includes(i) ? 'text-base' : 'text-vapor-white/20 text-base'}
        >
          {active.includes(i) ? '◆' : '·'}
        </span>
      ))}
    </div>
  );
}

function DifficultyPicker({
  song,
  onPick,
  onCancel,
}: {
  song:     SongInfo;
  onPick:   (difficulty: Difficulty) => void;
  onCancel: () => void;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-30 bg-vapor-bg/85">
      <div className="w-full max-w-sm px-8 py-10 border border-vapor-pink/30 bg-vapor-bg-mid/60">
        {/* En-tête */}
        <p className="font-jp text-vapor-cyan/60 mb-1 text-center text-lg tracking-widest">難易度選択</p>
        <h2 className="font-display text-vapor-pink text-center text-3xl mb-1 tracking-widest">
          {song.title}
        </h2>
        <p className="font-body text-vapor-white/40 text-center text-xs mb-8 tracking-widest">
          {song.artist} · {song.bpm} BPM
        </p>

        {/* Options de difficulté */}
        <div className="flex flex-col gap-3 mb-8">
          {DIFF_META.map(({ key, label, jp, color, border }) => (
            <button
              key={key}
              type="button"
              onClick={() => onPick(key)}
              className={`
                font-display ${border} ${color}
                hover:bg-opacity-10 border-2 px-6 py-4
                transition-all duration-150 hover:scale-[1.02] active:scale-95
                flex items-center justify-between
              `}
            >
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-2xl tracking-widest">{label}</span>
                <span className="font-jp text-xs opacity-60">{jp}</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <LaneDots difficulty={key} />
                <span className="font-body text-xs opacity-50">
                  {ACTIVE_LANES[key].length} touches
                </span>
              </div>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="w-full font-body text-vapor-white/30 hover:text-vapor-white/60 text-xs tracking-widest transition-colors"
        >
          ← ANNULER
        </button>
      </div>
    </div>
  );
}

// ─── Page principale ─────────────────────────────────────────────────────────

function SongsPage() {
  const navigate = useNavigate();
  const [songs,        setSongs]        = useState<SongInfo[]>(MOCK_SONGS);
  const [loading,      setLoading]      = useState(true);
  const [selectedSong, setSelectedSong] = useState<SongInfo | null>(null);

  useEffect(() => {
    fetchSongs()
      .then(setSongs)
      .finally(() => setLoading(false));
  }, []);

  function handleSongClick(song: SongInfo) {
    if (!song.available) return;
    setSelectedSong(song);
  }

  function handleDifficultyPick(difficulty: Difficulty) {
    if (!selectedSong) return;
    const chartId = selectedSong.difficulties[0]?.id ?? `${selectedSong.id}-normal`;
    void navigate({ to: '/game', search: { songId: selectedSong.id, chartId, difficulty } });
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center px-4 py-12">
      {/* Header */}
      <p className="font-jp text-vapor-cyan/60 mb-2 text-xl tracking-widest">楽曲選択</p>
      <h1 className="font-display text-vapor-pink mb-12 text-6xl tracking-widest">SONG SELECT</h1>

      {/* Song list */}
      <div className="w-full max-w-2xl flex flex-col gap-4">
        {loading ? (
          <p className="font-display text-vapor-white/30 text-center py-10 text-2xl tracking-widest animate-pulse-slow">
            LOADING...
          </p>
        ) : (
          songs.map(song => (
            <SongCard key={song.id} song={song} onClick={handleSongClick} />
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

      {/* Sélecteur de difficulté (overlay) */}
      {selectedSong && (
        <DifficultyPicker
          song={selectedSong}
          onPick={handleDifficultyPick}
          onCancel={() => setSelectedSong(null)}
        />
      )}
    </div>
  );
}

// ─── Carte chanson ────────────────────────────────────────────────────────────

function SongCard({ song, onClick }: { song: SongInfo; onClick: (s: SongInfo) => void }) {
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
            {song.difficulties.map(d => <DiffBadge key={d.id} diff={d} />)}
          </div>
          <span className="font-body text-vapor-white/30 text-xs tracking-widest">COMING SOON</span>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onClick(song)}
      className="
        text-left border border-vapor-pink/40 bg-vapor-bg-mid/40 p-5
        hover:border-vapor-pink hover:bg-vapor-bg-mid/70
        hover:shadow-neon-pink transition-all duration-200 group
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
          {song.difficulties.map(d => <DiffBadge key={d.id} diff={d} />)}
        </div>
        <span className="font-body text-vapor-white/40 text-xs">{minutes}:{seconds}</span>
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
    <span className={`font-body border px-2 py-0.5 text-xs tracking-wider ${colors[diff.level] ?? ''}`}>
      {diff.level} {diff.rating}
    </span>
  );
}
