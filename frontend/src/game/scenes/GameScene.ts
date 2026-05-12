import Phaser from 'phaser';
import { Note } from '../entities/Note';
import { judge, JUDGMENT_COLORS, type Judgment } from '../systems/JudgeSystem';
import { ScoreSystem } from '../systems/ScoreSystem';
import type { AudioEngine } from '../AudioEngine';
import type { NoteData } from '../../types/chart';
import {
  LANE_COUNT, NOTE_SPEED, JUDGMENT_Y_RATIO,
  C_BG, C_CYAN, C_WHITE, LANE_COLORS, KEY_LABELS,
} from '../constants';

export type GameCompleteData = {
  score: number;
  maxCombo: number;
  accuracy: number;
  rank: string;
};

// Chart de démo : fallback si l'API est hors-ligne
function makeDemoChart(): NoteData[] {
  const beat = 60 / 120;
  const pattern: Array<0 | 1 | 2 | 3> = [
    0, 2, 1, 3,  0, 1, 2, 3,  0, 3, 1, 2,  0, 2, 3, 1,
    0, 1, 2, 3,  2, 0, 3, 1,  0, 2, 1, 3,  1, 0, 3, 2,
  ];
  return pattern.map((lane, i) => ({ lane, time: 1.5 + i * beat }));
}

// Couleur de combo selon le multiplicateur
function comboColor(multiplier: number): string {
  if (multiplier >= 2.5) return '#01cdfe'; // ×2.5 — cyan
  if (multiplier >= 2.0) return '#ff71ce'; // ×2.0 — pink
  if (multiplier >= 1.5) return '#b967ff'; // ×1.5 — purple
  if (multiplier >= 1.1) return '#fffb96'; // ×1.1 — yellow
  return '#fff8fc';
}

export class GameScene extends Phaser.Scene {
  private readonly chartId: string;
  private _audio!: AudioEngine;
  private notes: Note[] = [];
  private pending: NoteData[] = [];
  private originalNotes: NoteData[] = [];
  private scoring!: ScoreSystem;
  private judgmentY = 0;
  private laneX: number[] = [];
  private started = false;
  private ended = false;

  // HUD
  private scoreText!:      Phaser.GameObjects.Text;
  private comboText!:      Phaser.GameObjects.Text;
  private judgeText!:      Phaser.GameObjects.Text;
  private multiplierText!: Phaser.GameObjects.Text;

  constructor(chartId = 'demo-normal') {
    super({ key: 'GameScene' });
    this.chartId = chartId;
  }

  preload(): void {
    this.load.json('chart', `/api/charts/${this.chartId}`);
  }

  setAudio(audio: AudioEngine): void {
    this._audio = audio;
  }

  start(): void {
    this.started = true;
  }

  reset(): void {
    this.notes.forEach(n => n.destroy());
    this.notes = [];
    this.pending = this.originalNotes.map(n => ({ ...n }));
    this.scoring = new ScoreSystem();
    this.started = false;
    this.ended = false;
    this.scoreText.setText('00000000');
    this.comboText.setText('');
    this.judgeText.setAlpha(0);
    this.multiplierText.setText('');
  }

  create(): void {
    const { width, height } = this.scale;
    this.judgmentY = height * JUDGMENT_Y_RATIO;
    this.scoring = new ScoreSystem();

    this.add.rectangle(width / 2, height / 2, width, height, C_BG);
    this.drawLanes(width, height);
    this.drawJudgmentLine(width);
    this.drawKeyLabels(height);
    this.createHUD(width);
    this.setupInput();

    const raw = this.cache.json.get('chart') as {
      notes?: NoteData[]; title?: string; bpm?: number;
    } | null;
    this.originalNotes = raw?.notes ?? makeDemoChart();
    this.pending = this.originalNotes.map(n => ({ ...n }));

    // Titre + BPM dans le coin supérieur gauche
    const title  = raw?.title ?? 'DEMO TRACK';
    const bpm    = raw?.bpm   ?? 120;
    this.add
      .text(16, 16, `${title}`, {
        fontFamily: '"VT323"', fontSize: '26px', color: '#ff71ce',
      })
      .setAlpha(0.5)
      .setDepth(10);
    this.add
      .text(16, 44, `${bpm} BPM`, {
        fontFamily: '"Space Mono"', fontSize: '11px', color: '#01cdfe',
      })
      .setAlpha(0.4)
      .setDepth(10);
  }

