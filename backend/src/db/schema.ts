import {
  pgTable, varchar, integer, real, timestamp, uuid, jsonb,
} from 'drizzle-orm/pg-core';

export type NoteRow = { lane: number; time: number };

export const songs = pgTable('songs', {
  id:        varchar('id',     { length: 64  }).primaryKey(),
  title:     varchar('title',  { length: 255 }).notNull(),
  artist:    varchar('artist', { length: 255 }).notNull(),
  bpm:       integer('bpm').notNull(),
  duration:  integer('duration').notNull(), // secondes
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const charts = pgTable('charts', {
  id:     varchar('id',      { length: 64 }).primaryKey(), // e.g. "demo-normal"
  songId: varchar('song_id', { length: 64 }).notNull().references(() => songs.id, { onDelete: 'cascade' }),
  level:  varchar('level',   { length: 16 }).notNull(), // EASY | NORMAL | HARD
  rating: integer('rating').notNull(),                  // 1–10
  notes:  jsonb('notes').$type<NoteRow[]>().notNull(),
});

export const scores = pgTable('scores', {
  id:         uuid('id').defaultRandom().primaryKey(),
  chartId:    varchar('chart_id', { length: 64 }).notNull().references(() => charts.id),
  songId:     varchar('song_id',  { length: 64 }).notNull().references(() => songs.id),
  playerName: varchar('player_name', { length: 64 }).notNull().default('Anonyme'),
  score:      integer('score').notNull(),
  maxCombo:   integer('max_combo').notNull(),
  accuracy:   real('accuracy').notNull(), // 0–100
  rank:       varchar('rank', { length: 4 }).notNull(),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
});

export type Song  = typeof songs.$inferSelect;
export type Chart = typeof charts.$inferSelect;
export type Score = typeof scores.$inferSelect;
