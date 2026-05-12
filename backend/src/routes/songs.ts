import { Router, type Request, type Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { songs, charts } from '../db/schema.js';
import { generateNotes, DIFFICULTY_RATING, type Difficulty } from '../utils/beatGenerator.js';

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

/**
 * POST /api/songs/generate
 *
 * Génère un chart rythmique depuis les métadonnées d'un morceau
 * et persiste le tout en base de données (songs + charts).
 *
 * Body JSON attendu :
 * {
 *   "songId":     "ma-chanson",          // requis — identifiant unique
 *   "title":      "Ma Chanson",          // requis
 *   "artist":     "Artiste",             // optionnel
 *   "bpm":        128,                   // requis
 *   "duration":   180,                   // requis — secondes
 *   "difficulty": "NORMAL",             // optionnel (EASY|NORMAL|HARD)
 *   "seed":       42                     // optionnel — pour un résultat reproductible
 * }
 */
type GenerateBody = {
  songId:      string;
  title:       string;
  artist?:     string;
  bpm:         number;
  duration:    number;
  difficulty?: string;
  seed?:       number;
};

songsRouter.post('/generate', async (req: Request, res: Response) => {
  const body = req.body as Partial<GenerateBody>;

  const { songId, title } = body;
  const bpm      = Number(body.bpm);
  const duration = Number(body.duration);

  if (!songId || !title || !bpm || !duration) {
    res.status(400).json({ error: 'Champs requis : songId, title, bpm, duration' });
    return;
  }

  const artist     = body.artist?.trim()     || 'Unknown Artist';
  const rawDiff    = (body.difficulty ?? 'NORMAL').toUpperCase();
  const difficulty = (['EASY', 'NORMAL', 'HARD'].includes(rawDiff) ? rawDiff : 'NORMAL') as Difficulty;
  const chartId    = `${songId}-${difficulty.toLowerCase()}`;

  try {
    // Génération des notes
    const notes = generateNotes(bpm, duration, difficulty, body.seed);

    // Upsert dans songs
    await db
      .insert(songs)
      .values({ id: songId, title, artist, bpm, duration: Math.round(duration) })
      .onConflictDoUpdate({
        target: songs.id,
        set:    { title, artist, bpm, duration: Math.round(duration) },
      });

    // Upsert dans charts
    const [chart] = await db
      .insert(charts)
      .values({
        id:     chartId,
        songId,
        level:  difficulty,
        rating: DIFFICULTY_RATING[difficulty],
        notes,
      })
      .onConflictDoUpdate({
        target: charts.id,
        set:    { notes, level: difficulty, rating: DIFFICULTY_RATING[difficulty] },
      })
      .returning();

    res.status(201).json({
      song:  { id: songId, title, artist, bpm, duration },
      chart: { id: chartId, songId, level: difficulty, rating: DIFFICULTY_RATING[difficulty], noteCount: notes.length },
    });
  } catch (err) {
    console.error('[POST /api/songs/generate]', err);
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
