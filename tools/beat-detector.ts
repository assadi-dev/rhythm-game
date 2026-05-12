/**
 * beat-detector.ts — Génère un chart JSON depuis un fichier MP3
 *
 * Usage:
 *   npx tsx beat-detector.ts <input.mp3> [options]
 *
 * Options:
 *   --output <path>       Chemin du JSON de sortie (défaut: même dossier que l'entrée)
 *   --bpm <N>            Force le BPM (défaut: lu dans les tags ID3, sinon 120)
 *   --difficulty <level>  EASY | NORMAL | HARD (défaut: NORMAL)
 *   --song-id <id>       ID du morceau dans la DB (défaut: nom de fichier sans extension)
 *   --seed <N>           Graine pour la génération reproductible (défaut: aléatoire)
 *
 * Exemples:
 *   npx tsx beat-detector.ts music/demo.mp3
 *   npx tsx beat-detector.ts music/demo.mp3 --bpm=128 --difficulty=HARD
 *   npx tsx beat-detector.ts music/demo.mp3 --output=../backend/src/db/charts/demo-hard.json
 */

import { parseFile } from 'music-metadata';
import * as fs   from 'node:fs';
import * as path from 'node:path';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

type Lane       = 0 | 1 | 2 | 3;
type Difficulty = 'EASY' | 'NORMAL' | 'HARD';

type NoteData = { lane: Lane; time: number };

type ChartOutput = {
  songId:     string;
  chartId:    string;
  title:      string;
  artist:     string;
  bpm:        number;
  difficulty: Difficulty;
  rating:     number;
  duration:   number;
  notes:      NoteData[];
};

// ──────────────────────────────────────────────
// RNG déterministe (LCG) — permet --seed reproductible
// ──────────────────────────────────────────────

function createRng(seed: number) {
  let s = seed >>> 0;
  return (): number => {
    s = Math.imul(s, 1664525) + 1013904223;
    return (s >>> 0) / 0x100000000;
  };
}

// ──────────────────────────────────────────────
// Génération du chart
// ──────────────────────────────────────────────

/**
 * Choix de la lane : évite la répétition et équilibre l'usage des 4 lanes.
 * Utilise une pondération inverse à l'usage + un bonus fort pour les lanes non adjacentes.
 */
