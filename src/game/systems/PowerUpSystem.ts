import Phaser from 'phaser';
import { POWERUP } from '../utils/constants';
import { soundManager } from '../audio/SoundGenerator';

export type PowerUpType = 'speed' | 'shield' | 'magnet' | 'phase';

export interface ActivePowerUp {
  sprite: Phaser.Physics.Arcade.Sprite;
  type: PowerUpType;
}

export interface PowerUpCallbacks {
  onCollect: (type: PowerUpType) => void;
  onDeactivate: (type: PowerUpType) => void;
}

export class PowerUpSystem {
  private scene: Phaser.Scene;
  private droppedPowerUp: ActivePowerUp | null = null;
  private activeEffect: PowerUpType | null = null;
  private powerUpTimeLeft: number = 0;
  private powerUpTween: Phaser.Tweens.Tween | null = null;
  private callbacks: PowerUpCallbacks;

  private energyCrisisTriggered: boolean = false;
  private manyEnemiesTriggered: boolean = false;

  constructor(scene: Phaser.Scene, callbacks: PowerUpCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;
  }

  public init(): void {
    this.droppedPowerUp = null;
    this.activeEffect = null;
    this.powerUpTimeLeft = 0;
    this.powerUpTween = null;
    this.energyCrisisTriggered = false;
    this.manyEnemiesTriggered = false;
  }

  public update(delta: number): void {
    if (this.activeEffect && this.powerUpTimeLeft > 0) {
      this.powerUpTimeLeft -= delta;

      if (this.powerUpTimeLeft <= 0) {
        this.deactivate();
      }
    }
  }

  public checkCollection(player: Phaser.Physics.Arcade.Sprite): void {
    if (!this.droppedPowerUp) return;

    if (this.scene.physics.overlap(player, this.droppedPowerUp.sprite)) {
      this.collect();
    }
  }

  public checkTriggers(
    energy: number,
    enemyCount: number,
    hasDropped: boolean
  ): { biasA?: PowerUpType; biasB?: PowerUpType } | null {
    if (hasDropped) return null;

    if (energy < 25 && !this.energyCrisisTriggered) {
      this.energyCrisisTriggered = true;
      if (Math.random() < 0.7) {
        return { biasA: 'shield', biasB: 'speed' };
      }
    }

    if (enemyCount >= 5 && !this.manyEnemiesTriggered) {
      this.manyEnemiesTriggered = true;
      if (Math.random() < 0.6) {
        return { biasA: 'phase', biasB: 'speed' };
      }
    }

    return null;
  }

  public spawn(biasA?: PowerUpType, biasB?: PowerUpType): void {
    if (this.droppedPowerUp) return;

    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    const rx = Phaser.Math.Between(50, width - 50);
    const ry = Phaser.Math.Between(100, height - 100);

    const chosenType = this.pickType(biasA, biasB);
    let textureKey = 'powerup_speed';
    if (chosenType === 'shield') textureKey = 'powerup_shield';
    if (chosenType === 'magnet') textureKey = 'powerup_magnet';
    if (chosenType === 'phase') textureKey = 'powerup_phase';

    const sprite = this.scene.physics.add.sprite(rx, ry, textureKey);
    sprite.setCollideWorldBounds(true);

    this.droppedPowerUp = { sprite, type: chosenType };

    this.powerUpTween = this.scene.tweens.add({
      targets: sprite,
      scaleX: 1.3,
      scaleY: 1.3,
      yoyo: true,
      repeat: -1,
      duration: 500
    });

    this.scene.time.delayedCall(POWERUP.EXPIRE_TIME, () => {
      if (this.droppedPowerUp && this.droppedPowerUp.sprite === sprite) {
        this.scene.tweens.killTweensOf(sprite);
        sprite.destroy();
        this.droppedPowerUp = null;
        this.powerUpTween = null;
      }
    });
  }

  public activate(type: PowerUpType): void {
    soundManager.playPowerup();
    this.activeEffect = type;

    switch (type) {
      case 'speed':
        this.powerUpTimeLeft = POWERUP.SPEED_DURATION;
        break;
      case 'shield':
        this.powerUpTimeLeft = POWERUP.SHIELD_DURATION;
        break;
      case 'magnet':
        this.powerUpTimeLeft = POWERUP.MAGNET_DURATION;
        break;
      case 'phase':
        this.powerUpTimeLeft = POWERUP.PHASE_DURATION;
        break;
    }

    this.callbacks.onCollect(type);
  }

  private collect(): void {
    if (!this.droppedPowerUp) return;

    const type = this.droppedPowerUp.type;

    if (this.powerUpTween) {
      this.scene.tweens.killTweensOf(this.droppedPowerUp.sprite);
      this.powerUpTween = null;
    }

    this.droppedPowerUp.sprite.destroy();
    this.droppedPowerUp = null;

    this.activate(type);
  }

  private deactivate(): void {
    const prevType = this.activeEffect;
    this.activeEffect = null;
    this.powerUpTimeLeft = 0;
    if (prevType) {
      this.callbacks.onDeactivate(prevType);
    }
  }

  private pickType(biasA?: PowerUpType, biasB?: PowerUpType): PowerUpType {
    const all: PowerUpType[] = ['speed', 'shield', 'magnet', 'phase'];
    const pool = [...all];

    if (biasA) {
      pool.push(biasA, biasA);
    }
    if (biasB) {
      pool.push(biasB);
    }

    return Phaser.Math.RND.pick(pool);
  }

  public getDropped(): ActivePowerUp | null {
    return this.droppedPowerUp;
  }

  public getActiveEffect(): PowerUpType | null {
    return this.activeEffect;
  }

  public getTimeLeft(): number {
    return this.powerUpTimeLeft;
  }

  public hasActive(): boolean {
    return this.activeEffect !== null && this.powerUpTimeLeft > 0;
  }

  public cleanup(): void {
    if (this.powerUpTween) {
      this.scene.tweens.killTweensOf(this.powerUpTween.targets);
      this.powerUpTween = null;
    }
    if (this.droppedPowerUp) {
      this.scene.tweens.killTweensOf(this.droppedPowerUp.sprite);
      this.droppedPowerUp.sprite.destroy();
      this.droppedPowerUp = null;
    }
  }
}
