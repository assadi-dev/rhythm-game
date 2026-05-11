import type { SongInfo } from '@/types/song';

// Données statiques jusqu'à l'étape 5 (backend + DB)
export const MOCK_SONGS: SongInfo[] = [
  {
    id: 'demo',
    title: 'DEMO TRACK',
    artist: 'SYSTEM NEON',
    bpm: 120,
    duration: 18,
    difficulties: [{ id: 'demo-normal', level: 'NORMAL', rating: 4 }],
    available: true,
  },
  {
    id: 'locked-1',
    title: '▓▓▓▓▓▓ ▓▓▓▓▓▓',
    artist: '▓▓▓▓▓',
    bpm: 145,
    duration: 195,
    difficulties: [
      { id: 'l1-easy', level: 'EASY', rating: 3 },
      { id: 'l1-hard', level: 'HARD', rating: 7 },
    ],
    available: false,
  },
  {
    id: 'locked-2',
    title: '▓▓▓▓ ▓▓▓▓▓',
    artist: '▓▓▓▓▓▓▓▓',
    bpm: 172,
    duration: 212,
    difficulties: [
      { id: 'l2-normal', level: 'NORMAL', rating: 6 },
      { id: 'l2-hard', level: 'HARD', rating: 9 },
    ],
    available: false,
  },
];

// Stub API — sera remplacé par un vrai fetch en étape 5
export async function fetchSongs(): Promise<SongInfo[]> {
  try {
    const res = await fetch('/api/songs');
    if (!res.ok) throw new Error('api unavailable');
    return (await res.json()) as SongInfo[];
  } catch {
    return MOCK_SONGS;
  }
}
