import Phaser from 'phaser';
import { GAME, POWERUP, COMBO } from '../utils/constants';
import { getLevelGoal } from '../utils/difficulty';
import { EnergySystem } from '../systems/EnergySystem';
import { PowerUpSystem, PowerUpType } from '../systems/PowerUpSystem';
import { EnemySystem } from '../systems/EnemySystem';
import { CoinSystem } from '../systems/CoinSystem';
import { PauseSystem } from '../systems/PauseSystem';
import { HUD } from '../components/HUD';
import { SpeedTrail } from '../components/SpeedTrail';
import { LevelOverlay } from '../components/LevelOverlay';
import { showFloatyText } from '../utils/effects';

interface PlaySceneData {
  score: number;
  level: number;
}

export class PlayScene extends Phaser.Scene {
  // Entities
  private player!: Phaser.Physics.Arcade.Sprite;

  // Systems
  private energySystem!: EnergySystem;
  private powerUpSystem!: PowerUpSystem;
  private enemySystem!: EnemySystem;
  private coinSystem!: CoinSystem;
  private pauseSystem!: PauseSystem;

  // Components
  private hud!: HUD;
  private speedTrail!: SpeedTrail;
  private levelOverlay!: LevelOverlay;

  // State
  private score: number = 0;
  private level: number = 1;
  private overlayActive: boolean = true;
  private coinsInLevel: number = 0;

  // Combo
  private comboCount: number = 0;
  private lastCoinTime: number = 0;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private pauseKey!: Phaser.Input.Keyboard.Key;

  // Constants
  private playerBaseSpeed: number = GAME.PLAYER_BASE_SPEED;

  constructor() {
    super('PlayScene');
  }

  public init(data: PlaySceneData): void {
    this.score = data.score || 0;
    this.level = data.level || 1;
    this.overlayActive = true;
    this.coinsInLevel = 0;
    this.comboCount = 0;
    this.lastCoinTime = 0;
  }

  public create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.physics.world.setBounds(0, GAME.WORLD_BOUNDS_TOP, width, height - GAME.WORLD_BOUNDS_TOP);

    this.add.grid(width / 2, height / 2 + 25, width, height - 50, GAME.GRID_SIZE_X, GAME.GRID_SIZE_Y, 0x1a0933, 0.5, 0x2d124d, 0.3);

    this.player = this.physics.add.sprite(width / 2, height / 2, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDrag(400, 400);

    this.coinSystem = new CoinSystem(this);
    this.coinSystem.init();
    this.coinSystem.createEmitter();
    this.coinSystem.createCoin();
    this.coinSystem.spawnRandomly(this.player.x, this.player.y);

    this.enemySystem = new EnemySystem(this);
    this.enemySystem.init();
    this.enemySystem.spawn(this.level);

    this.energySystem = new EnergySystem(this);
    this.energySystem.init(this.level);

    this.powerUpSystem = new PowerUpSystem(this, {
      onCollect: (type: PowerUpType) => this.onPowerUpCollected(type)
    });
    this.powerUpSystem.init();

    this.hud = new HUD(this);
    this.hud.create();
    this.hud.updateLevel(this.level);
    this.hud.updateScore(this.score);

    this.speedTrail = new SpeedTrail(this);

    this.levelOverlay = new LevelOverlay(this, {
      onComplete: () => {
        this.overlayActive = false;
      }
    });

    this.pauseSystem = new PauseSystem(this, {
      onResume: () => this.onPauseResumed(),
      onQuit: () => {}
    });
    this.pauseSystem.init();

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasdKeys = this.input.keyboard.addKeys('W,A,S,D') as unknown as {
        W: Phaser.Input.Keyboard.Key;
        A: Phaser.Input.Keyboard.Key;
        S: Phaser.Input.Keyboard.Key;
        D: Phaser.Input.Keyboard.Key;
      };
      this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      this.pauseKey.on('down', () => {
        this.pauseSystem.toggle(this.overlayActive);
      });
    }

    this.setupColliders();

    this.time.addEvent({
      delay: this.powerUpSystem === null ? POWERUP.SPAWN_INTERVAL_BASE : getLevelGoal(this.level),
      callback: () => {
        if (!this.powerUpSystem.getDropped()) this.powerUpSystem.spawn();
      },
      callbackScope: this,
      loop: true
    });

    this.time.delayedCall(this.level === 1 ? POWERUP.WELCOME_DELAY_L1 : POWERUP.WELCOME_DELAY_DEFAULT, () => {
      if (!this.powerUpSystem.getDropped()) this.powerUpSystem.spawn();
    });

    this.events.once('shutdown', () => this.cleanupScene());

