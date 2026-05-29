import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  public preload(): void {
    // Adiciona uma mensagem retro de loading no centro do canvas
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const loadingText = this.add.text(width / 2, height / 2 - 20, 'LOADING SYSTEM...', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '18px',
      color: '#00f0ff'
    }).setOrigin(0.5);

    const percentText = this.add.text(width / 2, height / 2 + 20, '0%', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#ff007f'
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      percentText.setText(`${Math.floor(value * 100)}%`);
    });

    this.load.on('complete', () => {
      loadingText.destroy();
      percentText.destroy();
    });

    // Carrega os assets estáticos da pasta public/assets
    this.load.image('player', 'assets/player.png');
    this.load.image('coin', 'assets/coin.png');
    
    // Assets auxiliares para efeitos de luz ou powerups desenhados programmaticamente
    // Criaremos texturas em runtime se precisarmos para evitar links estáticos quebrados
  }

  public create(): void {
    // Cria texturas dinâmicas em runtime para inimigos e powerups
    this.createDynamicTextures();

    // Transiciona para o Menu Inicial
    this.scene.start('MenuScene');
  }

  /**
   * Cria texturas básicas usando Canvas para evitar dependências de arquivos de imagem externos,
   * permitindo flexibilidade na adição de inimigos e powerups mantendo a estética neon retro.
   */
  private createDynamicTextures(): void {
    // 1. Textura do Morcego / Espectro Inimigo (Ectoplasma brilhante)
    if (!this.textures.exists('enemy')) {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Corpo fantasmagórico / Alienígena neon
        ctx.fillStyle = '#ff0055';
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 8;
        
        // Desenha um triângulo assustador estilizado retro
        ctx.beginPath();
        ctx.moveTo(16, 2);
        ctx.lineTo(30, 26);
        ctx.lineTo(24, 30);
        ctx.lineTo(16, 20);
        ctx.lineTo(8, 30);
        ctx.lineTo(2, 26);
        ctx.closePath();
        ctx.fill();

        // Olhos brilhantes neon ciano
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 4;
        ctx.fillRect(8, 12, 4, 4);
        ctx.fillRect(20, 12, 4, 4);
      }
      this.textures.addCanvas('enemy', canvas);
    }

    // 2. Textura do Power-Up de Velocidade (Speed Boots - Ciano brilhante)
    if (!this.textures.exists('powerup_speed')) {
      const canvas = document.createElement('canvas');
      canvas.width = 24;
      canvas.height = 24;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 6;
        
        // Raio retrô estilizado
        ctx.beginPath();
        ctx.moveTo(14, 2);
        ctx.lineTo(4, 12);
        ctx.lineTo(12, 12);
        ctx.lineTo(10, 22);
        ctx.lineTo(20, 12);
        ctx.lineTo(12, 12);
        ctx.closePath();
        ctx.fill();
      }
      this.textures.addCanvas('powerup_speed', canvas);
    }

    // 3. Textura do Power-Up de Escudo (Shield - Rosa brilhante)
    if (!this.textures.exists('powerup_shield')) {
      const canvas = document.createElement('canvas');
      canvas.width = 24;
      canvas.height = 24;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ff007f';
        ctx.shadowColor = '#ff007f';
        ctx.shadowBlur = 6;
        
        // Escudo estilizado retro
        ctx.beginPath();
        ctx.moveTo(12, 2);
        ctx.quadraticCurveTo(22, 2, 22, 10);
        ctx.quadraticCurveTo(22, 18, 12, 22);
        ctx.quadraticCurveTo(2, 18, 2, 10);
        ctx.quadraticCurveTo(2, 2, 12, 2);
        ctx.closePath();
        ctx.fill();
      }
      this.textures.addCanvas('powerup_shield', canvas);
    }

    // 4. Textura do Power-Up de Ímã (Magnet - Amarelo brilhante)
    if (!this.textures.exists('powerup_magnet')) {
      const canvas = document.createElement('canvas');
      canvas.width = 24;
      canvas.height = 24;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#39ff14';
        ctx.shadowColor = '#39ff14';
        ctx.shadowBlur = 6;
        
        // Ferradura/Ímã estilizado retro
        ctx.beginPath();
        ctx.arc(12, 10, 8, Math.PI, 0, false);
        ctx.lineTo(20, 20);
        ctx.lineTo(16, 20);
        ctx.lineTo(16, 12);
        ctx.arc(12, 12, 4, 0, Math.PI, true);
        ctx.lineTo(8, 20);
        ctx.lineTo(4, 20);
        ctx.closePath();
        ctx.fill();
      }
      this.textures.addCanvas('powerup_magnet', canvas);
    }

    // 5. Textura do Power-Up de Fase Fantasma (Phase - Roxo brilhante)
    if (!this.textures.exists('powerup_phase')) {
      const canvas = document.createElement('canvas');
      canvas.width = 24;
      canvas.height = 24;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#aa00ff';
        ctx.shadowColor = '#aa00ff';
        ctx.shadowBlur = 8;

        // Fantasma/Portal estilizado retro
        ctx.beginPath();
        ctx.arc(12, 8, 7, Math.PI, 0, false);
        ctx.lineTo(19, 20);
        ctx.lineTo(15, 18);
        ctx.lineTo(12, 22);
        ctx.lineTo(9, 18);
        ctx.lineTo(5, 20);
        ctx.closePath();
        ctx.fill();

        // Olhos brilhantes
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 2;
        ctx.fillRect(9, 6, 3, 4);
        ctx.fillRect(14, 6, 3, 4);
      }
      this.textures.addCanvas('powerup_phase', canvas);
    }
  }
}
