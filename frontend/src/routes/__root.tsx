import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

/**
 * Route racine : layout commun à toutes les pages.
 * - Décor vaporwave (grille perspective + sun)
 * - Outlet rend la route active
 * - Devtools en bas pour le dev
 */
export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="vapor-scanlines relative min-h-screen w-full overflow-hidden">
      {/* Fond animé vaporwave */}
      <div className="vapor-sun" />
      <div className="vapor-grid" />

      {/* Contenu des routes */}
      <main className="relative z-10 min-h-screen w-full">
        <Outlet />
      </main>

      {/* Devtools uniquement en dev (Vite enlève en prod) */}
      {import.meta.env.DEV && (
        <TanStackRouterDevtools position="bottom-right" />
      )}
    </div>
  );
}
