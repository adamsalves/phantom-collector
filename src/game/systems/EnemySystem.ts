import Phaser from 'phaser';
import { GAME, ENEMY } from '../utils/constants';
import { getEnemyCount, getEnemySpeed } from '../utils/difficulty';
import { THEME } from '../utils/theme';

export class EnemySystem {
  private scene: Phaser.Scene;
  private enemies!: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public init(): void {
    this.enemies = this.scene.physics.add.group();
  }

  public spawn(level: number): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    const count = getEnemyCount(level);

    for (let i = 0; i < count; i++) {
      const rx = Phaser.Math.Between(ENEMY.SPAWN_MARGIN_X, width - ENEMY.SPAWN_MARGIN_X);
      const ry = Phaser.Math.Between(ENEMY.SPAWN_MARGIN_Y, height - ENEMY.SPAWN_MARGIN_Y);

      const enemy = this.enemies.create(rx, ry, 'enemy') as Phaser.Physics.Arcade.Sprite;
      enemy.setCollideWorldBounds(true);
      enemy.setBounce(1, 1);

      const enemyBody = enemy.body as Phaser.Physics.Arcade.Body;
      if (enemyBody) {
        const baseSpeed = getEnemySpeed(level);
        const angle = Phaser.Math.Between(0, 360) * (Math.PI / 180);
        this.scene.physics.velocityFromRotation(angle, baseSpeed, enemyBody.velocity);
      }
    }

    if (level % ENEMY.STALKER_LEVEL_INTERVAL === 0 && count > 0) {
      const stalkerIndex = Phaser.Math.Between(0, count - 1);
      const stalker = this.enemies.getChildren()[stalkerIndex] as Phaser.Physics.Arcade.Sprite;
      stalker.setName('stalker');
      stalker.setTint(THEME.colors.stalker.int);
    }
  }

  public update(level: number, playerX: number, playerY: number): void {
    this.enemies.getChildren().forEach((enemyObject) => {
      const enemy = enemyObject as Phaser.Physics.Arcade.Sprite;
      const enemyBody = enemy.body as Phaser.Physics.Arcade.Body;
      if (!enemyBody) return;

      if (level % ENEMY.STALKER_LEVEL_INTERVAL === 0 && enemy.name === 'stalker') {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, playerX, playerY);
        this.scene.physics.velocityFromRotation(angle, GAME.ENEMY_CHASE_SPEED, enemyBody.velocity);
      } else {
        if (enemyBody.velocity.length() < ENEMY.WANDER_MIN_SPEED) {
          const angle = Phaser.Math.Between(0, 360) * (Math.PI / 180);
          const speed = ENEMY.WANDER_BASE_SPEED + level * ENEMY.WANDER_SPEED_PER_LEVEL;
          this.scene.physics.velocityFromRotation(angle, speed, enemyBody.velocity);
        }
      }
    });
  }

  public getGroup(): Phaser.Physics.Arcade.Group {
    return this.enemies;
  }

  public getActiveCount(): number {
    return this.enemies.countActive();
  }

  public getChildren(): Phaser.GameObjects.GameObject[] {
    return this.enemies.getChildren();
  }

  public cleanup(): void {
    if (this.enemies) {
      this.enemies.clear(true, true);
    }
  }
}
