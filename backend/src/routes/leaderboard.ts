import { Router, type Request, type Response } from 'express';
import { eq, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { scores, songs } from '../db/schema.js';

export const leaderboardRouter = Router();

const BASE_SELECT = {
  id:         scores.id,
  playerName: scores.playerName,
  score:      scores.score,
  maxCombo:   scores.maxCombo,
  accuracy:   scores.accuracy,
  rank:       scores.rank,
  songId:     scores.songId,
  songTitle:  songs.title,
  createdAt:  scores.createdAt,
};

// GET /api/leaderboard/global — top 100 mondial
leaderboardRouter.get('/global', async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select(BASE_SELECT)
      .from(scores)
      .innerJoin(songs, eq(scores.songId, songs.id))
      .orderBy(desc(scores.score))
      .limit(100);
    res.json(rows);
  } catch (err) {
    console.error('[GET /api/leaderboard/global]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/leaderboard/song/:id — top 100 par morceau
leaderboardRouter.get('/song/:id', async (req: Request, res: Response) => {
  try {
    const rows = await db
      .select(BASE_SELECT)
      .from(scores)
      .innerJoin(songs, eq(scores.songId, songs.id))
      .where(eq(scores.songId, String(req.params.id)))
      .orderBy(desc(scores.score))
      .limit(100);
    res.json(rows);
  } catch (err) {
    console.error('[GET /api/leaderboard/song/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
