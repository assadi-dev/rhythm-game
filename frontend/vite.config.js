import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import path from 'path';
export default defineConfig({
    plugins: [
        // Le plugin TanStack DOIT être avant react()
        // Il scanne src/routes/ et génère src/routeTree.gen.ts
        TanStackRouterVite({
            routesDirectory: './src/routes',
            generatedRouteTree: './src/routeTree.gen.ts',
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
        // Proxy vers le backend Express : tout ce qui commence par /api est forwardé
        // → évite les soucis CORS pendant le dev
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
            '/audio': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
        },
    },
    build: {
        target: 'es2022',
        // Phaser est gros (~1MB) — on le sépare en chunk pour le cache navigateur
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser'],
                },
            },
        },
    },
});
