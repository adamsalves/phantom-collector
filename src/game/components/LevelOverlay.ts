import Phaser from 'phaser';
import { getScenarioName, getLevelGoal } from '../utils/difficulty';

export interface LevelOverlayCallbacks {
  onComplete: () => void;
}

export class LevelOverlay {
  private scene: Phaser.Scene;
  private active: boolean = false;
  private overlay: Phaser.GameObjects.Rectangle | null = null;
  private texts: Phaser.GameObjects.Text[] = [];
  private callbacks: LevelOverlayCallbacks;

  constructor(scene: Phaser.Scene, callbacks: LevelOverlayCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;
  }

  public show(level: number): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    this.active = true;
    this.scene.physics.world.pause();

    this.overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x0d041a, 0.9);

    const text1 = this.scene.add.text(width / 2, height / 2 - 30, `LEVEL ${level}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '24px',
      color: '#00f0ff'
    }).setOrigin(0.5);
    this.texts.push(text1);

    const scenarioName = getScenarioName(level);
    const text2 = this.scene.add.text(width / 2, height / 2 + 10, scenarioName, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#ff007f'
    }).setOrigin(0.5);
    this.texts.push(text2);

    const goal = getLevelGoal(level);
    const text3 = this.scene.add.text(width / 2, height / 2 + 50, `GOAL: COLLECT ${goal} COINS`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.texts.push(text3);

    this.scene.time.delayedCall(2200, () => {
      this.destroy();
      this.scene.physics.world.resume();
      this.callbacks.onComplete();
    });
  }

  public showComplete(level: number, callback: () => void): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    this.active = true;

    const bg = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x0d041a, 0.9);

    const text1 = this.scene.add.text(width / 2, height / 2 - 20, 'LEVEL COMPLETE!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '22px',
      color: '#39ff14'
    }).setOrigin(0.5);

    const text2 = this.scene.add.text(width / 2, height / 2 + 20, `GET READY FOR LEVEL ${level + 1}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#00f0ff'
    }).setOrigin(0.5);

    this.scene.time.delayedCall(1500, () => {
      bg.destroy();
      text1.destroy();
      text2.destroy();
      this.active = false;
      callback();
    });
  }

  public isActive(): boolean {
    return this.active;
  }

  private destroy(): void {
    if (this.overlay) {
      this.overlay.destroy();
      this.overlay = null;
    }
    for (const text of this.texts) {
      text.destroy();
    }
    this.texts = [];
    this.active = false;
  }

  public cleanup(): void {
    this.destroy();
  }
}
