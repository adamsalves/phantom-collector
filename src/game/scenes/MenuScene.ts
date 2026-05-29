import Phaser from 'phaser';
import { soundManager } from '../audio/SoundGenerator';

export class MenuScene extends Phaser.Scene {
  private startBtn!: Phaser.GameObjects.Text;
  private highScoresBtn!: Phaser.GameObjects.Text;

  constructor() {
    super('MenuScene');
  }

  public create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Efeito de Fundo: Grid retrô sci-fi clássico desenhado na tela
    this.createRetroGrid(width, height);

    // Título Principal
    this.add.text(width / 2, height / 3, 'PHANTOM', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '46px',
      color: '#00f0ff'
    }).setOrigin(0.5).setShadow(0, 0, '#ff007f', 10, true, true);

    this.add.text(width / 2, height / 3 + 50, 'THE COLLECTOR', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '20px',
      color: '#ff007f'
    }).setOrigin(0.5).setShadow(0, 0, '#00f0ff', 6, true, true);

    // Instruções Retro
    this.add.text(width / 2, height * 0.6, 'USE ARROW KEYS TO MOVE\nCOLLECT GOLD TO SURVIVE\nAVOID THE GHOSTS!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 10
    }).setOrigin(0.5);

    // Botão de Iniciar Jogo
    this.startBtn = this.add.text(width / 2, height * 0.78, 'INSERT COIN / START', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '16px',
      color: '#39ff14'
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setShadow(0, 0, '#39ff14', 5, true, true);

    // Efeito de pulso no texto START
    this.tweens.add({
      targets: this.startBtn,
      alpha: { from: 1, to: 0.3 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // Ações de clique e hover
    this.startBtn.on('pointerdown', () => {
      soundManager.playPowerup(); // Efeito chiptune ao iniciar
      this.scene.start('PlayScene', { score: 0, level: 1 });
    });

    this.startBtn.on('pointerover', () => {
      this.startBtn.setColor('#ff007f');
      this.startBtn.setShadow(0, 0, '#ff007f', 12, true, true);
    });

    this.startBtn.on('pointerout', () => {
      this.startBtn.setColor('#39ff14');
      this.startBtn.setShadow(0, 0, '#39ff14', 5, true, true);
    });

    // Botão de High Scores
    this.highScoresBtn = this.add.text(width / 2, height * 0.88, 'HIGH SCORES', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#ffd700'
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setShadow(0, 0, '#ffd700', 4, true, true);

    this.highScoresBtn.on('pointerdown', () => {
      soundManager.playPowerup();
      this.scene.start('RankingScene', { highlightScore: 0 });
    });

    this.highScoresBtn.on('pointerover', () => {
      this.highScoresBtn.setColor('#00f0ff');
      this.highScoresBtn.setShadow(0, 0, '#00f0ff', 10, true, true);
    });

    this.highScoresBtn.on('pointerout', () => {
      this.highScoresBtn.setColor('#ffd700');
      this.highScoresBtn.setShadow(0, 0, '#ffd700', 4, true, true);
    });
  }

  private createRetroGrid(width: number, height: number): void {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x2d124d, 0.4);

    // Linhas verticais
    for (let x = 0; x < width; x += 30) {
      graphics.lineBetween(x, 0, x, height);
    }
    // Linhas horizontais com perspectiva simulada
    for (let y = 0; y < height; y += 20) {
      graphics.lineBetween(0, y, width, y);
    }
  }

}
