import { createFileRoute } from '@tanstack/react-router';
import { GameCanvas } from '@/components/GameCanvas';

export const Route = createFileRoute('/game')({
  validateSearch: (search: Record<string, unknown>) => ({
    songId: typeof search.songId === 'string' ? search.songId : 'demo',
  }),
  component: GamePage,
});

function GamePage() {
  const { songId } = Route.useSearch();
  return (
    <div className="fixed inset-0 z-10">
      <GameCanvas songId={songId} />
    </div>
  );
}
