import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';

export function createPhaserGame(parent: HTMLElement, chartId: string): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#1a0b2e',
    scene: [new GameScene(chartId)],
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: '100%',
      height: '100%',
    },
    // Désactive le banner Phaser dans la console
    banner: false,
  });
}
