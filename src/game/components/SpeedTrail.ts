import Phaser from 'phaser';
import { POWERUP } from '../utils/constants';

export class SpeedTrail {
  private scene: Phaser.Scene;
  private trails: Phaser.GameObjects.Sprite[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public spawn(x: number, y: number): void {
    if (Math.random() >= POWERUP.TRAIL_SPAWN_CHANCE) return;

    const trail = this.scene.add.sprite(x, y, 'player');
    trail.setAlpha(0.4);
    trail.setTint(0x00f0ff);
    this.trails.push(trail);

    this.scene.tweens.add({
      targets: trail,
      alpha: 0,
      scale: 0.5,
      duration: 300,
      onComplete: () => {
        const idx = this.trails.indexOf(trail);
        if (idx !== -1) this.trails.splice(idx, 1);
        trail.destroy();
      }
    });
  }

  public cleanup(): void {
    for (const trail of this.trails) {
      this.scene.tweens.killTweensOf(trail);
      trail.destroy();
    }
    this.trails = [];
  }
}
