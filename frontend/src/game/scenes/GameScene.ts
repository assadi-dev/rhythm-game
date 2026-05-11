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

// Chart de démo : 32 notes à BPM 120, départ à t=1.5s
function makeDemoChart(): NoteData[] {
  const beat = 60 / 120;
  const pattern: Array<0 | 1 | 2 | 3> = [
    0, 2, 1, 3,  0, 1, 2, 3,  0, 3, 1, 2,  0, 2, 3, 1,
    0, 1, 2, 3,  2, 0, 3, 1,  0, 2, 1, 3,  1, 0, 3, 2,
  ];
  return pattern.map((lane, i) => ({ lane, time: 1.5 + i * beat }));
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
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private judgeText!: Phaser.GameObjects.Text;

  constructor(chartId = 'demo-normal') {
    super({ key: 'GameScene' });
    this.chartId = chartId;
  }

  preload(): void {
    // Charge depuis l'API backend — fallback sur le fichier statique si hors-ligne
    this.load.json('chart', `/api/charts/${this.chartId}`);
  }

  setAudio(audio: AudioEngine): void {
    this._audio = audio;
  }

  // GameCanvas appelle audio.play() ou audio.markStart() AVANT d'appeler start()
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

    const raw = this.cache.json.get('chart') as { notes?: NoteData[] } | null;
    this.originalNotes = raw?.notes ?? makeDemoChart();
    this.pending = this.originalNotes.map(n => ({ ...n }));
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
    this.add
      .text(16, 16, 'NEON TEMPO', {
        fontFamily: '"VT323"',
        fontSize: '28px',
        color: '#ff71ce',
      })
      .setAlpha(0.4)
      .setDepth(10);

    this.scoreText = this.add
      .text(width - 16, 16, '00000000', {
        fontFamily: '"VT323"',
        fontSize: '36px',
        color: '#fff8fc',
      })
      .setOrigin(1, 0)
      .setDepth(10);

    this.comboText = this.add
      .text(width / 2, this.judgmentY - 90, '', {
        fontFamily: '"VT323"',
        fontSize: '60px',
        color: '#fffb96',
      })
      .setOrigin(0.5, 1)
      .setDepth(10);

    this.judgeText = this.add
      .text(width / 2, this.judgmentY - 35, '', {
        fontFamily: '"VT323"',
        fontSize: '44px',
        color: '#01cdfe',
      })
      .setOrigin(0.5, 1)
      .setAlpha(0)
      .setDepth(10);
  }

  private setupInput(): void {
    const kb = this.input.keyboard!;
    kb.on('keydown-D', () => { this.handleInput(0); });
    kb.on('keydown-F', () => { this.handleInput(1); });
    kb.on('keydown-J', () => { this.handleInput(2); });
    kb.on('keydown-K', () => { this.handleInput(3); });

    // Zones tactiles — divise l'écran en 4 bandes verticales
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const lane = Math.min(3, Math.floor(p.x / (this.scale.width / LANE_COUNT))) as 0 | 1 | 2 | 3;
      this.handleInput(lane);
    });
  }

  private handleInput(lane: 0 | 1 | 2 | 3): void {
    if (!this.started || this.ended) return;
    const t = this._audio.currentTime;

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
      this.removeNote(best);
    }
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
      alpha: 0,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Power2',
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

    // Spawn les notes qui entrent dans la fenêtre visible
    while (this.pending.length > 0 && this.pending[0].time <= t + approachTime) {
      const nd = this.pending.shift()!;
      const note = new Note(this, this.laneX[nd.lane], nd.lane, nd.time, LANE_COLORS[nd.lane]);
      this.notes.push(note);
    }

    // Mise à jour position + auto-miss
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
    this.comboText.setText(this.scoring.combo >= 2 ? `${this.scoring.combo}×` : '');

    // Fin de partie : plus aucune note en attente ni à l'écran
    if (this.pending.length === 0 && this.notes.length === 0) {
      this.endGame();
    }
  }

  private endGame(): void {
    this.ended = true;
    const data: GameCompleteData = {
      score: this.scoring.score,
      maxCombo: this.scoring.maxCombo,
      accuracy: this.scoring.accuracy,
      rank: this.scoring.rank,
    };
    this.game.events.emit('game-complete', data);
  }
}
