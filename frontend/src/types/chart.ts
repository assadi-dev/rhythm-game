export type NoteData = {
  lane: 0 | 1 | 2 | 3;
  time: number; // secondes depuis le début du morceau
};

export type ChartData = {
  songId: string;
  title: string;
  bpm: number;
  notes: NoteData[];
};
