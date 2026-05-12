export type Difficulty = 'EASY' | 'NORMAL' | 'HARD';
export type NoteData   = { lane: 0 | 1 | 2 | 3; time: number };

// Lanes actives par difficulté (mappées aux touches fléchées)
// EASY   : ←  →       (2 touches, les plus éloignées = plus simple)
// NORMAL : ← ↓  →     (3 touches)
// HARD   : ← ↓ ↑ →    (4 touches, toutes actives)
export const ACTIVE_LANES: Record<Difficulty, readonly (0 | 1 | 2 | 3)[]> = {
  EASY:   [0, 3],
  NORMAL: [0, 1, 3],
  HARD:   [0, 1, 2, 3],
};

// LCG déterministe — même seed = même chart
function createRng(seed: number) {
  let s = seed >>> 0;
  return (): number => {
    s = Math.imul(s, 1664525) + 1013904223;
    return (s >>> 0) / 0x100000000;
  };
}

// Choisit un index dans activeLanes en évitant répétitions et surcharge d'une lane
function pickActiveIdx(
  rng:         () => number,
  prevIdx:     number,
  usage:       number[],
  activeLanes: readonly (0 | 1 | 2 | 3)[],
): number {
  const w = usage.map((u, i) => {
    if (i === prevIdx) return 0.05;
    const adjacent = Math.abs(i - prevIdx) === 1;
    const base = 1 / (u + 1);
    return adjacent ? base * 0.6 : base;
  });
  const total = w.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < activeLanes.length; i++) {
    r -= w[i];
    if (r <= 0) return i;
  }
  return 0;
}

// Graine déterministe dérivée du chartId
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
  const activeLanes = ACTIVE_LANES[difficulty];
  const beat  = 60 / bpm;
  const step  = difficulty === 'EASY' ? beat : beat / 2;
  const density = {
    EASY:   { strong: 0.70, weak: 0.00 },
    NORMAL: { strong: 0.82, weak: 0.38 },
    HARD:   { strong: 0.93, weak: 0.65 },
  }[difficulty];

  const startTime = Math.ceil(2 / step) * step;
  const rng       = createRng(seed);
  const notes: NoteData[] = [];
  const usage = activeLanes.map(() => 0);
  let prevIdx = 0;
  let t = startTime;

  while (t < duration - beat) {
    const phase    = (t / beat) % 1;
    const isStrong = phase < 0.05 || phase > 0.95;
    if (rng() < (isStrong ? density.strong : density.weak)) {
      const idx  = pickActiveIdx(rng, prevIdx, usage, activeLanes);
      const lane = activeLanes[idx];
      notes.push({ lane, time: Math.round(t * 1000) / 1000 });
      usage[idx]++;
      prevIdx = idx;
    }
    t += step;
  }
  return notes;
}
