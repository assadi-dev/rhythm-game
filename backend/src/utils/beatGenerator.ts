export type Difficulty = 'EASY' | 'NORMAL' | 'HARD';
export type NoteRow    = { lane: number; time: number };

// LCG déterministe — permet seed reproductible
function createRng(seed: number) {
  let s = seed >>> 0;
  return (): number => {
    s = Math.imul(s, 1664525) + 1013904223;
    return (s >>> 0) / 0x100000000;
  };
}

function pickLane(rng: () => number, prevLane: number, usage: number[]): number {
  const weights = usage.map((u, i) => {
    if (i === prevLane) return 0.05;
    const base = 1 / (u + 1);
    return Math.abs(i - prevLane) === 1 ? base * 0.6 : base;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < 4; i++) {
    r -= weights[i];
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
  const beat = 60 / bpm;

  // Résolution de la grille (noire pour EASY, croche pour NORMAL/HARD)
  const step = difficulty === 'EASY' ? beat : beat / 2;

  const density: Record<Difficulty, { strong: number; weak: number }> = {
    EASY:   { strong: 0.70, weak: 0.00 },
    NORMAL: { strong: 0.82, weak: 0.38 },
    HARD:   { strong: 0.93, weak: 0.65 },
  };
  const d = density[difficulty];

  // Intro : ~2 secondes avant la première note
  const startTime = Math.ceil(2 / step) * step;
  const rng       = createRng(seed ?? Math.floor(Math.random() * 0xffffffff));
  const notes: NoteRow[]  = [];
  const laneUsage: number[] = [0, 0, 0, 0];
  let prevLane = 0;
  let t = startTime;

  while (t < duration - beat) {
    const beatPhase = (t / beat) % 1;
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

export const DIFFICULTY_RATING: Record<Difficulty, number> = {
  EASY: 3, NORMAL: 5, HARD: 8,
};
