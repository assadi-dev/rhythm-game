import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { MOCK_SONGS } from '@/api/songs';

export const Route = createFileRoute('/leaderboard')({
  validateSearch: (search: Record<string, unknown>) => ({
    songId: typeof search.songId === 'string' ? search.songId : '',
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const navigate = useNavigate();
  const { songId } = Route.useSearch();

  const song = MOCK_SONGS.find((s) => s.id === songId);
  const title = song ? song.title : 'GLOBAL';

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-12">
      {/* Header */}
      <p className="font-jp text-vapor-cyan/60 mb-2 text-xl tracking-widest">
        スコア
      </p>
      <h1 className="font-display text-vapor-pink mb-2 text-5xl tracking-widest">
        LEADERBOARD
      </h1>
      <p className="font-body text-vapor-white/40 mb-10 text-xs tracking-widest">
        {title}
      </p>

      {/* Table header */}
      <div className="w-full max-w-2xl">
        <div className="font-body grid grid-cols-[3rem_1fr_8rem_6rem] gap-2 border-b border-vapor-white/10 pb-2 text-xs tracking-widest text-vapor-white/40">
          <span>#</span>
          <span>PLAYER</span>
          <span className="text-right">SCORE</span>
          <span className="text-right">ACC</span>
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="font-jp text-vapor-white/20 text-4xl">空</p>
          <p className="font-body text-vapor-white/30 text-xs tracking-widest">
            NO SCORES YET — BE THE FIRST
          </p>
          <p className="font-body text-vapor-white/20 text-xs">
            (score submission available in a future update)
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-4 mt-4">
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
