import { createFileRoute } from '@tanstack/react-router';
import { GameCanvas } from '@/components/GameCanvas';

export const Route = createFileRoute('/game')({
  validateSearch: (search: Record<string, unknown>) => ({
    songId:  typeof search.songId  === 'string' ? search.songId  : 'demo',
    chartId: typeof search.chartId === 'string' ? search.chartId : 'demo-normal',
  }),
  component: GamePage,
});

function GamePage() {
  const { songId, chartId } = Route.useSearch();
  return (
    <div className="fixed inset-0 z-10">
      <GameCanvas songId={songId} chartId={chartId} />
    </div>
  );
}
