import Phaser from 'phaser';
import { NOTE_W, NOTE_H } from '../constants';

export class Note {
  readonly lane: 0 | 1 | 2 | 3;
  readonly targetTime: number; // secondes audio

  private body: Phaser.GameObjects.Rectangle;
  private glow: Phaser.GameObjects.Rectangle;

  constructor(
    scene: Phaser.Scene,
    x: number,
    lane: 0 | 1 | 2 | 3,
    targetTime: number,
    color: number,
  ) {
    this.lane = lane;
    this.targetTime = targetTime;
    // Glow derrière, body devant
    this.glow = scene.add
      .rectangle(x, -1000, NOTE_W + 8, NOTE_H + 8, color, 0.25)
      .setDepth(2);
    this.body = scene.add
      .rectangle(x, -1000, NOTE_W, NOTE_H, color, 1)
      .setDepth(3);
  }

  setY(y: number): void {
    this.body.y = y;
    this.glow.y = y;
  }

  destroy(): void {
    this.body.destroy();
    this.glow.destroy();
  }
}
