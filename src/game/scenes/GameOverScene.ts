import Phaser from 'phaser';
import { soundManager } from '../audio/SoundGenerator';
import { RankingManager } from '../ranking/RankingManager';
import { showNameInput } from '../ranking/NameInput';
import { THEME } from '../utils/theme';

interface GameOverData {
  score: number;
}

export class GameOverScene extends Phaser.Scene {
  private finalScore: number = 0;
  private retryBtn!: Phaser.GameObjects.Text;
  private rankingBtn!: Phaser.GameObjects.Text;

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
    this.add.grid(width / 2, height / 2, width, height, 40, 40, THEME.colors.grid.int, 0.4, THEME.colors.danger.int, 0.15);

    // Título Principal Game Over piscando em vermelho neon
    const titleText = this.add.text(width / 2, height / 3, 'GAME OVER', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '44px',
      color: THEME.colors.danger.hex
    }).setOrigin(0.5).setShadow(0, 0, THEME.colors.danger.hex, 12, true, true);

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
      color: THEME.colors.neutral.white.hex
    }).setOrigin(0.5);

    // Salva score se for high score (input customizado dentro do canvas)
    if (RankingManager.isHighScore(this.finalScore) && this.finalScore > 0) {
      showNameInput(this).then((name) => {
        if (name !== null) {
          RankingManager.saveScore(name, this.finalScore);
        }
      });
    }

    // Dica ou frase motivacional retrô
    this.add.text(width / 2, height * 0.6, 'YOUR ENERGY SPIRIT HAS FADED...', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: THEME.colors.accent.hex
    }).setOrigin(0.5);

    // Botão de Reinício
    this.retryBtn = this.add.text(width / 2, height * 0.78, 'TRY AGAIN / CONTINUE', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '16px',
      color: THEME.colors.primary.hex
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setShadow(0, 0, THEME.colors.primary.hex, 6, true, true);

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
      this.retryBtn.setColor(THEME.colors.accent.hex);
      this.retryBtn.setShadow(0, 0, THEME.colors.accent.hex, 12, true, true);
    });

    this.retryBtn.on('pointerout', () => {
      this.retryBtn.setColor(THEME.colors.primary.hex);
      this.retryBtn.setShadow(0, 0, THEME.colors.primary.hex, 6, true, true);
    });

    // Botão de High Scores
    this.rankingBtn = this.add.text(width / 2, height * 0.88, 'VIEW HIGH SCORES', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      color: THEME.colors.warning.hex
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setShadow(0, 0, THEME.colors.warning.hex, 4, true, true);

    this.rankingBtn.on('pointerdown', () => {
      soundManager.playPowerup();
      this.scene.start('RankingScene', { highlightScore: this.finalScore });
    });

    this.rankingBtn.on('pointerover', () => {
      this.rankingBtn.setColor(THEME.colors.primary.hex);
      this.rankingBtn.setShadow(0, 0, THEME.colors.primary.hex, 10, true, true);
    });

    this.rankingBtn.on('pointerout', () => {
      this.rankingBtn.setColor(THEME.colors.warning.hex);
      this.rankingBtn.setShadow(0, 0, THEME.colors.warning.hex, 4, true, true);
    });
  }
}
