import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';

// Route tree généré automatiquement par @tanstack/router-plugin/vite
// au démarrage (regarde dans src/routes/)
import { routeTree } from './routeTree.gen';

import './index.css';

// Crée l'instance du routeur
const router = createRouter({ routeTree });

// Type-safety globale du routeur (utilisé partout dans l'app)
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
