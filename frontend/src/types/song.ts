export type Difficulty = 'EASY' | 'NORMAL' | 'HARD';

export type DifficultyInfo = {
  id: string;
  level: Difficulty;
  rating: number; // 1–10
};

export type SongInfo = {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  duration: number; // secondes
  difficulties: DifficultyInfo[];
  available: boolean;
};