  private drawLanes(width: number, height: number): void {
    const laneW = width / LANE_COUNT;
    for (let i = 0; i < LANE_COUNT; i++) {
      const cx = laneW * i + laneW / 2;
      this.laneX.push(cx);
      this.add.rectangle(cx, height / 2, laneW - 2, height, LANE_COLORS[i], 0.05).setDepth(0);
      if (i > 0) {
        this.add.rectangle(laneW * i, height / 2, 1, height, C_WHITE, 0.12).setDepth(0);
      }
    }
  }

  private drawJudgmentLine(width: number): void {
    this.add.rectangle(width / 2, this.judgmentY, width, 3, C_CYAN, 0.9).setDepth(1);
    this.add.rectangle(width / 2, this.judgmentY, width, 16, C_CYAN, 0.1).setDepth(1);
  }

  private drawKeyLabels(height: number): void {
    for (let i = 0; i < LANE_COUNT; i++) {
      this.add
        .text(this.laneX[i], height * 0.93, KEY_LABELS[i], {
          fontFamily: '"VT323"',
          fontSize: '32px',
          color: '#' + LANE_COLORS[i].toString(16).padStart(6, '0'),
        })
        .setOrigin(0.5, 0.5)
        .setAlpha(0.7)
        .setDepth(2);
    }
  }

  private createHUD(width: number): void {
    // Score — coin supérieur droit
    this.scoreText = this.add
      .text(width - 16, 16, '00000000', {
        fontFamily: '"VT323"', fontSize: '36px', color: '#fff8fc',
      })
      .setOrigin(1, 0)
      .setDepth(10);

    // Multiplicateur — sous le score
    this.multiplierText = this.add
      .text(width - 16, 56, '', {
        fontFamily: '"VT323"', fontSize: '22px', color: '#fffb96',
      })
      .setOrigin(1, 0)
      .setAlpha(0.8)
      .setDepth(10);

    // Combo — centré au-dessus de la ligne de jugement
    this.comboText = this.add
      .text(width / 2, this.judgmentY - 90, '', {
        fontFamily: '"VT323"', fontSize: '60px', color: '#fff8fc',
      })
      .setOrigin(0.5, 1)
      .setDepth(10);

    // Jugement — centré entre combo et ligne
    this.judgeText = this.add
      .text(width / 2, this.judgmentY - 35, '', {
        fontFamily: '"VT323"', fontSize: '44px', color: '#01cdfe',
      })
      .setOrigin(0.5, 1)
      .setAlpha(0)
      .setDepth(10);

    // Hint ESC
    this.add
      .text(width / 2, 12, 'ESC — QUITTER', {
        fontFamily: '"Space Mono"', fontSize: '9px', color: '#fff8fc',
      })
      .setOrigin(0.5, 0)
      .setAlpha(0.15)
      .setDepth(10);
  }

