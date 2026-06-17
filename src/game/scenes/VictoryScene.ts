import Phaser from 'phaser';
import { soundManager } from '../audio/SoundGenerator';
import { RankingManager } from '../ranking/RankingManager';
import { showNameInput } from '../ranking/NameInput';

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
    this.add.grid(width / 2, height / 2, width, height, 40, 40, 0x1a0933, 0.4, 0x39ff14, 0.15);

    // Partículas dinâmicas e coloridas retro-neon caindo (simulando confete pixel art)
    this.createRetroConfetti(width, height);

    // Título Principal de Vitória piscando em dourado/verde neon
    const titleText = this.add.text(width / 2, height / 3, 'VICTORY!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '44px',
      color: '#ffd700'
    }).setOrigin(0.5).setShadow(0, 0, '#39ff14', 12, true, true);

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
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 10, `SURVIVAL BONUS: +${survivalBonus}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#00f0ff'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 45, `TOTAL SCORE: ${totalScore}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '18px',
      color: '#39ff14'
    }).setOrigin(0.5).setShadow(0, 0, '#39ff14', 4, true, true);

    // Mensagem de fim de jogo — aparece após name input
    const endGameContainer = this.add.container(width / 2, 0);
    endGameContainer.setAlpha(0);

    endGameContainer.add(
      this.add.text(0, height * 0.66, 'YOU COLLECTED THEM ALL!', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '9px',
        color: '#ffffff'
      }).setOrigin(0.5)
    );

    endGameContainer.add(
      this.add.text(0, height * 0.72, 'THE PHANTOM IS FREE.', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#39ff14'
      }).setOrigin(0.5)
    );

    const trickText = this.add.text(0, height * 0.80, '* ask the dev for more levels *', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '7px',
      color: '#666680'
    }).setOrigin(0.5);

    endGameContainer.add(trickText);

    this.tweens.add({
      targets: trickText,
      alpha: { from: 0.3, to: 1 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Botões — aparecem após name input
    const buttonsContainer = this.add.container(width / 2, 0);
    buttonsContainer.setAlpha(0);

    this.menuBtn = this.add.text(0, height * 0.78, 'RETURN TO MAIN MENU', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#ff007f'
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setShadow(0, 0, '#ff007f', 6, true, true);

    this.tweens.add({
      targets: this.menuBtn,
      alpha: { from: 1, to: 0.4 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    this.menuBtn.on('pointerdown', () => {
      soundManager.playPowerup();
      this.scene.start('MenuScene');
    });

    this.menuBtn.on('pointerover', () => {
      this.menuBtn.setColor('#00f0ff');
      this.menuBtn.setShadow(0, 0, '#00f0ff', 12, true, true);
    });

    this.menuBtn.on('pointerout', () => {
      this.menuBtn.setColor('#ff007f');
      this.menuBtn.setShadow(0, 0, '#ff007f', 6, true, true);
    });

    this.rankingBtn = this.add.text(0, height * 0.86, 'VIEW HIGH SCORES', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      color: '#ffd700'
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setShadow(0, 0, '#ffd700', 4, true, true);

    this.rankingBtn.on('pointerdown', () => {
      soundManager.playPowerup();
      this.scene.start('RankingScene', { highlightScore: totalScore });
    });

    this.rankingBtn.on('pointerover', () => {
      this.rankingBtn.setColor('#00f0ff');
      this.rankingBtn.setShadow(0, 0, '#00f0ff', 10, true, true);
    });

    this.rankingBtn.on('pointerout', () => {
      this.rankingBtn.setColor('#ffd700');
      this.rankingBtn.setShadow(0, 0, '#ffd700', 4, true, true);
    });

    buttonsContainer.add([this.menuBtn, this.rankingBtn]);

    // Fluxo: name input (se high score) -> fim de jogo + botões
    const showEndScreen = (): void => {
      this.tweens.add({
        targets: [endGameContainer, buttonsContainer],
        alpha: 1,
        duration: 800,
        ease: 'Sine.easeIn'
      });
    };

    if (RankingManager.isHighScore(totalScore) && totalScore > 0) {
      showNameInput(this).then((name) => {
        if (name !== null) {
          RankingManager.saveScore(name, totalScore);
        }
        showEndScreen();
      });
    } else {
      showEndScreen();
    }
  }

  private createRetroConfetti(width: number, height: number): void {
    const colors = [0xff007f, 0x00f0ff, 0x39ff14, 0xffd700];
    
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
