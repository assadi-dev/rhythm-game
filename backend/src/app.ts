import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';

export function createApp(): Express {
  const app = express();

  // ---- Middlewares globaux ----
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));

  // ---- Healthcheck / ping ----
  // Sert à vérifier que le backend tourne et que le frontend peut le joindre.
  app.get('/api/ping', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      service: 'rhythm-game-api',
      timestamp: new Date().toISOString(),
    });
  });

  // ---- TODO: monter les routes (songs, sessions, scores, leaderboard) ----
  // app.use('/api/songs', songsRouter);
  // app.use('/api/sessions', sessionsRouter);
  // app.use('/api/scores', scoresRouter);
  // app.use('/api/leaderboard', leaderboardRouter);

  // ---- 404 handler ----
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
  });

  return app;
}
