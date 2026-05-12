// Génération de notes rythmiques — même algorithme que tools/beat-detector.ts
// Utilisé pour remplir dynamiquement un chart sur toute la durée audio réelle.

export type Difficulty = 'EASY' | 'NORMAL' | 'HARD';
export type NoteData   = { lane: 0 | 1 | 2 | 3; time: number };

// LCG déterministe — même seed = même chart (cohérence entre tentatives)
function createRng(seed: number) {
  let s = seed >>> 0;
  return (): number => {
    s = Math.imul(s, 1664525) + 1013904223;
    return (s >>> 0) / 0x100000000;
  };
}

function pickLane(rng: () => number, prev: number, usage: number[]): 0 | 1 | 2 | 3 {
  const w = usage.map((u, i) => {
    if (i === prev) return 0.05;
    const b = 1 / (u + 1);
    return Math.abs(i - prev) === 1 ? b * 0.6 : b;
  });
  const total = w.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < 4; i++) { r -= w[i]; if (r <= 0) return i as 0|1|2|3; }
  return 0;
}

// Graine déterministe dérivée du chartId (même chanson = même chart)
export function chartSeed(chartId: string): number {
  let h = 5381;
  for (const c of chartId) h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0;
  return h >>> 0;
}

export function generateNotes(
  bpm:        number,
  duration:   number,
  difficulty: Difficulty,
  seed:       number,
): NoteData[] {
  const beat = 60 / bpm;
  const step = difficulty === 'EASY' ? beat : beat / 2;
  const density = {
    EASY:   { strong: 0.70, weak: 0.00 },
    NORMAL: { strong: 0.82, weak: 0.38 },
    HARD:   { strong: 0.93, weak: 0.65 },
  }[difficulty];

  const startTime = Math.ceil(2 / step) * step; // ~2 s d'intro
  const rng       = createRng(seed);
  const notes: NoteData[] = [];
  const usage = [0, 0, 0, 0];
  let prev = 0;
  let t    = startTime;

  while (t < duration - beat) {
    const phase    = (t / beat) % 1;
    const isStrong = phase < 0.05 || phase > 0.95;
    if (rng() < (isStrong ? density.strong : density.weak)) {
      const lane = pickLane(rng, prev, usage);
      notes.push({ lane, time: Math.round(t * 1000) / 1000 });
      usage[lane]++;
      prev = lane;
    }
    t += step;
  }
  return notes;
}
