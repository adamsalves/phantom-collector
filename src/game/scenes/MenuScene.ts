import Phaser from 'phaser';
import { soundManager } from '../audio/SoundGenerator';
import { THEME } from '../utils/theme';

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
      color: THEME.colors.primary.hex
    }).setOrigin(0.5).setShadow(0, 0, THEME.colors.accent.hex, 10, true, true);

    this.add.text(width / 2, height / 3 + 50, 'THE COLLECTOR', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '20px',
      color: THEME.colors.accent.hex
    }).setOrigin(0.5).setShadow(0, 0, THEME.colors.primary.hex, 6, true, true);

    // Instruções Retro
    this.add.text(width / 2, height * 0.6, 'USE ARROW KEYS TO MOVE\nCOLLECT GOLD TO SURVIVE\nAVOID THE GHOSTS!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: THEME.colors.neutral.white.hex,
      align: 'center',
      lineSpacing: 10
    }).setOrigin(0.5);

    // Botão de Iniciar Jogo
    this.startBtn = this.add.text(width / 2, height * 0.78, 'INSERT COIN / START', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '16px',
      color: THEME.colors.success.hex
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setShadow(0, 0, THEME.colors.success.hex, 5, true, true);

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
      this.startBtn.setColor(THEME.colors.accent.hex);
      this.startBtn.setShadow(0, 0, THEME.colors.accent.hex, 12, true, true);
    });

    this.startBtn.on('pointerout', () => {
      this.startBtn.setColor(THEME.colors.success.hex);
      this.startBtn.setShadow(0, 0, THEME.colors.success.hex, 5, true, true);
    });

    // Botão de High Scores
    this.highScoresBtn = this.add.text(width / 2, height * 0.88, 'HIGH SCORES', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: THEME.colors.warning.hex
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setShadow(0, 0, THEME.colors.warning.hex, 4, true, true);

    this.highScoresBtn.on('pointerdown', () => {
      soundManager.playPowerup();
      this.scene.start('RankingScene', { highlightScore: 0 });
    });

    this.highScoresBtn.on('pointerover', () => {
      this.highScoresBtn.setColor(THEME.colors.primary.hex);
      this.highScoresBtn.setShadow(0, 0, THEME.colors.primary.hex, 10, true, true);
    });

    this.highScoresBtn.on('pointerout', () => {
      this.highScoresBtn.setColor(THEME.colors.warning.hex);
      this.highScoresBtn.setShadow(0, 0, THEME.colors.warning.hex, 4, true, true);
    });
  }

  private createRetroGrid(width: number, height: number): void {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, THEME.colors.backgroundAlt.int, 0.4);

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
