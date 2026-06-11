import Phaser from 'phaser';
import { PAUSE } from '../utils/constants';
import { soundManager } from '../audio/SoundGenerator';

export interface PauseCallbacks {
  onResume: () => void;
  onQuit: () => void;
}

export class PauseSystem {
  private scene: Phaser.Scene;
  private isPaused: boolean = false;
  private isTransitioning: boolean = false;
  private pauseStartedAt: number = 0;
  private pauseOverlay: Phaser.GameObjects.Container | null = null;
  private callbacks: PauseCallbacks;

  constructor(scene: Phaser.Scene, callbacks: PauseCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;
  }

  public init(): void {
    this.isPaused = false;
    this.isTransitioning = false;
    this.pauseStartedAt = 0;
    this.pauseOverlay = null;
  }

  public toggle(overlayActive: boolean): void {
    if (overlayActive || this.isTransitioning) return;

    this.isPaused = !this.isPaused;
    soundManager.playPause();

    if (this.isPaused) {
      this.scene.physics.world.pause();
      this.scene.time.paused = true;
      this.scene.tweens.pauseAll();
      this.pauseStartedAt = performance.now();
      this.createOverlay();
    } else {
      this.resume();
    }
  }

  public resume(): void {
    if (this.isTransitioning) return;

    if (this.pauseOverlay) {
      this.isTransitioning = true;
      const overlay = this.pauseOverlay;

      this.scene.tweens.add({
        targets: overlay,
        alpha: 0,
        duration: PAUSE.FADE_OUT_DURATION,
        onComplete: () => {
          overlay.destroy();
          this.pauseOverlay = null;
          this.isTransitioning = false;
          this.isPaused = false;
          this.scene.physics.world.resume();
          this.scene.time.paused = false;
          this.scene.tweens.resumeAll();
          this.callbacks.onResume();
        }
      });
    } else {
      this.isPaused = false;
      this.scene.physics.world.resume();
      this.scene.time.paused = false;
      this.scene.tweens.resumeAll();
      this.callbacks.onResume();
    }
  }

  public getPauseDuration(): number {
    if (this.pauseStartedAt > 0) {
      return performance.now() - this.pauseStartedAt;
    }
    return 0;
  }

  public resetPauseStart(): void {
    this.pauseStartedAt = 0;
  }

  public isActive(): boolean {
    return this.isPaused;
  }

  private createOverlay(): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    this.pauseOverlay = this.scene.add.container(0, 0).setDepth(200).setAlpha(0);

    const background = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x0d041a, PAUSE.OVERLAY_ALPHA);
    this.pauseOverlay.add(background);

    const pausedText = this.scene.add.text(width / 2, height / 3, 'PAUSED', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '28px',
      color: '#00f0ff'
    }).setOrigin(0.5).setShadow(0, 0, '#00f0ff', 10, true, true);
    this.pauseOverlay.add(pausedText);

    const resumeBtn = this.scene.add.text(width / 2, height * 0.52, 'RESUME', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#39ff14'
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setShadow(0, 0, '#39ff14', 4, true, true);

    resumeBtn.on('pointerdown', () => {
      this.resume();
      soundManager.playPause();
    });
    resumeBtn.on('pointerover', () => {
      resumeBtn.setColor('#ffffff');
      resumeBtn.setShadow(0, 0, '#ffffff', 8, true, true);
    });
    resumeBtn.on('pointerout', () => {
      resumeBtn.setColor('#39ff14');
      resumeBtn.setShadow(0, 0, '#39ff14', 4, true, true);
    });
    this.pauseOverlay.add(resumeBtn);

    const quitBtn = this.scene.add.text(width / 2, height * 0.65, 'QUIT TO MENU', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#ff007f'
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setShadow(0, 0, '#ff007f', 4, true, true);

    quitBtn.on('pointerdown', () => {
      soundManager.playPause();
      this.scene.scene.start('MenuScene');
    });
    quitBtn.on('pointerover', () => {
      quitBtn.setColor('#ffffff');
      quitBtn.setShadow(0, 0, '#ffffff', 8, true, true);
    });
    quitBtn.on('pointerout', () => {
      quitBtn.setColor('#ff007f');
      quitBtn.setShadow(0, 0, '#ff007f', 4, true, true);
    });
    this.pauseOverlay.add(quitBtn);

    const tipText = this.scene.add.text(width / 2, height * 0.8, 'PRESS ESC OR CLICK RESUME TO CONTINUE', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#888888'
    }).setOrigin(0.5);
    this.pauseOverlay.add(tipText);

    this.isTransitioning = true;
    this.scene.tweens.add({
      targets: this.pauseOverlay,
      alpha: 1,
      duration: PAUSE.FADE_IN_DURATION,
      onComplete: () => {
        this.isTransitioning = false;
      }
    });
  }

  public cleanup(): void {
    if (this.pauseOverlay) {
      this.pauseOverlay.destroy();
      this.pauseOverlay = null;
    }
  }
}
