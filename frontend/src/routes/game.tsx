import { createFileRoute } from '@tanstack/react-router';
import { GameCanvas } from '@/components/GameCanvas';
import type { Difficulty } from '@/game/beatGenerator';

const DIFFICULTIES: Difficulty[] = ['EASY', 'NORMAL', 'HARD'];

export const Route = createFileRoute('/game')({
  validateSearch: (search: Record<string, unknown>) => {
    const songId     = typeof search.songId     === 'string' ? search.songId     : 'demo';
    const chartId    = typeof search.chartId    === 'string' ? search.chartId    : `${songId}-normal`;
    const rawDiff    = typeof search.difficulty === 'string' ? search.difficulty.toUpperCase() : 'NORMAL';
    const difficulty = (DIFFICULTIES.includes(rawDiff as Difficulty) ? rawDiff : 'NORMAL') as Difficulty;
    return { songId, chartId, difficulty };
  },
  component: GamePage,
});

function GamePage() {
  const { songId, chartId, difficulty } = Route.useSearch();
  return (
    <div className="fixed inset-0 z-10">
      <GameCanvas songId={songId} chartId={chartId} difficulty={difficulty} />
    </div>
  );
}
