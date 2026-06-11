import Phaser from 'phaser';
import { getEnemyCount, getEnemySpeed } from '../utils/difficulty';

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
      const rx = Phaser.Math.Between(50, width - 50);
      const ry = Phaser.Math.Between(100, height - 100);

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

    if (level % 5 === 0 && count > 0) {
      const stalkerIndex = Phaser.Math.Between(0, count - 1);
      const stalker = this.enemies.getChildren()[stalkerIndex] as Phaser.Physics.Arcade.Sprite;
      stalker.setName('stalker');
      stalker.setTint(0xff00ff);
    }
  }

  public update(level: number, playerX: number, playerY: number): void {
    this.enemies.getChildren().forEach((enemyObject) => {
      const enemy = enemyObject as Phaser.Physics.Arcade.Sprite;
      const enemyBody = enemy.body as Phaser.Physics.Arcade.Body;
      if (!enemyBody) return;

      if (level % 5 === 0 && enemy.name === 'stalker') {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, playerX, playerY);
        this.scene.physics.velocityFromRotation(angle, 110, enemyBody.velocity);
      } else {
        if (enemyBody.velocity.length() < 50) {
          const angle = Phaser.Math.Between(0, 360) * (Math.PI / 180);
          const speed = getEnemySpeed(level);
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
