export type Judgment = 'COOL' | 'FINE' | 'SAFE' | 'SAD' | 'MISS';

// Fenêtres élargies pour les joueurs casual (~+80% vs valeurs compétitives)
// COOL ±50 ms  |  FINE ±100 ms  |  SAFE ±150 ms  |  SAD ±250 ms
const WINDOWS: Array<[Judgment, number]> = [
  ['COOL', 50],
  ['FINE', 100],
  ['SAFE', 150],
  ['SAD',  250],
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
