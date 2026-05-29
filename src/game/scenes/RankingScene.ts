import Phaser from 'phaser';
import { RankingManager, RankingEntry } from '../ranking/RankingManager';
import { soundManager } from '../audio/SoundGenerator';

interface RankingSceneData {
  highlightScore?: number;
}

export class RankingScene extends Phaser.Scene {
  private highlightScore: number = 0;
  private backBtn!: Phaser.GameObjects.Text;

  constructor() {
    super('RankingScene');
  }

  public init(data: RankingSceneData): void {
    this.highlightScore = data.highlightScore || 0;
  }

  public create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.createRetroGrid(width, height);

    this.add.text(width / 2, 30, 'HIGH SCORES', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '22px',
      color: '#ffd700'
    }).setOrigin(0.5).setShadow(0, 0, '#ffd700', 6, true, true);

    const entries = RankingManager.getScores();

    if (entries.length === 0) {
      this.add.text(width / 2, height / 2, 'NO SCORES YET', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '14px',
        color: '#666666'
      }).setOrigin(0.5);
    } else {
      this.renderRankingEntries(entries, width);
    }

    this.backBtn = this.add.text(width / 2, height - 30, 'BACK TO MENU', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#ff007f'
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setShadow(0, 0, '#ff007f', 6, true, true);

    this.tweens.add({
      targets: this.backBtn,
      alpha: { from: 1, to: 0.4 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    this.backBtn.on('pointerdown', () => {
      soundManager.playPowerup();
      this.scene.start('MenuScene');
    });

    this.backBtn.on('pointerover', () => {
      this.backBtn.setColor('#00f0ff');
      this.backBtn.setShadow(0, 0, '#00f0ff', 12, true, true);
    });

    this.backBtn.on('pointerout', () => {
      this.backBtn.setColor('#ff007f');
      this.backBtn.setShadow(0, 0, '#ff007f', 6, true, true);
    });
  }

  private renderRankingEntries(entries: RankingEntry[], width: number): void {
    const startY = 68;
    const rowHeight = 28;

    for (let i = 0; i < 10; i++) {
      const y = startY + i * rowHeight;
      const isHighlight = this.highlightScore > 0 && entries[i] && entries[i].score === this.highlightScore;
      const color = isHighlight ? '#00f0ff' : (entries[i] ? '#ffffff' : '#444444');

      const rank = `#${String(i + 1).padStart(2, '0')}.`;
      const name = entries[i] ? entries[i].name.padEnd(12, ' ') : '---'.padEnd(12, ' ');
      const score = entries[i] ? String(entries[i].score).padStart(6, '0') : '------';

      this.add.text(width / 2, y, `${rank}  ${name}${score}`, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '12px',
        color
      }).setOrigin(0.5);
    }
  }

  private createRetroGrid(width: number, height: number): void {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x2d124d, 0.4);

    for (let x = 0; x < width; x += 30) {
      graphics.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y < height; y += 20) {
      graphics.lineBetween(0, y, width, y);
    }
  }
}
