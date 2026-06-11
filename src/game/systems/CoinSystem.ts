import Phaser from 'phaser';
import { getCoinValue, getCoinEnergy, pickCoinType } from '../utils/coinHelper';
import { soundManager } from '../audio/SoundGenerator';

export type CoinType = 'gold' | 'silver' | 'rainbow';

export interface CoinCollectionResult {
  scoreGain: number;
  energyGain: number;
  type: CoinType;
}

export class CoinSystem {
  private scene: Phaser.Scene;
  private coin!: Phaser.Physics.Arcade.Sprite;
  private coinType: CoinType = 'gold';
  private rainbowTweenCounter: Phaser.Tweens.Tween | null = null;
  private coinParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public init(): void {
    this.coinType = 'gold';
    this.rainbowTweenCounter = null;
    this.coinParticles = null;
  }

  public createEmitter(): void {
    this.coinParticles = this.scene.add.particles(0, 0, 'spark', {
      lifespan: 600,
      speed: { min: 40, max: 120 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 0.8, end: 0 },
      frequency: -1,
      quantity: 12
    });
    this.coinParticles.setDepth(15);
  }

  public createCoin(): void {
    this.coin = this.scene.physics.add.sprite(300, 200, 'coin');
    this.coin.setBounce(0.4, 0.4);
    this.coin.setCollideWorldBounds(true);
  }

  public spawnRandomly(playerX: number, playerY: number): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    const margin = 30;
    const midX = width / 2;
    const midY = height / 2;

    const playerQx = playerX < midX ? 0 : 1;
    const playerQy = playerY < midY ? 0 : 1;

    let qx: number, qy: number;
    let attempts = 0;
    do {
      qx = Phaser.Math.Between(0, 1);
      qy = Phaser.Math.Between(0, 1);
      attempts++;
    } while (qx === playerQx && qy === playerQy && attempts < 10);

    const rx = Phaser.Math.Between(
      qx === 0 ? margin : midX + margin,
      qx === 0 ? midX - margin : width - margin
    );
    const ry = Phaser.Math.Between(
      qy === 0 ? margin + 50 : midY + margin,
      qy === 0 ? midY - margin : height - margin
    );

    this.coin.setPosition(rx, ry);
    this.coin.setVelocity(0, 0);

    this.coinType = pickCoinType();

    this.scene.tweens.killTweensOf(this.coin);
    if (this.rainbowTweenCounter) {
      this.rainbowTweenCounter.stop();
      this.rainbowTweenCounter = null;
    }

    if (this.coinParticles) {
      this.coinParticles.stopFollow();
      this.coinParticles.stop();
    }

    this.coin.setScale(1.0);
    this.coin.clearTint();

    this.setupVisuals();
  }

  private setupVisuals(): void {
    if (this.coinType === 'gold') {
      this.coin.setTint(0xffd700);

      this.scene.tweens.add({
        targets: this.coin,
        y: '+=8',
        yoyo: true,
        repeat: -1,
        duration: 600,
        ease: 'Sine.easeInOut'
      });
    } else if (this.coinType === 'silver') {
      this.coin.setTint(0xc0c0c0);

      this.scene.tweens.add({
        targets: this.coin,
        y: '+=6',
        yoyo: true,
        repeat: -1,
        duration: 500,
        ease: 'Sine.easeInOut'
      });

      this.scene.tweens.add({
        targets: this.coin,
        scaleX: 1.3,
        scaleY: 1.3,
        yoyo: true,
        repeat: -1,
        duration: 800,
        ease: 'Linear'
      });
    } else if (this.coinType === 'rainbow') {
      this.rainbowTweenCounter = this.scene.tweens.addCounter({
        from: 0,
        to: 360,
        duration: 2000,
        repeat: -1,
        onUpdate: (tween) => {
          const hue = (tween.getValue() as number) ?? 0;
          const color = Phaser.Display.Color.HSLToColor(hue / 360, 1, 0.5);
          this.coin.setTint(color.color);
        }
      });

      this.scene.tweens.add({
        targets: this.coin,
        y: '+=10',
        yoyo: true,
        repeat: -1,
        duration: 700,
        ease: 'Sine.easeInOut'
      });

      if (this.coinParticles) {
        this.coinParticles.startFollow(this.coin);
        this.coinParticles.setConfig({
          frequency: 200,
          quantity: 1,
          scale: { start: 1.2, end: 0 },
          lifespan: 500,
          speed: { min: 20, max: 50 },
          tint: [0xff007f, 0x00f0ff, 0x39ff14, 0xffd700]
        });
        this.coinParticles.start();
      }
    }
  }

  public collect(): CoinCollectionResult {
    const scoreGain = getCoinValue(this.coinType);
    const energyGain = getCoinEnergy(this.coinType);
    const type = this.coinType;

    if (this.coinType === 'gold') {
      soundManager.playCoin();
    } else if (this.coinType === 'silver') {
      soundManager.playCoinSilver();

      if (this.coinParticles) {
        this.coinParticles.setConfig({
          frequency: -1,
          tint: 0xc0c0c0,
          scale: { start: 1.5, end: 0 },
          lifespan: 600,
          speed: { min: 40, max: 120 }
        });
        this.coinParticles.explode(15, this.coin.x, this.coin.y);
      }
    } else if (this.coinType === 'rainbow') {
      soundManager.playCoinRainbow();
      this.scene.cameras.main.flash(200, 255, 255, 255);

      if (this.coinParticles) {
        this.coinParticles.setConfig({
          frequency: -1,
          tint: [0xff007f, 0x00f0ff, 0x39ff14, 0xffd700],
          scale: { start: 2.0, end: 0 },
          lifespan: 700,
          speed: { min: 60, max: 150 }
        });
        this.coinParticles.explode(25, this.coin.x, this.coin.y);
      }
    }

    return { scoreGain, energyGain, type };
  }

  public getCoinSprite(): Phaser.Physics.Arcade.Sprite {
    return this.coin;
  }

  public getCoinType(): CoinType {
    return this.coinType;
  }

  public getFloatyColor(): string {
    if (this.coinType === 'silver') return '#c0c0c0';
    if (this.coinType === 'rainbow') return '#00f0ff';
    return '#ffd700';
  }

  public getPlayerScale(): number {
    if (this.coinType === 'silver') return 1.5;
    if (this.coinType === 'rainbow') return 1.75;
    return 1.25;
  }

  public cleanup(): void {
    if (this.rainbowTweenCounter) {
      this.rainbowTweenCounter.stop();
      this.rainbowTweenCounter = null;
    }
  }
}
