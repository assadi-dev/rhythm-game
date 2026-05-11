import { Router, type Request, type Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { charts } from '../db/schema.js';

export const chartsRouter = Router();

// GET /api/charts/:id — notes du chart (utilisé par Phaser pour charger le chart)
chartsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const [chart] = await db
      .select()
      .from(charts)
      .where(eq(charts.id, String(req.params.id)));

    if (!chart) {
      res.status(404).json({ error: 'Chart not found' });
      return;
    }

    res.json({
      songId: chart.songId,
      chartId: chart.id,
      level: chart.level,
      rating: chart.rating,
      notes: chart.notes,
    });
  } catch (err) {
    console.error('[GET /api/charts/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
