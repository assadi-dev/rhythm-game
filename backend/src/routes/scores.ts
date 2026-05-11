import { Router, type Request, type Response } from 'express';
import { db } from '../db/index.js';
import { scores } from '../db/schema.js';

export const scoresRouter = Router();

type ScoreBody = {
  chartId:    string;
  songId:     string;
  playerName?: string;
  score:      number;
  maxCombo:   number;
  accuracy:   number;
  rank:       string;
};

// POST /api/scores — soumission d'un score
scoresRouter.post('/', async (req: Request, res: Response) => {
  const body = req.body as Partial<ScoreBody>;

  if (!body.chartId || !body.songId || body.score == null) {
    res.status(400).json({ error: 'chartId, songId et score sont requis' });
    return;
  }

  // Si pseudo vide → génère "Anonyme #XXXX"
  const playerName =
    body.playerName?.trim() ||
    `Anonyme #${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    const [inserted] = await db
      .insert(scores)
      .values({
        chartId:    body.chartId,
        songId:     body.songId,
        playerName,
        score:      body.score,
        maxCombo:   body.maxCombo   ?? 0,
        accuracy:   body.accuracy   ?? 0,
        rank:       body.rank       ?? 'D',
      })
      .returning();

    res.status(201).json(inserted);
  } catch (err) {
    console.error('[POST /api/scores]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
