/**
 * Script de seed : insère le morceau de démo dans la base de données.
 * Usage : npx tsx src/db/seed.ts
 */
import 'dotenv/config';
import { db } from './index.js';
import { songs, charts } from './schema.js';

const DEMO_NOTES = [
  { lane: 0, time: 1.5 },  { lane: 2, time: 2.0 },
  { lane: 1, time: 2.5 },  { lane: 3, time: 3.0 },
  { lane: 0, time: 3.5 },  { lane: 1, time: 4.0 },
  { lane: 2, time: 4.5 },  { lane: 3, time: 5.0 },
  { lane: 0, time: 5.5 },  { lane: 3, time: 6.0 },
  { lane: 1, time: 6.5 },  { lane: 2, time: 7.0 },
  { lane: 0, time: 7.5 },  { lane: 2, time: 8.0 },
  { lane: 3, time: 8.5 },  { lane: 1, time: 9.0 },
  { lane: 0, time: 9.5 },  { lane: 1, time: 10.0 },
  { lane: 2, time: 10.5 }, { lane: 3, time: 11.0 },
  { lane: 2, time: 11.5 }, { lane: 0, time: 12.0 },
  { lane: 3, time: 12.5 }, { lane: 1, time: 13.0 },
  { lane: 0, time: 13.5 }, { lane: 2, time: 14.0 },
  { lane: 1, time: 14.5 }, { lane: 3, time: 15.0 },
  { lane: 1, time: 15.5 }, { lane: 0, time: 16.0 },
  { lane: 3, time: 16.5 }, { lane: 2, time: 17.0 },
];

async function seed() {
  console.log('Seeding database...');

  await db.insert(songs).values({
    id: 'demo',
    title: 'DEMO TRACK',
    artist: 'SYSTEM NEON',
    bpm: 120,
    duration: 18,
  }).onConflictDoNothing();

  await db.insert(charts).values({
    id: 'demo-normal',
    songId: 'demo',
    level: 'NORMAL',
    rating: 4,
    notes: DEMO_NOTES,
  }).onConflictDoNothing();

  console.log('Done! Demo song + chart inserted.');
  process.exit(0);
}

seed().catch((err: unknown) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
