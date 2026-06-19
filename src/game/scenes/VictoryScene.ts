import Phaser from 'phaser';
import { soundManager } from '../audio/SoundGenerator';
import { RankingManager } from '../ranking/RankingManager';
import { showNameInput } from '../ranking/NameInput';
import { THEME } from '../utils/theme';

interface VictoryData {
  score: number;
}

export class VictoryScene extends Phaser.Scene {
  private finalScore: number = 0;
  private menuBtn!: Phaser.GameObjects.Text;
  private rankingBtn!: Phaser.GameObjects.Text;

  constructor() {
    super('VictoryScene');
  }

  public init(data: VictoryData): void {
    this.finalScore = data.score || 0;
  }

  public create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Fundo de Grid sutil verde limão (Vitória)
    this.add.grid(width / 2, height / 2, width, height, 40, 40, THEME.colors.grid.int, 0.4, THEME.colors.success.int, 0.15);

    // Partículas dinâmicas e coloridas retro-neon caindo (simulando confete pixel art)
    this.createRetroConfetti(width, height);

    // Título Principal de Vitória piscando em dourado/verde neon
    const titleText = this.add.text(width / 2, height / 3, 'VICTORY!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '44px',
      color: THEME.colors.warning.hex
    }).setOrigin(0.5).setShadow(0, 0, THEME.colors.success.hex, 12, true, true);

    // Animação de flutuação vertical no título
    this.tweens.add({
      targets: titleText,
      y: '-=10',
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Score Final com cálculo de Bônus de Sobrevivência
    const survivalBonus = 500;
    const totalScore = this.finalScore + survivalBonus;

    this.add.text(width / 2, height / 2 - 20, `SCORE: ${this.finalScore}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: THEME.colors.neutral.white.hex
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 10, `SURVIVAL BONUS: +${survivalBonus}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: THEME.colors.primary.hex
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 45, `TOTAL SCORE: ${totalScore}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '18px',
      color: THEME.colors.success.hex
    }).setOrigin(0.5).setShadow(0, 0, THEME.colors.success.hex, 4, true, true);

    // Frase clássica de encerramento estilo arcade
    this.add.text(width / 2, height * 0.68, 'CONGRATULATIONS! YOU ARE THE SUPREME COLLECTOR!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: THEME.colors.neutral.white.hex
    }).setOrigin(0.5);

    // Salva score se for high score (input customizado dentro do canvas)
    if (RankingManager.isHighScore(totalScore) && totalScore > 0) {
      showNameInput(this).then((name) => {
        if (name !== null) {
          RankingManager.saveScore(name, totalScore);
        }
      });
    }

    // Botão de Menu Inicial
    this.menuBtn = this.add.text(width / 2, height * 0.78, 'RETURN TO MAIN MENU', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: THEME.colors.accent.hex
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setShadow(0, 0, THEME.colors.accent.hex, 6, true, true);

    // Efeito de pulso no botão
    this.tweens.add({
      targets: this.menuBtn,
      alpha: { from: 1, to: 0.4 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // Eventos do botão
    this.menuBtn.on('pointerdown', () => {
      soundManager.playPowerup();
      this.scene.start('MenuScene');
    });

    this.menuBtn.on('pointerover', () => {
      this.menuBtn.setColor(THEME.colors.primary.hex);
      this.menuBtn.setShadow(0, 0, THEME.colors.primary.hex, 12, true, true);
    });

    this.menuBtn.on('pointerout', () => {
      this.menuBtn.setColor(THEME.colors.accent.hex);
      this.menuBtn.setShadow(0, 0, THEME.colors.accent.hex, 6, true, true);
    });

    // Botão de High Scores
    this.rankingBtn = this.add.text(width / 2, height * 0.86, 'VIEW HIGH SCORES', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      color: THEME.colors.warning.hex
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setShadow(0, 0, THEME.colors.warning.hex, 4, true, true);

    this.rankingBtn.on('pointerdown', () => {
      soundManager.playPowerup();
      this.scene.start('RankingScene', { highlightScore: totalScore });
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

  private createRetroConfetti(width: number, height: number): void {
    const colors = [THEME.colors.accent.int, THEME.colors.primary.int, THEME.colors.success.int, THEME.colors.warning.int];
    
    for (let i = 0; i < 40; i++) {
      const rx = Phaser.Math.Between(0, width);
      const ry = Phaser.Math.Between(-100, -10);
      
      const confetti = this.add.rectangle(
        rx, 
        ry, 
        Phaser.Math.Between(4, 8), 
        Phaser.Math.Between(4, 8), 
        colors[Phaser.Math.Between(0, colors.length - 1)]
      );
      
      this.tweens.add({
        targets: confetti,
        y: height + 20,
        x: confetti.x + Phaser.Math.Between(-80, 80),
        angle: Phaser.Math.Between(0, 360),
        duration: Phaser.Math.Between(2000, 4000),
        delay: Phaser.Math.Between(0, 3000),
        ease: 'Quad.easeOut',
        onComplete: () => confetti.destroy()
      });
    }
  }
}
