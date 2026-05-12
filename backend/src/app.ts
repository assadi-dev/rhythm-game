import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { songsRouter }       from './routes/songs.js';
import { chartsRouter }      from './routes/charts.js';
import { scoresRouter }      from './routes/scores.js';
import { leaderboardRouter } from './routes/leaderboard.js';
import { uploadRouter }      from './routes/upload.js';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const assetsDir  = path.join(__dirname, '../assets');

export function createApp(): Express {
  const app = express();

  // ---- Middlewares globaux ----
  app.use(cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  }));
  app.use(express.json({ limit: '1mb' }));

  // ---- Fichiers audio statiques ----
  // Les MP3 vont dans backend/assets/audio/{songId}.mp3
  app.use('/audio', express.static(path.join(assetsDir, 'audio')));

  // ---- Healthcheck ----
  app.get('/api/ping', (_req: Request, res: Response) => {
    res.json({ ok: true, service: 'rhythm-game-api', timestamp: new Date().toISOString() });
  });

  // ---- Routes API ----
  app.use('/api/upload',      uploadRouter);
  app.use('/api/songs',       songsRouter);
  app.use('/api/charts',      chartsRouter);
  app.use('/api/scores',      scoresRouter);
  app.use('/api/leaderboard', leaderboardRouter);

  // ---- 404 ----
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
  });

  return app;
}
