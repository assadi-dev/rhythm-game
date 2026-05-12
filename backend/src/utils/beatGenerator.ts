export type Difficulty = 'EASY' | 'NORMAL' | 'HARD';
export type NoteRow    = { lane: number; time: number };

// Lanes actives par difficulté (cohérent avec le frontend)
export const ACTIVE_LANES: Record<Difficulty, readonly number[]> = {
  EASY:   [0, 3],       // 2 lanes : ← →
  NORMAL: [0, 1, 3],    // 3 lanes : ← ↓ →
  HARD:   [0, 1, 2, 3], // 4 lanes : ← ↓ ↑ →
};

function createRng(seed: number) {
  let s = seed >>> 0;
  return (): number => {
    s = Math.imul(s, 1664525) + 1013904223;
    return (s >>> 0) / 0x100000000;
  };
}

function pickActiveIdx(
  rng:         () => number,
  prevIdx:     number,
  usage:       number[],
  activeLanes: readonly number[],
): number {
  const w = usage.map((u, i) => {
    if (i === prevIdx) return 0.05;
    const base = 1 / (u + 1);
    return Math.abs(i - prevIdx) === 1 ? base * 0.6 : base;
  });
  const total = w.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < activeLanes.length; i++) {
    r -= w[i];
    if (r <= 0) return i;
  }
  return 0;
}

export function generateNotes(
  bpm:        number,
  duration:   number,
  difficulty: Difficulty,
  seed?:      number,
): NoteRow[] {
  const activeLanes = ACTIVE_LANES[difficulty];
  const beat  = 60 / bpm;
  const step  = difficulty === 'EASY' ? beat : beat / 2;
  const density: Record<Difficulty, { strong: number; weak: number }> = {
    EASY:   { strong: 0.70, weak: 0.00 },
    NORMAL: { strong: 0.82, weak: 0.38 },
    HARD:   { strong: 0.93, weak: 0.65 },
  };
  const d = density[difficulty];

  const startTime = Math.ceil(2 / step) * step;
  const rng       = createRng(seed ?? Math.floor(Math.random() * 0xffffffff));
  const notes: NoteRow[] = [];
  const usage = activeLanes.map(() => 0);
  let prevIdx = 0;
  let t = startTime;

  while (t < duration - beat) {
    const beatPhase = (t / beat) % 1;
    const isStrong  = beatPhase < 0.05 || beatPhase > 0.95;
    if (rng() < (isStrong ? d.strong : d.weak)) {
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

export const DIFFICULTY_RATING: Record<Difficulty, number> = {
  EASY: 3, NORMAL: 5, HARD: 8,
};
