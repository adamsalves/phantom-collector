import Phaser from 'phaser';
import { getScenarioName, getLevelGoal } from '../utils/difficulty';
import { THEME } from '../utils/theme';

export interface LevelOverlayCallbacks {
  onComplete: () => void;
}

export class LevelOverlay {
  private scene: Phaser.Scene;
  private active: boolean = false;
  private overlay: Phaser.GameObjects.Rectangle | null = null;
  private texts: Phaser.GameObjects.Text[] = [];
  private timers: Phaser.Time.TimerEvent[] = [];
  private callbacks: LevelOverlayCallbacks;

  constructor(scene: Phaser.Scene, callbacks: LevelOverlayCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;
  }

  public show(level: number): void {
    this.reset();
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    this.active = true;
    this.scene.physics.world.pause();

    this.overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, THEME.colors.background.int, 0.9);

    const showText = (text: string, y: number, color: string) => {
      const obj = this.scene.add.text(width / 2, y, text, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '14px',
        color
      }).setOrigin(0.5);
      this.texts.push(obj);
      return obj;
    };

    showText(`LEVEL ${level}`, height / 2 - 30, THEME.colors.primary.hex);
    showText(getScenarioName(level), height / 2 + 10, THEME.colors.accent.hex);
    showText(`GOAL: COLLECT ${getLevelGoal(level)} COINS`, height / 2 + 50, THEME.colors.neutral.white.hex);

    const timer = this.scene.time.delayedCall(2200, () => {
      this.reset();
      this.scene.physics.world.resume();
      this.callbacks.onComplete();
    });
    this.timers.push(timer);
  }

  public showComplete(level: number, callback: () => void): void {
    this.reset();
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    this.active = true;

    this.overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, THEME.colors.background.int, 0.9);

    const addText = (text: string, y: number, color: string) =>
      this.scene.add.text(width / 2, y, text, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '14px',
        color
      }).setOrigin(0.5);

    this.texts.push(
      addText('LEVEL COMPLETE!', height / 2 - 20, THEME.colors.success.hex),
      addText(`GET READY FOR LEVEL ${level + 1}`, height / 2 + 20, THEME.colors.primary.hex)
    );

    const timer = this.scene.time.delayedCall(1500, () => {
      this.reset();
      callback();
    });
    this.timers.push(timer);
  }

  public isActive(): boolean {
    return this.active;
  }

  private reset(): void {
    for (const timer of this.timers) {
      timer.remove(false);
    }
    this.timers = [];

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
    this.reset();
  }
}
