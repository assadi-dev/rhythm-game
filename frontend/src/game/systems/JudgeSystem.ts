export type Judgment = 'COOL' | 'FINE' | 'SAFE' | 'SAD' | 'MISS';

const WINDOWS: Array<[Judgment, number]> = [
  ['COOL', 33],
  ['FINE', 66],
  ['SAFE', 100],
  ['SAD',  133],
];

// deltaMs = (targetTime - currentTime) * 1000 — peut être négatif (en avance / en retard)
export function judge(deltaMs: number): Judgment {
  const abs = Math.abs(deltaMs);
  for (const [j, maxMs] of WINDOWS) {
    if (abs <= maxMs) return j;
  }
  return 'MISS';
}

export const JUDGMENT_COLORS: Record<Judgment, string> = {
  COOL: '#01cdfe',
  FINE: '#fffb96',
  SAFE: '#b967ff',
  SAD:  '#ff71ce',
  MISS: '#ff4444',
};
