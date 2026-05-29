import Phaser from 'phaser';
import { soundManager } from '../audio/SoundGenerator';

interface GameOverData {
  score: number;
}

export class GameOverScene extends Phaser.Scene {
  private finalScore: number = 0;
  private retryBtn!: Phaser.GameObjects.Text;

  constructor() {
    super('GameOverScene');
  }

  public init(data: GameOverData): void {
    this.finalScore = data.score || 0;
  }

  public create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Fundo de Grid sutil avermelhado (Dano/Derrota)
    this.add.grid(width / 2, height / 2, width, height, 40, 40, 0x1a0933, 0.4, 0xff0055, 0.15);

    // Título Principal Game Over piscando em vermelho neon
    const titleText = this.add.text(width / 2, height / 3, 'GAME OVER', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '44px',
      color: '#ff0055'
    }).setOrigin(0.5).setShadow(0, 0, '#ff0055', 12, true, true);

    // Efeito de pulso trêmulo retrô no título
    this.tweens.add({
      targets: titleText,
      scaleX: { from: 1, to: 1.05 },
      scaleY: { from: 1, to: 0.95 },
      duration: 150,
      yoyo: true,
      repeat: -1
    });

    // Score Final
    this.add.text(width / 2, height / 2, `FINAL SCORE: ${this.finalScore}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Dica ou frase motivacional retrô
    this.add.text(width / 2, height * 0.6, 'YOUR ENERGY SPIRIT HAS FADED...', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#ff007f'
    }).setOrigin(0.5);

    // Botão de Reinício
    this.retryBtn = this.add.text(width / 2, height * 0.78, 'TRY AGAIN / CONTINUE', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '16px',
      color: '#00f0ff'
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setShadow(0, 0, '#00f0ff', 6, true, true);

    // Efeito de pulso no botão
    this.tweens.add({
      targets: this.retryBtn,
      alpha: { from: 1, to: 0.4 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // Eventos do botão
    this.retryBtn.on('pointerdown', () => {
      soundManager.playPowerup();
      this.scene.start('PlayScene', { score: 0, level: 1 });
    });

    this.retryBtn.on('pointerover', () => {
      this.retryBtn.setColor('#ff007f');
      this.retryBtn.setShadow(0, 0, '#ff007f', 12, true, true);
    });

    this.retryBtn.on('pointerout', () => {
      this.retryBtn.setColor('#00f0ff');
      this.retryBtn.setShadow(0, 0, '#00f0ff', 6, true, true);
    });
  }
}
