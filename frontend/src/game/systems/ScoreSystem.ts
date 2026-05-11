import type { Judgment } from './JudgeSystem';

const BASE_POINTS: Record<Judgment, number> = {
  COOL: 1000,
  FINE: 500,
  SAFE: 200,
  SAD:  50,
  MISS: 0,
};

// Contribution à l'accuracy par jugement (0.0 → 1.0)
const ACCURACY_WEIGHT: Record<Judgment, number> = {
  COOL: 1.00,
  FINE: 0.70,
  SAFE: 0.40,
  SAD:  0.20,
  MISS: 0.00,
};

export class ScoreSystem {
  private _score = 0;
  private _combo = 0;
  private _maxCombo = 0;
  private _totalNotes = 0;
  private _accuracySum = 0;

  record(judgment: Judgment): void {
    this._totalNotes++;
    this._accuracySum += ACCURACY_WEIGHT[judgment];
    this._score += Math.floor(BASE_POINTS[judgment] * this.multiplier);

    if (judgment === 'COOL' || judgment === 'FINE') {
      this._combo++;
      if (this._combo > this._maxCombo) this._maxCombo = this._combo;
    } else {
      this._combo = 0;
    }
  }

  get multiplier(): number {
    if (this._combo >= 200) return 2.5;
    if (this._combo >= 100) return 2.0;
    if (this._combo >= 50)  return 1.5;
    if (this._combo >= 10)  return 1.1;
    return 1.0;
  }

  get score(): number    { return this._score; }
  get combo(): number    { return this._combo; }
  get maxCombo(): number { return this._maxCombo; }

  get accuracy(): number {
    if (this._totalNotes === 0) return 100;
    return (this._accuracySum / this._totalNotes) * 100;
  }

  get rank(): string {
    const a = this.accuracy;
    if (a >= 95) return 'SS';
    if (a >= 90) return 'S';
    if (a >= 80) return 'A';
    if (a >= 70) return 'B';
    if (a >= 60) return 'C';
    return 'D';
  }
}