    this.levelOverlay.show(this.level);
  }

  private setupColliders(): void {
    this.physics.add.overlap(this.player, this.coinSystem.getCoinSprite(), () => {
      this.handleCoinCollection();
    }, undefined, this);

    this.physics.add.overlap(this.player, this.enemySystem.getGroup(), () => {
      if (!this.powerUpSystem.hasActive() || this.powerUpSystem.getActiveEffect() !== 'shield') {
        if (!(this as unknown as Record<string, boolean>).isHurtInvincible) {
          this.handlePlayerHurt();
        }
      }
    }, undefined, this);
  }

  private isHurtInvincible: boolean = false;
  private hurtInvincibleTimer: Phaser.Time.TimerEvent | null = null;

  public update(_time: number, delta: number): void {
    if (this.pauseSystem.isActive()) return;

    if (this.energySystem.getEnergy() > 0 && !this.overlayActive) {
      const alive = this.energySystem.update(_time, delta);
      this.hud.updateEnergy(this.energySystem.getPercentage(), _time);

      if (!alive) {
        this.triggerGameOver();
        return;
      }
    }

    if (this.overlayActive) return;

    this.handlePlayerMovement();
    this.enemySystem.update(this.level, this.player.x, this.player.y);

    const trigger = this.powerUpSystem.checkTriggers(
      this.energySystem.getEnergy(),
      this.enemySystem.getActiveCount(),
      this.coinsInLevel,
      !!this.powerUpSystem.getDropped()
    );

    if (trigger) {
      if (trigger.type) {
        this.powerUpSystem.spawn(trigger.type);
      } else if (trigger.biasA) {
        this.powerUpSystem.spawn(trigger.biasA, trigger.biasB);
      } else {
        this.powerUpSystem.spawn();
      }
    }

    if (this.powerUpSystem.getActiveEffect() === 'magnet') {
      this.handleMagnetEffect();
    }

    if (this.powerUpSystem.getActiveEffect() === 'phase') {
      this.handlePhaseWrap();
    }

    if (this.isHurtInvincible) {
      this.hud.updatePowerUp('[INVENCIBLE!]');
    }

    if (this.powerUpSystem.hasActive()) {
      const timeLeft = this.powerUpSystem.getTimeLeft();
      const secondsLeft = Math.ceil(timeLeft / 1000);

      if (!this.isHurtInvincible) {
        this.hud.updatePowerUp(`[${this.powerUpSystem.getActiveEffect()?.toUpperCase()}: ${secondsLeft}S]`);
      }

      if (this.powerUpSystem.getActiveEffect() === 'shield' && secondsLeft <= 2) {
        this.player.setAlpha(Math.sin(_time / 50) > 0 ? 1 : 0.4);
      }
    } else {
      if (!this.isHurtInvincible) {
        this.hud.updatePowerUp('');
      }
    }

    this.powerUpSystem.checkCollection(this.player);

    if (this.comboCount > 0 && performance.now() - this.lastCoinTime > COMBO.TIME_WINDOW_MS) {
      this.comboCount = 0;
      this.hud.hideCombo();
    }
  }

  private handlePlayerMovement(): void {
    let speed = this.playerBaseSpeed;

    if (this.powerUpSystem.getActiveEffect() === 'speed') {
      speed *= POWERUP.SPEED_MULTIPLIER;
      this.speedTrail.spawn(this.player.x, this.player.y);
    }

    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown || this.wasdKeys?.A.isDown) {
      vx = -speed;
    } else if (this.cursors.right.isDown || this.wasdKeys?.D.isDown) {
      vx = speed;
    }

    if (this.cursors.up.isDown || this.wasdKeys?.W.isDown) {
      vy = -speed;
    } else if (this.cursors.down.isDown || this.wasdKeys?.S.isDown) {
      vy = speed;
    }

    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    this.player.setVelocity(vx, vy);
  }

  private handleMagnetEffect(): void {
    const coin = this.coinSystem.getCoinSprite();
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, coin.x, coin.y);

    if (dist < POWERUP.MAGNET_RANGE) {
      const coinBody = coin.body as Phaser.Physics.Arcade.Body;
      if (!coinBody) return;
      const angle = Phaser.Math.Angle.Between(coin.x, coin.y, this.player.x, this.player.y);
      this.physics.velocityFromRotation(angle, POWERUP.MAGNET_PULL, coinBody.velocity);
    }
  }

  private handlePhaseWrap(): void {
    const { width, height } = this.cameras.main;

    if (this.player.x < -16) {
      this.player.x = width + 16;
    } else if (this.player.x > width + 16) {
      this.player.x = -16;
    }

    if (this.player.y < 34) {
      this.player.y = height + 16;
    } else if (this.player.y > height + 16) {
      this.player.y = 34;
    }
  }

  private handleCoinCollection(): void {
    const result = this.coinSystem.collect();
    const playerScale = this.coinSystem.getPlayerScale();
    const floatyColor = this.coinSystem.getFloatyColor();

    const now = performance.now();
    let multiplier = 1;
    if (this.comboCount > 0 && now - this.lastCoinTime < COMBO.TIME_WINDOW_MS) {
      this.comboCount++;
      if (this.comboCount >= 5) {
        multiplier = COMBO.TIER_5_MULTIPLIER;
      } else if (this.comboCount >= 3) {
        multiplier = COMBO.TIER_3_MULTIPLIER;
      }
    } else {
      this.comboCount = 1;
    }
    this.lastCoinTime = now;

    const finalScore = Math.round(result.scoreGain * multiplier);

    showFloatyText(this, this.coinSystem.getCoinSprite().x, this.coinSystem.getCoinSprite().y, `+${finalScore}`, floatyColor);

    if (this.comboCount >= 3) {
      this.hud.showCombo(this.comboCount, multiplier);
    }

    this.tweens.add({
      targets: this.player,
      scaleX: playerScale,
      scaleY: playerScale,
      duration: 120,
      yoyo: true,
      ease: 'Quad.easeInOut'
    });

    this.score += finalScore;
    this.energySystem.recover(result.energyGain);
    this.coinsInLevel++;

    this.hud.updateScore(this.score);
    this.hud.updateEnergy(this.energySystem.getPercentage(), performance.now());

    const goal = getLevelGoal(this.level);

    if (this.coinsInLevel >= goal) {
      this.triggerLevelComplete();
    } else {
      this.coinSystem.spawnRandomly(this.player.x, this.player.y);
    }
  }

  private handlePlayerHurt(): void {
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    if (!playerBody) return;

    this.energySystem.takeDamage(GAME.HURT_DAMAGE);
    this.hud.updateEnergy(this.energySystem.getPercentage(), performance.now());

    this.cameras.main.flash(200, 255, 0, 0);

    const randomAngle = Phaser.Math.Between(0, 360) * (Math.PI / 180);
    this.physics.velocityFromRotation(randomAngle, 300, playerBody.velocity);

    this.isHurtInvincible = true;
    this.player.setTint(0xff0055);

    if (this.hurtInvincibleTimer) {
      this.hurtInvincibleTimer.destroy();
    }
    this.hurtInvincibleTimer = this.time.delayedCall(GAME.HURT_INVINCIBLE_MS, () => {
      this.isHurtInvincible = false;
      this.hurtInvincibleTimer = null;

      if (this.powerUpSystem.hasActive()) {
        this.applyPowerUpVisuals();
      } else {
        this.player.clearTint();
        this.player.setAlpha(1);
        this.hud.updatePowerUp('');
      }
    });
  }

  private onPowerUpCollected(type: PowerUpType): void {
    this.player.setAlpha(1);
    this.player.setCollideWorldBounds(true);

    if (type === 'speed') {
      this.player.setTint(0x00f0ff);
      showFloatyText(this, this.player.x, this.player.y - 30, 'SPEED BOOTS!', '#00f0ff');
    } else if (type === 'shield') {
      this.player.setTint(0xff007f);
      showFloatyText(this, this.player.x, this.player.y - 30, 'ECTO SHIELD!', '#ff007f');
    } else if (type === 'magnet') {
      this.player.setTint(0x39ff14);
      showFloatyText(this, this.player.x, this.player.y - 30, 'GOLD MAGNET!', '#39ff14');
    } else if (type === 'phase') {
      this.player.setTint(0xaa00ff);
      this.player.setAlpha(0.7);
      this.player.setCollideWorldBounds(false);
      showFloatyText(this, this.player.x, this.player.y - 30, 'PHASE SHIFT!', '#aa00ff');
    }
  }

  private applyPowerUpVisuals(): void {
    const effect = this.powerUpSystem.getActiveEffect();
    if (!effect) return;
    this.player.clearTint();
    this.player.setAlpha(1);

    switch (effect) {
      case 'speed':
        this.player.setTint(0x00f0ff);
        break;
      case 'shield':
        this.player.setTint(0xff007f);
        break;
      case 'magnet':
        this.player.setTint(0x39ff14);
        break;
      case 'phase':
        this.player.setTint(0xaa00ff);
        this.player.setAlpha(0.7);
        break;
    }
  }

  private triggerLevelComplete(): void {
    this.energySystem.stopHeartbeat();
    this.physics.world.pause();

    this.levelOverlay.showComplete(this.level, () => {
      this.scene.start('PlayScene', { score: this.score, level: this.level + 1 });
    });
  }

  private triggerGameOver(): void {
    this.energySystem.cleanup();
    this.physics.world.pause();
    this.scene.start('GameOverScene', { score: this.score });
  }

  private onPauseResumed(): void {
    const duration = this.pauseSystem.getPauseDuration();
    if (duration > 0) {
      this.energySystem.advanceCrisisTimers(duration);
      this.pauseSystem.resetPauseStart();
    }
  }

  private cleanupScene(): void {
    this.energySystem.cleanup();
    this.speedTrail.cleanup();
    this.pauseSystem.cleanup();
    this.levelOverlay.cleanup();
    this.coinSystem.cleanup();
    this.powerUpSystem.cleanup();

    if (this.pauseKey) {
      this.pauseKey.removeAllListeners();
    }
  }
}