function pickLane(rng: () => number, prevLane: Lane, usage: number[]): Lane {
  const weights = usage.map((u, i) => {
    if (i === prevLane) return 0.05;          // très peu de répétition directe
    const adjacent = Math.abs(i - prevLane) === 1;
    const base = 1 / (u + 1);
    return adjacent ? base * 0.6 : base;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < 4; i++) {
    r -= weights[i];
    if (r <= 0) return i as Lane;
  }
  return 0;
}

/**
 * Génère les notes du chart à partir du BPM et de la durée.
 *
 * Grilles supportées :
 *   EASY   : croches (1/2 du beat), densité ~55%
 *   NORMAL : croches + quelques doubles-croches, densité ~70%
 *   HARD   : doubles-croches (1/4 du beat), densité ~85%
 */
function generateNotes(
  bpm:        number,
  duration:   number,
  difficulty: Difficulty,
  rng:        () => number,
): NoteData[] {
  const beat = 60 / bpm;

  // Résolution de la grille
  const grid: Record<Difficulty, number> = {
    EASY:   beat,        // noire
    NORMAL: beat / 2,    // croche
    HARD:   beat / 2,    // croche (avec densité plus élevée)
  };
  const step = grid[difficulty];

  // Probabilité de note par position sur la grille
  const density: Record<Difficulty, { strong: number; weak: number }> = {
    EASY:   { strong: 0.72, weak: 0.00 },  // seulement les temps forts
    NORMAL: { strong: 0.85, weak: 0.40 },
    HARD:   { strong: 0.95, weak: 0.70 },
  };
  const d = density[difficulty];

  // Intro : on laisse ~1.5–2 secondes avant la première note
  const introBeats = Math.max(2, Math.ceil(1.5 / beat));
  const startTime  = introBeats * beat;

  const notes: NoteData[]  = [];
  const laneUsage: number[] = [0, 0, 0, 0];
  let prevLane: Lane = 0;
  let t = startTime;

  while (t < duration - beat) {
    // Position par rapport à la mesure (noire = beat)
    const beatPhase = (t / beat) % 1; // 0 = temps fort, 0.5 = mi-temps
    const isStrong  = beatPhase < 0.05 || beatPhase > 0.95;
    const prob      = isStrong ? d.strong : d.weak;

    if (rng() < prob) {
      const lane = pickLane(rng, prevLane, laneUsage);
      notes.push({ lane, time: Math.round(t * 1000) / 1000 });
      laneUsage[lane]++;
      prevLane = lane;
    }

    t += step;
  }

  return notes;
}

// ──────────────────────────────────────────────
// Parsing des arguments CLI
// ──────────────────────────────────────────────

function parseArgs(argv: string[]) {
  const args = argv.slice(2);

  if (args.length === 0 || args[0].startsWith('--')) {
    console.error('Usage: npx tsx beat-detector.ts <input.mp3> [options]');
    console.error('');
    console.error('Options:');
    console.error('  --output <path>       Fichier JSON de sortie');
    console.error('  --bpm <N>            Force le BPM');
    console.error('  --difficulty <level>  EASY | NORMAL | HARD (défaut: NORMAL)');
    console.error('  --song-id <id>       ID du morceau');
    console.error('  --seed <N>           Graine aléatoire pour reproduction');
    process.exit(1);
  }

  const inputPath = args[0];

  const flag = (name: string): string | undefined => {
    const idx = args.findIndex(a => a === name || a === `--${name}`);
    if (idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith('--')) {
      return args[idx + 1];
    }
    const match = args.find(a => a.startsWith(`--${name}=`));
    return match ? match.split('=').slice(1).join('=') : undefined;
  };

  const rawDiff = (flag('difficulty') ?? 'NORMAL').toUpperCase();
  const difficulty: Difficulty =
    rawDiff === 'EASY' || rawDiff === 'HARD' ? rawDiff : 'NORMAL';

  const bpmOverride = flag('bpm') ? parseInt(flag('bpm')!, 10) : null;
  const seedOverride = flag('seed') ? parseInt(flag('seed')!, 10) : null;
  const songIdOverride = flag('song-id') ?? null;

  const stem = path.basename(inputPath, path.extname(inputPath));
  const defaultOutput = path.join(
    path.dirname(inputPath),
    `${stem}-${difficulty.toLowerCase()}.json`,
  );
  const outputPath = flag('output') ?? defaultOutput;

  return { inputPath, outputPath, bpmOverride, difficulty, seedOverride, songIdOverride };
}

// ──────────────────────────────────────────────
// Point d'entrée
// ──────────────────────────────────────────────

async function main() {
  const { inputPath, outputPath, bpmOverride, difficulty, seedOverride, songIdOverride } =
    parseArgs(process.argv);

  if (!fs.existsSync(inputPath)) {
    console.error(`Fichier introuvable : ${inputPath}`);
    process.exit(1);
  }

  console.log(`\n🎵 Neon Tempo — Beat Detector`);
  console.log(`   Input      : ${inputPath}`);
  console.log(`   Difficulty : ${difficulty}`);

  // ── Lecture des métadonnées ID3 ──
  const meta = await parseFile(inputPath, { duration: true });
  const { common, format } = meta;

  const bpmFromTags = common.bpm ? Math.round(common.bpm) : null;
  const bpm         = bpmOverride ?? bpmFromTags ?? 120;
  const duration    = format.duration ?? 180;
  const title       = common.title   ?? path.basename(inputPath, path.extname(inputPath));
  const artist      = common.artist  ?? 'Unknown Artist';
  const stem        = path.basename(inputPath, path.extname(inputPath))
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-+|-+$/g, '');
  const songId      = songIdOverride ?? stem;
  const chartId     = `${songId}-${difficulty.toLowerCase()}`;
  const rating      = { EASY: 3, NORMAL: 5, HARD: 8 }[difficulty];

  const bpmSource = bpmOverride ? 'forcé'
                  : bpmFromTags ? 'tags ID3'
                  : 'défaut';

  console.log(`   Title      : ${title}`);
  console.log(`   Artist     : ${artist}`);
  console.log(`   BPM        : ${bpm} (${bpmSource})`);
  console.log(`   Duration   : ${duration.toFixed(1)}s`);

  // ── Génération des notes ──
  const seed = seedOverride ?? Math.floor(Math.random() * 0xffffffff);
  const rng  = createRng(seed);
  const notes = generateNotes(bpm, duration, difficulty, rng);

  console.log(`   Seed       : ${seed}`);
  console.log(`   Notes      : ${notes.length}`);
  console.log(`   Chart ID   : ${chartId}`);

  const chart: ChartOutput = {
    songId, chartId, title, artist, bpm, difficulty, rating,
    duration: Math.round(duration),
    notes,
  };

  // ── Écriture du fichier ──
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(chart, null, 2), 'utf-8');

  console.log(`\n✅ Chart généré → ${outputPath}`);
  console.log(`   Pour l'insérer en DB :`);
  console.log(`   → copier dans backend/assets/charts/ et relancer le seed`);
  console.log(`   → ou utiliser l'API POST /api/charts (étape 7)\n`);
}

main().catch((err: unknown) => {
  console.error('Erreur :', err);
  process.exit(1);
});
