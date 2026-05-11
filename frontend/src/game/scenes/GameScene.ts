import Phaser from 'phaser';
import type { AudioEngine } from '../AudioEngine';

const LANE_COUNT = 4;
const NOTE_SPEED = 300; // pixels/seconde
const JUDGMENT_Y_RATIO = 0.85;
const NOTE_W = 80;
const NOTE_H = 22;
const SPAWN_INTERVAL_MS = 2000;

// Couleurs vaporwave (copie des CSS vars pour Phaser)
const C_BG = 0x1a0b2e;
const C_PINK = 0xff71ce;
const C_CYAN = 0x01cdfe;
const C_PURPLE = 0xb967ff;
const C_WHITE = 0xfff8fc;
const LANE_COLORS = [C_PINK, C_CYAN, C_PURPLE, C_PINK];
const KEY_LABELS = ['D', 'F', 'J', 'K'];

export class GameScene extends Phaser.Scene {
  private _audio!: AudioEngine;
  private notes: Phaser.GameObjects.Rectangle[] = [];
  private laneXPositions: number[] = [];
  private judgmentY = 0;
  private nextSpawnTime = 0;
  private currentLane = 0;
  private started = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  // Appelé par GameCanvas via game.scene.getScene('GameScene')
  setAudio(audio: AudioEngine): void {
    this._audio = audio;
  }

  start(): void {
    this.started = true;
    this.nextSpawnTime = this.time.now + 500;
  }

  create(): void {
    const { width, height } = this.scale;
    this.judgmentY = height * JUDGMENT_Y_RATIO;

    this.add.rectangle(width / 2, height / 2, width, height, C_BG);
    this.drawLanes(width, height);
    this.drawJudgmentLine(width);
    this.drawKeyLabels(height);
    this.drawTitle(width);
  }

  private drawLanes(width: number, height: number): void {
    const laneWidth = width / LANE_COUNT;
    for (let i = 0; i < LANE_COUNT; i++) {
      const cx = laneWidth * i + laneWidth / 2;
      this.laneXPositions.push(cx);
      // Fond de lane légèrement visible
      this.add
        .rectangle(cx, height / 2, laneWidth - 2, height, LANE_COLORS[i], 0.04)
        .setDepth(0);
      // Séparateur vertical
      if (i > 0) {
        this.add
          .rectangle(laneWidth * i, height / 2, 1, height, C_WHITE, 0.12)
          .setDepth(0);
      }
    }
  }

  private drawJudgmentLine(width: number): void {
    this.add
      .rectangle(width / 2, this.judgmentY, width, 3, C_CYAN, 0.9)
      .setDepth(1);
    // Glow effect : ligne plus large et transparente
    this.add
      .rectangle(width / 2, this.judgmentY, width, 12, C_CYAN, 0.15)
      .setDepth(1);
  }

  private drawKeyLabels(height: number): void {
    for (let i = 0; i < LANE_COUNT; i++) {
      this.add
        .text(this.laneXPositions[i], height * 0.93, KEY_LABELS[i], {
          fontFamily: '"VT323"',
          fontSize: '32px',
          color: '#' + LANE_COLORS[i].toString(16).padStart(6, '0'),
        })
        .setOrigin(0.5, 0.5)
        .setAlpha(0.8)
        .setDepth(2);
    }
  }

  private drawTitle(width: number): void {
    this.add
      .text(width / 2, 28, 'NEON TEMPO', {
        fontFamily: '"VT323"',
        fontSize: '36px',
        color: '#ff71ce',
      })
      .setOrigin(0.5, 0)
      .setAlpha(0.6)
      .setDepth(2);
  }

  private spawnNote(laneIndex: number): void {
    const note = this.add
      .rectangle(
        this.laneXPositions[laneIndex],
        -NOTE_H,
        NOTE_W,
        NOTE_H,
        LANE_COLORS[laneIndex],
        1,
      )
      .setDepth(3);
    // Glow border simulé via un rectangle légèrement plus grand derrière
    this.add
      .rectangle(
        this.laneXPositions[laneIndex],
        -NOTE_H,
        NOTE_W + 6,
        NOTE_H + 6,
        LANE_COLORS[laneIndex],
        0.25,
      )
      .setDepth(2);
    this.notes.push(note);
  }

  update(_time: number, delta: number): void {
    if (!this.started) return;

    // Spawn périodique en rotation sur les 4 lanes
    if (this.time.now >= this.nextSpawnTime) {
      this.spawnNote(this.currentLane % LANE_COUNT);
      this.currentLane++;
      this.nextSpawnTime = this.time.now + SPAWN_INTERVAL_MS;
    }

    const dy = NOTE_SPEED * (delta / 1000);

    for (let i = this.notes.length - 1; i >= 0; i--) {
      const note = this.notes[i];
      note.y += dy;
      // Destruction hors écran (note manquée)
      if (note.y > this.scale.height + 60) {
        note.destroy();
        this.notes.splice(i, 1);
      }
    }
  }
}
