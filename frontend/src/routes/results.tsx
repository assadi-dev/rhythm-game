import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/results')({
  validateSearch: (search: Record<string, unknown>) => ({
    score:    Number(search.score)    || 0,
    maxCombo: Number(search.maxCombo) || 0,
    accuracy: Number(search.accuracy) || 0,
    rank:     typeof search.rank   === 'string' ? search.rank   : 'D',
    songId:   typeof search.songId === 'string' ? search.songId : 'demo',
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const navigate = useNavigate();
  const { score, maxCombo, accuracy, rank, songId } = Route.useSearch();

  const rankStyle = RANK_STYLES[rank] ?? RANK_STYLES['D'];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="font-jp text-vapor-cyan/60 mb-4 text-xl tracking-widest">
        リザルト
      </p>

      {/* Rang */}
      <div
        className="font-display mb-3 select-none"
        style={{
          fontSize: 'clamp(6rem, 20vw, 10rem)',
          color: rankStyle.color,
          textShadow: `0 0 20px ${rankStyle.color}, 0 0 60px ${rankStyle.color}80`,
        }}
      >
        {rank}
      </div>

      {/* Score */}
      <div className="font-display text-vapor-white mb-8 text-5xl md:text-6xl">
        {score.toString().padStart(8, '0')}
      </div>

      {/* Stats */}
      <div className="font-body flex gap-10 mb-12 text-sm tracking-widest">
        <div className="flex flex-col items-center gap-1">
          <span className="text-vapor-white/40 text-xs">MAX COMBO</span>
          <span className="text-vapor-yellow text-2xl font-display">{maxCombo}×</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-vapor-white/40 text-xs">ACCURACY</span>
          <span className="text-vapor-cyan text-2xl font-display">
            {accuracy.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Boutons */}
      <div className="flex flex-wrap justify-center gap-4">
        <button
          type="button"
          onClick={() => void navigate({ to: '/game', search: { songId } })}
          className="
            font-display border-vapor-pink text-vapor-pink
            hover:bg-vapor-pink hover:text-vapor-bg
            border-2 px-8 py-3 text-2xl tracking-widest
            transition-all duration-200 hover:scale-105 active:scale-95
          "
        >
          ▶ RETRY
        </button>
        <button
          type="button"
          onClick={() => void navigate({ to: '/leaderboard', search: { songId } })}
          className="
            font-display border-vapor-purple text-vapor-purple
            hover:bg-vapor-purple hover:text-vapor-bg
            border-2 px-8 py-3 text-2xl tracking-widest
            transition-all duration-200 hover:scale-105 active:scale-95
          "
        >
          ◈ SCORES
        </button>
        <button
          type="button"
          onClick={() => void navigate({ to: '/' })}
          className="
            font-display border-vapor-cyan text-vapor-cyan
            hover:bg-vapor-cyan hover:text-vapor-bg
            border-2 px-8 py-3 text-2xl tracking-widest
            transition-all duration-200 hover:scale-105 active:scale-95
          "
        >
          ◀ HOME
        </button>
      </div>
    </div>
  );
}

const RANK_STYLES: Record<string, { color: string }> = {
  SS: { color: '#fffb96' },
  S:  { color: '#01cdfe' },
  A:  { color: '#b967ff' },
  B:  { color: '#ff71ce' },
  C:  { color: '#ffb3e0' },
  D:  { color: '#fff8fc' },
};
