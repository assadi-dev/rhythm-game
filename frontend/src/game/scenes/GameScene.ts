import Phaser from 'phaser';
import { Note } from '../entities/Note';
import { judge, JUDGMENT_COLORS, type Judgment } from '../systems/JudgeSystem';
import { ScoreSystem } from '../systems/ScoreSystem';
import type { AudioEngine } from '../AudioEngine';
import type { NoteData } from '../../types/chart';
import { getSettings, displayCode } from '../../store/settings';
import {
  LANE_COUNT, NOTE_SPEED, JUDGMENT_Y_RATIO,
  C_BG, C_CYAN, C_WHITE, LANE_COLORS,
} from '../constants';

export type GameCompleteData = {
  score: number;
  maxCombo: number;
  accuracy: number;
  rank: string;
};

function makeDemoChart(): NoteData[] {
  const pattern: Array<0 | 1 | 2 | 3> = [
    0, 2, 1, 3,  0, 1, 2, 3,  0, 3, 1, 2,  0, 2, 3, 1,  0, 1, 2, 3,
  ];
  return pattern.map((lane, i) => ({ lane, time: 2.0 + i * 1.0 }));
}

function comboColor(multiplier: number): string {
  if (multiplier >= 2.5) return '#01cdfe';
  if (multiplier >= 2.0) return '#ff71ce';
  if (multiplier >= 1.5) return '#b967ff';
  if (multiplier >= 1.1) return '#fffb96';
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
  private isPaused = false;
  private keyboardEnabled = true;

  // HUD
  private scoreText!:       Phaser.GameObjects.Text;
  private comboText!:       Phaser.GameObjects.Text;
  private judgeText!:       Phaser.GameObjects.Text;
  private multiplierText!:  Phaser.GameObjects.Text;
  private keyLabelTexts:    Phaser.GameObjects.Text[] = [];

  constructor(chartId = 'demo-normal') {
    super({ key: 'GameScene' });
    this.chartId = chartId;
  }

  preload(): void {
    this.load.json('chart', `/api/charts/${this.chartId}`);
  }

  // ── API publique (appelée depuis GameCanvas) ─────────────────────────────────

  setAudio(audio: AudioEngine): void { this._audio = audio; }

  start(): void { this.started = true; }

  pause(): void {
    if (!this.started || this.ended || this.isPaused) return;
    this.isPaused = true;
    this.scene.pause();
    this.game.events.emit('game-paused');
  }

  resume(): void {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.scene.resume();
    this.game.events.emit('game-resumed');
  }

  setKeyboardEnabled(enabled: boolean): void {
    this.keyboardEnabled = enabled;
  }

  refreshKeyLabels(): void {
    const { keys } = getSettings();
    const labels = [keys.lane0, keys.lane1, keys.lane2, keys.lane3].map(displayCode);
    this.keyLabelTexts.forEach((t, i) => t.setText(labels[i]!));
  }

  reset(): void {
    this.notes.forEach(n => n.destroy());
    this.notes = [];
    this.pending = this.originalNotes.map(n => ({ ...n }));
    this.scoring = new ScoreSystem();
    this.started = false;
    this.ended = false;
    this.isPaused = false;
    this.scoreText.setText('00000000');
    this.comboText.setText('');
    this.judgeText.setAlpha(0);
    this.multiplierText.setText('');
  }

  // ── Cycle de vie Phaser ──────────────────────────────────────────────────────

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

    const title = raw?.title ?? 'DEMO TRACK';
    const bpm   = raw?.bpm   ?? 120;
    this.add.text(16, 16, title, { fontFamily: '"VT323"', fontSize: '26px', color: '#ff71ce' })
      .setAlpha(0.5).setDepth(10);
    this.add.text(16, 44, `${bpm} BPM`, { fontFamily: '"Space Mono"', fontSize: '11px', color: '#01cdfe' })
      .setAlpha(0.4).setDepth(10);
  }

  update(): void {
    if (!this.started || this.ended || this.isPaused) return;

    const t = this._audio.currentTime;
    const approachTime = this.judgmentY / NOTE_SPEED;

    while (this.pending.length > 0 && this.pending[0].time <= t + approachTime) {
      const nd = this.pending.shift()!;
      this.notes.push(new Note(this, this.laneX[nd.lane], nd.lane, nd.time, LANE_COLORS[nd.lane]));
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

    this.scoreText.setText(this.scoring.score.toString().padStart(8, '0'));
    const mult = this.scoring.multiplier;
    this.comboText
      .setText(this.scoring.combo >= 2 ? `${this.scoring.combo}×` : '')
      .setColor(comboColor(mult));
    this.multiplierText.setText(mult > 1 ? `×${mult.toFixed(1)} BONUS` : '');

    if (this.pending.length === 0 && this.notes.length === 0) {
      this.endGame();
    }
  }

  // ── Dessin ───────────────────────────────────────────────────────────────────

  private drawLanes(width: number, height: number): void {
    const laneW = width / LANE_COUNT;
    for (let i = 0; i < LANE_COUNT; i++) {
      const cx = laneW * i + laneW / 2;
      this.laneX.push(cx);
      this.add.rectangle(cx, height / 2, laneW - 2, height, LANE_COLORS[i], 0.05).setDepth(0);
      if (i > 0) this.add.rectangle(laneW * i, height / 2, 1, height, C_WHITE, 0.12).setDepth(0);
    }
  }

  private drawJudgmentLine(width: number): void {
    this.add.rectangle(width / 2, this.judgmentY, width, 3, C_CYAN, 0.9).setDepth(1);
    this.add.rectangle(width / 2, this.judgmentY, width, 16, C_CYAN, 0.1).setDepth(1);
  }

  private drawKeyLabels(height: number): void {
    const { keys } = getSettings();
    const labels = [keys.lane0, keys.lane1, keys.lane2, keys.lane3].map(displayCode);
    for (let i = 0; i < LANE_COUNT; i++) {
      const t = this.add
        .text(this.laneX[i], height * 0.93, labels[i]!, {
          fontFamily: '"VT323"', fontSize: '36px',
          color: '#' + LANE_COLORS[i].toString(16).padStart(6, '0'),
        })
        .setOrigin(0.5, 0.5).setAlpha(0.7).setDepth(2);
      this.keyLabelTexts.push(t);
    }
  }

  private createHUD(width: number): void {
    this.scoreText = this.add
      .text(width - 16, 16, '00000000', { fontFamily: '"VT323"', fontSize: '36px', color: '#fff8fc' })
      .setOrigin(1, 0).setDepth(10);

    this.multiplierText = this.add
      .text(width - 16, 56, '', { fontFamily: '"VT323"', fontSize: '22px', color: '#fffb96' })
      .setOrigin(1, 0).setAlpha(0.8).setDepth(10);

    this.comboText = this.add
      .text(width / 2, this.judgmentY - 90, '', { fontFamily: '"VT323"', fontSize: '60px', color: '#fff8fc' })
      .setOrigin(0.5, 1).setDepth(10);

    this.judgeText = this.add
      .text(width / 2, this.judgmentY - 35, '', { fontFamily: '"VT323"', fontSize: '44px', color: '#01cdfe' })
      .setOrigin(0.5, 1).setAlpha(0).setDepth(10);

    this.add
      .text(width / 2, 12, 'ESC — PAUSE', { fontFamily: '"Space Mono"', fontSize: '9px', color: '#fff8fc' })
      .setOrigin(0.5, 0).setAlpha(0.15).setDepth(10);
  }

  // ── Input ────────────────────────────────────────────────────────────────────

  private setupInput(): void {
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
      if (!this.keyboardEnabled) return;
      const { keys } = getSettings();
      if      (e.code === keys.lane0) this.handleInput(0);
      else if (e.code === keys.lane1) this.handleInput(1);
      else if (e.code === keys.lane2) this.handleInput(2);
      else if (e.code === keys.lane3) this.handleInput(3);
      else if (e.code === 'Escape')   this.togglePause();
    });

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const lane = Math.min(3, Math.floor(p.x / (this.scale.width / LANE_COUNT))) as 0 | 1 | 2 | 3;
      this.handleInput(lane);
    });
  }

  private togglePause(): void {
    if (!this.started || this.ended) return;
    this.isPaused ? this.resume() : this.pause();
  }

  private handleInput(lane: 0 | 1 | 2 | 3): void {
    if (!this.started || this.ended || this.isPaused) return;
    const t = this._audio.currentTime;

    this.flashLane(lane);

    let best: Note | null = null;
    let bestDelta = Infinity;
    for (const note of this.notes) {
      if (note.lane !== lane) continue;
      const delta = Math.abs(note.targetTime - t);
      if (delta <= 0.133 && delta < bestDelta) { best = note; bestDelta = delta; }
    }

    if (best) {
      const j = judge((best.targetTime - t) * 1000);
      this.scoring.record(j);
      this.flashJudgment(j);
      this.createHitEffect(lane, LANE_COLORS[lane]);
      this.removeNote(best);
    }
  }

  // ── Effets visuels ───────────────────────────────────────────────────────────

  private flashLane(lane: 0 | 1 | 2 | 3): void {
    const laneW = this.scale.width / LANE_COUNT;
    const rect  = this.add
      .rectangle(this.laneX[lane], this.scale.height / 2, laneW - 2, this.scale.height, LANE_COLORS[lane], 0.18)
      .setDepth(4);
    this.tweens.add({ targets: rect, alpha: 0, duration: 140, ease: 'Power2', onComplete: () => rect.destroy() });
  }

  private createHitEffect(lane: 0 | 1 | 2 | 3, color: number): void {
    const ring = this.add.arc(this.laneX[lane], this.judgmentY, 16, 0, 360, false, color, 0.75).setDepth(5);
    this.tweens.add({ targets: ring, scaleX: 4, scaleY: 4, alpha: 0, duration: 320, ease: 'Power2', onComplete: () => ring.destroy() });
    const bar = this.add.rectangle(this.laneX[lane], this.judgmentY, 76, 6, color, 0.7).setDepth(5);
    this.tweens.add({ targets: bar, alpha: 0, scaleX: 2, duration: 180, ease: 'Power2', onComplete: () => bar.destroy() });
  }

  private flashJudgment(j: Judgment): void {
    this.tweens.killTweensOf(this.judgeText);
    this.judgeText.setText(j).setColor(JUDGMENT_COLORS[j]).setAlpha(1).setScale(1.25);
    this.tweens.add({ targets: this.judgeText, alpha: 0, scaleX: 1, scaleY: 1, duration: 500, ease: 'Power2' });
  }

  private removeNote(note: Note): void {
    const i = this.notes.indexOf(note);
    if (i !== -1) this.notes.splice(i, 1);
    note.destroy();
  }

  private endGame(): void {
    this.ended = true;
    this.game.events.emit('game-complete', {
      score: this.scoring.score, maxCombo: this.scoring.maxCombo,
      accuracy: this.scoring.accuracy, rank: this.scoring.rank,
    } satisfies GameCompleteData);
  }
}
