import { Router, type Request, type Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { songs, charts } from '../db/schema.js';

export const songsRouter = Router();

// GET /api/songs — liste du catalogue
songsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const rows = await db.select().from(songs).orderBy(songs.title);
    // Ajoute les difficultés de chaque morceau
    const result = await Promise.all(
      rows.map(async (song) => {
        const diffs = await db
          .select({ id: charts.id, level: charts.level, rating: charts.rating })
          .from(charts)
          .where(eq(charts.songId, song.id));
        return { ...song, difficulties: diffs, available: true };
      }),
    );
    res.json(result);
  } catch (err) {
    console.error('[GET /api/songs]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/songs/:id — détails + difficultés
songsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const [song] = await db
      .select()
      .from(songs)
      .where(eq(songs.id, String(req.params.id)));

    if (!song) {
      res.status(404).json({ error: 'Song not found' });
      return;
    }

    const diffs = await db
      .select({ id: charts.id, level: charts.level, rating: charts.rating })
      .from(charts)
      .where(eq(charts.songId, song.id));

    res.json({ ...song, difficulties: diffs, available: true });
  } catch (err) {
    console.error('[GET /api/songs/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