  private setupInput(): void {
    const kb = this.input.keyboard!;
    kb.on('keydown-D',   () => { this.handleInput(0); });
    kb.on('keydown-F',   () => { this.handleInput(1); });
    kb.on('keydown-J',   () => { this.handleInput(2); });
    kb.on('keydown-K',   () => { this.handleInput(3); });
    kb.on('keydown-ESC', () => { this.game.events.emit('game-exit'); });

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const lane = Math.min(3, Math.floor(p.x / (this.scale.width / LANE_COUNT))) as 0 | 1 | 2 | 3;
      this.handleInput(lane);
    });
  }

  private handleInput(lane: 0 | 1 | 2 | 3): void {
    if (!this.started || this.ended) return;
    const t = this._audio.currentTime;

    // Flash de lane systématique (feedback sur toute touche)
    this.flashLane(lane);

    let best: Note | null = null;
    let bestDelta = Infinity;
    for (const note of this.notes) {
      if (note.lane !== lane) continue;
      const delta = Math.abs(note.targetTime - t);
      if (delta <= 0.133 && delta < bestDelta) {
        best = note;
        bestDelta = delta;
      }
    }

    if (best) {
      const deltaMs = (best.targetTime - t) * 1000;
      const j = judge(deltaMs);
      this.scoring.record(j);
      this.flashJudgment(j);
      this.createHitEffect(lane, LANE_COLORS[lane]);
      this.removeNote(best);
    }
  }

  // Éclair de lane : rectangle translucide qui disparaît vite
  private flashLane(lane: 0 | 1 | 2 | 3): void {
    const laneW = this.scale.width / LANE_COUNT;
    const rect  = this.add
      .rectangle(this.laneX[lane], this.scale.height / 2, laneW - 2, this.scale.height, LANE_COLORS[lane], 0.18)
      .setDepth(4);
    this.tweens.add({
      targets: rect, alpha: 0, duration: 140, ease: 'Power2',
      onComplete: () => rect.destroy(),
    });
  }

  // Anneau qui s'élargit sur la ligne de jugement
  private createHitEffect(lane: 0 | 1 | 2 | 3, color: number): void {
    const ring = this.add
      .arc(this.laneX[lane], this.judgmentY, 16, 0, 360, false, color, 0.75)
      .setDepth(5);
    this.tweens.add({
      targets: ring, scaleX: 4, scaleY: 4, alpha: 0, duration: 320, ease: 'Power2',
      onComplete: () => ring.destroy(),
    });
    // Flash horizontal court
    const bar = this.add
      .rectangle(this.laneX[lane], this.judgmentY, 76, 6, color, 0.7)
      .setDepth(5);
    this.tweens.add({
      targets: bar, alpha: 0, scaleX: 2, duration: 180, ease: 'Power2',
      onComplete: () => bar.destroy(),
    });
  }

  private flashJudgment(j: Judgment): void {
    this.tweens.killTweensOf(this.judgeText);
    this.judgeText
      .setText(j)
      .setColor(JUDGMENT_COLORS[j])
      .setAlpha(1)
      .setScale(1.25);
    this.tweens.add({
      targets: this.judgeText,
      alpha: 0, scaleX: 1, scaleY: 1,
      duration: 500, ease: 'Power2',
    });
  }

  private removeNote(note: Note): void {
    const i = this.notes.indexOf(note);
    if (i !== -1) this.notes.splice(i, 1);
    note.destroy();
  }

  update(): void {
    if (!this.started || this.ended) return;

    const t = this._audio.currentTime;
    const approachTime = this.judgmentY / NOTE_SPEED;

    while (this.pending.length > 0 && this.pending[0].time <= t + approachTime) {
      const nd   = this.pending.shift()!;
      const note = new Note(this, this.laneX[nd.lane], nd.lane, nd.time, LANE_COLORS[nd.lane]);
      this.notes.push(note);
    }

    for (let i = this.notes.length - 1; i >= 0; i--) {
      const note = this.notes[i];
      note.setY(this.judgmentY - (note.targetTime - t) * NOTE_SPEED);

      if (t - note.targetTime > 0.133) {
        this.scoring.record('MISS');
        this.flashJudgment('MISS');
        this.notes.splice(i, 1);
        note.destroy();
      }
    }

    // HUD
    this.scoreText.setText(this.scoring.score.toString().padStart(8, '0'));

    const combo = this.scoring.combo;
    const mult  = this.scoring.multiplier;
    this.comboText
      .setText(combo >= 2 ? `${combo}×` : '')
      .setColor(comboColor(mult));

    this.multiplierText.setText(mult > 1 ? `×${mult.toFixed(1)} BONUS` : '');

    if (this.pending.length === 0 && this.notes.length === 0) {
      this.endGame();
    }
  }

  private endGame(): void {
    this.ended = true;
    this.game.events.emit('game-complete', {
      score:    this.scoring.score,
      maxCombo: this.scoring.maxCombo,
      accuracy: this.scoring.accuracy,
      rank:     this.scoring.rank,
    } satisfies GameCompleteData);
  }
}
