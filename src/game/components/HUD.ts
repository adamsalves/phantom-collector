import Phaser from 'phaser';
import { THEME } from '../utils/theme';

export class HUD {
  private scene: Phaser.Scene;
  private scoreText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private energyBar!: Phaser.GameObjects.Graphics;
  private powerUpText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public create(): void {
    this.scoreText = this.scene.add.text(20, 15, 'SCORE: 0', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: THEME.colors.neutral.white.hex
    });

    this.levelText = this.scene.add.text(175, 15, 'LEVEL: 1', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: THEME.colors.primary.hex
    });

    this.powerUpText = this.scene.add.text(545, 15, '', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      color: THEME.colors.accent.hex
    });

    this.scene.add.text(330, 15, 'ENERGY:', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: THEME.colors.success.hex
    });

    this.energyBar = this.scene.add.graphics();
    this.drawEnergyBar(1.0);

    this.comboText = this.scene.add.text(350, 380, '', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: THEME.colors.warning.hex
    }).setOrigin(0.5).setAlpha(0);
  }

  public updateScore(score: number): void {
    this.scoreText.setText(`SCORE: ${score}`);
  }

  public updateLevel(level: number): void {
    this.levelText.setText(`LEVEL: ${level}`);
  }

  public updateEnergy(percentage: number, time: number): void {
    this.drawEnergyBar(percentage, time);
  }

  public updatePowerUp(text: string): void {
    this.powerUpText.setText(text);
  }

  public showCombo(combo: number, multiplier: number): void {
    if (combo >= 3) {
      const label = combo >= 5 ? 'MEGA COMBO' : 'COMBO';
      this.comboText.setText(`${label} x${combo}! +${Math.round((multiplier - 1) * 100)}%`);
      this.comboText.setAlpha(1);
      this.scene.tweens.add({
        targets: this.comboText,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 150,
        yoyo: true,
        ease: 'Quad.easeOut'
      });
    }
  }

  public hideCombo(): void {
    this.scene.tweens.add({
      targets: this.comboText,
      alpha: 0,
      duration: 300
    });
  }

  public drawEnergyBar(percentage: number, time?: number): void {
    this.energyBar.clear();

    const barX = 425;
    const barY = 15;
    const barWidth = 100;
    const barHeight = 14;

    this.energyBar.fillStyle(THEME.colors.background.int, 0.8);
    this.energyBar.fillRect(barX, barY, barWidth, barHeight);

    this.energyBar.lineStyle(1.5, THEME.colors.backgroundAlt.int, 1);
    this.energyBar.strokeRect(barX, barY, barWidth, barHeight);

    let color: number = THEME.colors.success.int;
    if (percentage < 0.35) {
      color = THEME.colors.danger.int;
    } else if (percentage < 0.65) {
      color = THEME.colors.warning.int;
    }

    const currentWidth = percentage * barWidth;
    const fillWidth = Math.max(2, currentWidth - 2);
    if (fillWidth > 0) {
      this.energyBar.fillStyle(color, 1);
      this.energyBar.fillRect(barX + 1, barY + 1, fillWidth, barHeight - 2);
    }

    const t = time ?? performance.now();
    if (percentage <= 0.10) {
      this.energyBar.setAlpha(Math.sin(t / 80) > 0 ? 1.0 : 0.3);
      this.energyBar.setScale(1.0);
      this.energyBar.setPosition(0, 0);
    } else if (percentage <= 0.25) {
      const scale = 1.0 + Math.sin(t / 150) * 0.08;
      this.energyBar.setAlpha(1.0);
      const centerX = barX + barWidth / 2;
      const centerY = barY + barHeight / 2;
      this.energyBar.setScale(scale);
      this.energyBar.setPosition(centerX * (1 - scale), centerY * (1 - scale));
    } else {
      this.energyBar.setAlpha(1.0);
      this.energyBar.setScale(1.0);
      this.energyBar.setPosition(0, 0);
    }
  }

  public cleanup(): void {
    // Phaser cleans up game objects on scene shutdown
  }
}
