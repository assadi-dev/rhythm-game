import { createFileRoute } from '@tanstack/react-router';
import { GameCanvas } from '@/components/GameCanvas';

export const Route = createFileRoute('/game')({
  component: GamePage,
});

function GamePage() {
  return (
    <div className="fixed inset-0 z-10">
      <GameCanvas />
    </div>
  );
}
