import Phaser from 'phaser';
import { soundManager } from '../audio/SoundGenerator';

interface PlaySceneData {
  score: number;
  level: number;
}

interface PowerUp {
  sprite: Phaser.Physics.Arcade.Sprite;
  type: 'speed' | 'shield' | 'magnet' | 'phase';
}

export class PlayScene extends Phaser.Scene {
  // Entidades
  private player!: Phaser.Physics.Arcade.Sprite;
  private coin!: Phaser.Physics.Arcade.Sprite;
  private enemies!: Phaser.Physics.Arcade.Group;
  private activePowerUp: PowerUp | null = null;

  // Lógica de Estado
  private score: number = 0;
  private level: number = 1;
  private energy: number = 100;
  private maxEnergy: number = 100;
  
  // Power-up ativo no jogador
  private activePowerUpType: 'speed' | 'shield' | 'magnet' | 'phase' | null = null;
  private powerUpTimeLeft: number = 0;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  // UI (HUD)
  private scoreText!: Phaser.GameObjects.Text;
  private energyBar!: Phaser.GameObjects.Graphics;
  private powerUpText!: Phaser.GameObjects.Text;

  // Estado do overlay inicial de level
  private overlayActive: boolean = true;

  // Dificuldade e Balanço por Nível
  private energyDecayRate: number = 0.15; // Energia perdida por frame/ciclo
  private playerBaseSpeed: number = 220;
  private levelGoals: number[] = [10, 15, 20]; // Qtd de moedas para passar de fase

  constructor() {
    super('PlayScene');
  }

  public init(data: PlaySceneData): void {
    this.score = data.score || 0;
    this.level = data.level || 1;
    this.energy = 100;
    this.activePowerUpType = null;
    this.powerUpTimeLeft = 0;
    this.overlayActive = true;

    // Aumenta a dificuldade com o nível
    this.energyDecayRate = 0.12 + this.level * 0.06;
  }

  public create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 1. Limites Físicos do Mundo do Phaser
    this.physics.world.setBounds(0, 50, width, height - 50);

    // 2. Elemento de Fundo: Grid Neon sutil
    this.add.grid(width / 2, height / 2 + 25, width, height - 50, 40, 40, 0x1a0933, 0.5, 0x2d124d, 0.3);

    // 3. Player (Phantom)
    this.player = this.physics.add.sprite(width / 2, height / 2, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDrag(400, 400); // Adiciona inércia e deslize suave nas paradas

    // 4. Coin (Moeda Dourada)
    this.coin = this.physics.add.sprite(300, 200, 'coin');
    this.coin.setBounce(0.4, 0.4);
    this.coin.setCollideWorldBounds(true);
    this.spawnCoinRandomly();

    // Animação cíclica sutil na moeda
    this.tweens.add({
      targets: this.coin,
      y: '+=8',
      yoyo: true,
      repeat: -1,
      duration: 600,
      ease: 'Sine.easeInOut'
    });

    // 5. Grupo de Inimigos (Bats/Ghosts)
    this.enemies = this.physics.add.group();
    this.spawnEnemies();

    // 6. Configuração dos Controles (Teclas de seta e WASD)
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
    }

    // 7. Configuração de HUD (Tailwind ou texto estilizado Phaser com press start 2p)
    this.createHUD();

    // 8. Agendamento para Spawn Esporádico de Power-ups (a cada 12 segundos)
    this.time.addEvent({
      delay: 12000,
      callback: this.spawnPowerUp,
      callbackScope: this,
      loop: true
    });

    // 9. Colisões Persistentes (Phaser colliders otimizados)
    this.setupColliders();

    // 10. Tela Inicial de Foco
    this.flashLevelOverlay();
  }

  private setupColliders(): void {
    this.physics.add.overlap(this.player, this.coin, () => {
      this.handleCoinCollection();
    }, undefined, this);

    this.physics.add.overlap(this.player, this.enemies, () => {
      if (this.activePowerUpType !== 'shield') {
        this.handlePlayerHurt();
      }
    }, undefined, this);
  }

  public update(_time: number, delta: number): void {
    // A. Atualiza energia (apenas quando o overlay inicial já fechou)
    if (this.energy > 0 && !this.overlayActive) {
      this.energy -= this.energyDecayRate * (delta / 16.666);
      this.drawEnergyBar();

      if (this.energy <= 0) {
        this.energy = 0;
        this.triggerGameOver();
        return;
      }
    }

    // Se o overlay inicial ainda está ativo, não processa gameplay
    if (this.overlayActive) return;

    // B. Movimentação do Player
    this.handlePlayerMovement();

    // C. IA de Inimigos
    this.handleEnemiesAI();

    // D. Atração do Ímã de Moedas (se ativo)
    if (this.activePowerUpType === 'magnet') {
      this.handleMagnetEffect();
    }

    // E. Wrap Fantasma (Phase) — atravessa paredes e surge do lado oposto
    if (this.activePowerUpType === 'phase') {
      this.handlePhaseWrap();
    }

    // F. Gerenciamento de Duração do Power-Up
    if (this.activePowerUpType && this.powerUpTimeLeft > 0) {
      this.powerUpTimeLeft -= delta;
      const secondsLeft = Math.ceil(this.powerUpTimeLeft / 1000);
      this.powerUpText.setText(`[${this.activePowerUpType.toUpperCase()}: ${secondsLeft}S]`);
      
      if (this.activePowerUpType === 'shield' && secondsLeft <= 2) {
        this.player.setAlpha(Math.sin(_time / 50) > 0 ? 1 : 0.4);
      }

      if (this.powerUpTimeLeft <= 0) {
        this.deactivatePowerUp();
      }
    }

    // G. Colisão Player <-> Power-up ativo na cena
    if (this.activePowerUp) {
      if (this.physics.overlap(this.player, this.activePowerUp.sprite)) {
        this.handlePowerUpCollection();
      }
    }
  }

  private handlePlayerMovement(): void {
    let speed = this.playerBaseSpeed;

    // Dobra a velocidade se tiver Speed Boots
    if (this.activePowerUpType === 'speed') {
      speed *= 1.6;
      
      // Adiciona mini-rastro estético (particles retro)
      if (Math.random() < 0.25) {
        const trail = this.add.sprite(this.player.x, this.player.y, 'player');
        trail.setAlpha(0.4);
        trail.setTint(0x00f0ff);
        this.tweens.add({
          targets: trail,
          alpha: 0,
          scale: 0.5,
          duration: 300,
          onComplete: () => trail.destroy()
        });
      }
    }

    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown) {
      vx = -speed;
    } else if (this.cursors.right.isDown) {
      vx = speed;
    }

    if (this.cursors.up.isDown) {
      vy = -speed;
    } else if (this.cursors.down.isDown) {
      vy = speed;
    }

    // Normaliza velocidade diagonal para evitar movimento mais rápido
    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    this.player.setVelocity(vx, vy);
  }

  private handleEnemiesAI(): void {
    this.enemies.getChildren().forEach((enemyObject) => {
      const enemy = enemyObject as Phaser.Physics.Arcade.Sprite;
      const enemyBody = enemy.body as Phaser.Physics.Arcade.Body;
      if (!enemyBody) return;
      
      // Inteligência de Perseguição no Level 3 (Somente para o primeiro inimigo para equilibrar a jogabilidade)
      if (this.level === 3 && enemy.name === 'stalker') {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        const chaseSpeed = 110;
        this.physics.velocityFromRotation(angle, chaseSpeed, enemyBody.velocity);
      } else {
        // Movimento retilíneo padrão com ricochete
        // Se a velocidade cair por colisão, restaura
        if (enemyBody.velocity.length() < 50) {
          const angle = Phaser.Math.Between(0, 360) * (Math.PI / 180);
          this.physics.velocityFromRotation(angle, 100 + this.level * 20, enemyBody.velocity);
        }
      }
    });
  }

  private handlePhaseWrap(): void {
    const { width, height } = this.cameras.main;

    if (this.player.x < -16) {
      this.player.x = width + 16;
    } else if (this.player.x > width + 16) {
      this.player.x = -16;
    }

    if (this.player.y < 34) {
      this.player.y = height + 16;
    } else if (this.player.y > height + 16) {
      this.player.y = 34;
    }
  }

  private handleMagnetEffect(): void {
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.coin.x, this.coin.y);
    // Alcance do magnetismo: 180px
    if (dist < 180) {
      const coinBody = this.coin.body as Phaser.Physics.Arcade.Body;
      if (!coinBody) return;
      const angle = Phaser.Math.Angle.Between(this.coin.x, this.coin.y, this.player.x, this.player.y);
      const pullForce = 350;
      this.physics.velocityFromRotation(angle, pullForce, coinBody.velocity);
    }
  }

  private handleCoinCollection(): void {
    soundManager.playCoin();

    // Tweens divertidos de feedback
    this.tweens.add({
      targets: this.player,
      scaleX: 1.25,
      scaleY: 1.25,
      duration: 120,
      yoyo: true,
      ease: 'Quad.easeInOut'
    });

    // Score e Recuperação de energia ectoplásmica
    this.score += 10;
    this.energy = Math.min(this.maxEnergy, this.energy + 20); // Recupera 20%
    
    // Atualiza HUD
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.drawEnergyBar();

    // Verifica vitória ou passagem de fase
    const goal = this.levelGoals[this.level - 1];
    const coinsCollected = this.score / 10;

    if (coinsCollected >= goal) {
      this.triggerLevelComplete();
    } else {
      this.spawnCoinRandomly();
    }
  }

  private handlePlayerHurt(): void {
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    if (!playerBody) return;

    // Reduz drasticamente a energia ectoplásmica
    this.energy = Math.max(0, this.energy - 30);
    soundManager.playHurt();

    // Efeito visual dramático retrô: Tela pisca em vermelho, jogador brilha
    this.cameras.main.flash(200, 255, 0, 0);
    
    // Pequeno ricochete / repulsão do player
    const randomAngle = Phaser.Math.Between(0, 360) * (Math.PI / 180);
    this.physics.velocityFromRotation(randomAngle, 300, playerBody.velocity);

    // Torna o player invencível temporariamente para evitar hit instantâneo em cadeia
    this.activePowerUpType = 'shield';
    this.powerUpTimeLeft = 1200; // 1.2 segundos de invencibilidade grátis após dano
    this.powerUpText.setText('[INVENCIBLE!]');
    this.player.setTint(0xff0055);
  }

  private handlePowerUpCollection(): void {
    if (!this.activePowerUp) return;

    soundManager.playPowerup();
    const type = this.activePowerUp.type;

    // Destrói o sprite na tela
    this.activePowerUp.sprite.destroy();
    this.activePowerUp = null;

    // Ativa power-up no jogador
    this.activePowerUpType = type;
    this.player.setAlpha(1);

    if (type === 'speed') {
      this.powerUpTimeLeft = 6000; // 6 segundos
      this.player.setTint(0x00f0ff); // Coloração neon ciano
      this.showFloatyText(this.player.x, this.player.y - 30, 'SPEED BOOTS!', '#00f0ff');
    } else if (type === 'shield') {
      this.powerUpTimeLeft = 5000; // 5 segundos
      this.player.setTint(0xff007f); // Coloração neon rosa
      this.showFloatyText(this.player.x, this.player.y - 30, 'ECTO SHIELD!', '#ff007f');
    } else if (type === 'magnet') {
      this.powerUpTimeLeft = 8000; // 8 segundos
      this.player.setTint(0x39ff14); // Coloração neon verde
      this.showFloatyText(this.player.x, this.player.y - 30, 'GOLD MAGNET!', '#39ff14');
    } else if (type === 'phase') {
      this.powerUpTimeLeft = 7000; // 7 segundos
      this.player.setTint(0xaa00ff); // Coloração roxo fantasma
      this.player.setAlpha(0.7);
      this.player.setCollideWorldBounds(false); // Atravessa paredes
      this.showFloatyText(this.player.x, this.player.y - 30, 'PHASE SHIFT!', '#aa00ff');
    }
  }

  private deactivatePowerUp(): void {
    if (this.activePowerUpType === 'phase') {
      this.player.setCollideWorldBounds(true);
    }
    this.activePowerUpType = null;
    this.powerUpText.setText('');
    this.player.clearTint();
    this.player.setAlpha(1);
  }

  private spawnCoinRandomly(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Evita spawn muito grudado nas bordas ou no centro de ação do player
    let rx = Phaser.Math.Between(50, width - 50);
    let ry = Phaser.Math.Between(100, height - 50);

    // Impede spawn imediato em cima do Phantom
    while (Phaser.Math.Distance.Between(rx, ry, this.player.x, this.player.y) < 120) {
      rx = Phaser.Math.Between(50, width - 50);
      ry = Phaser.Math.Between(100, height - 50);
    }

    this.coin.setPosition(rx, ry);
    this.coin.setVelocity(0, 0); // Zera velocidade magnética anterior
  }

  private spawnEnemies(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Número de inimigos baseado no nível: Level 1 (1 bat), Level 2 (2 bats), Level 3 (3 bats)
    const count = this.level;

    for (let i = 0; i < count; i++) {
      const rx = Phaser.Math.Between(50, width - 50);
      const ry = Phaser.Math.Between(100, height - 100);
      
      const enemy = this.enemies.create(rx, ry, 'enemy') as Phaser.Physics.Arcade.Sprite;
      enemy.setCollideWorldBounds(true);
      enemy.setBounce(1, 1); // Rebate perfeitamente nas bordas
      
      const enemyBody = enemy.body as Phaser.Physics.Arcade.Body;
      if (enemyBody) {
        // Velocidades variadas e ângulos aleatórios
        const baseSpeed = 90 + this.level * 25;
        const angle = Phaser.Math.Between(0, 360) * (Math.PI / 180);
        this.physics.velocityFromRotation(angle, baseSpeed, enemyBody.velocity);
      }

      // Nomeia o primeiro inimigo do Level 3 como 'stalker' para IA de perseguição
      if (this.level === 3 && i === 0) {
        enemy.setName('stalker');
        enemy.setTint(0xff00ff); // Coloração magenta diferenciada para avisar o jogador
      }
    }
  }

  private spawnPowerUp(): void {
    // Não spawna se já houver um na tela
    if (this.activePowerUp) return;

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const rx = Phaser.Math.Between(50, width - 50);
    const ry = Phaser.Math.Between(100, height - 100);

    const types: ('speed' | 'shield' | 'magnet' | 'phase')[] = ['speed', 'shield', 'magnet', 'phase'];
    const chosenType = types[Phaser.Math.Between(0, 3)];
    let textureKey = 'powerup_speed';
    if (chosenType === 'shield') textureKey = 'powerup_shield';
    if (chosenType === 'magnet') textureKey = 'powerup_magnet';
    if (chosenType === 'phase') textureKey = 'powerup_phase';

    const sprite = this.physics.add.sprite(rx, ry, textureKey);
    sprite.setCollideWorldBounds(true);

    this.activePowerUp = {
      sprite,
      type: chosenType
    };

    // Efeito de pulso no item do powerup
    this.tweens.add({
      targets: sprite,
      scaleX: 1.3,
      scaleY: 1.3,
      yoyo: true,
      repeat: -1,
      duration: 500
    });

    // Remove automaticamente o powerup após 7 segundos se não coletado
    this.time.delayedCall(7000, () => {
      if (this.activePowerUp && this.activePowerUp.sprite === sprite) {
        sprite.destroy();
        this.activePowerUp = null;
      }
    });
  }

  private createHUD(): void {
    // 1. Placar de Pontos
    this.scoreText = this.add.text(20, 15, `SCORE: ${this.score}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#ffffff'
    });

    // 2. Nível Atual
    this.add.text(175, 15, `LEVEL: ${this.level}/3`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#00f0ff'
    });

    // 3. Texto do Powerup ativo
    this.powerUpText = this.add.text(545, 15, '', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      color: '#ff007f'
    });

    // 4. Texto dinâmico 'ENERGY'
    this.add.text(330, 15, 'ENERGY:', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#39ff14'
    });

    // 5. Container Gráfico da Barra de Energia Ectoplásmica
    this.energyBar = this.add.graphics();
    this.drawEnergyBar();
  }

  private drawEnergyBar(): void {
    this.energyBar.clear();

    const barX = 425;
    const barY = 15;
    const barWidth = 100;
    const barHeight = 14;

    // Fundo da barra (bordas e preenchimento escuro)
    this.energyBar.fillStyle(0x0d041a, 0.8);
    this.energyBar.fillRect(barX, barY, barWidth, barHeight);
    
    this.energyBar.lineStyle(1.5, 0x2d124d, 1);
    this.energyBar.strokeRect(barX, barY, barWidth, barHeight);

    // Cor da energia ectoplásmica baseada no nível (Verde saudável, Amarela crítica, Vermelha morrendo)
    let color = 0x39ff14; // Verde
    if (this.energy < 35) {
      color = 0xff0055; // Vermelho
    } else if (this.energy < 65) {
      color = 0xffd700; // Amarelo
    }

    const currentWidth = (this.energy / this.maxEnergy) * barWidth;

    if (currentWidth > 0) {
      this.energyBar.fillStyle(color, 1);
      this.energyBar.fillRect(barX + 1, barY + 1, currentWidth - 2, barHeight - 2);
    }
  }

  private showFloatyText(x: number, y: number, text: string, color: string): void {
    const floaty = this.add.text(x, y, text, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color
    }).setOrigin(0.5);

    this.tweens.add({
      targets: floaty,
      y: y - 40,
      alpha: 0,
      duration: 1000,
      onComplete: () => floaty.destroy()
    });
  }

  private flashLevelOverlay(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x0d041a, 0.9);
    
    const text1 = this.add.text(width / 2, height / 2 - 30, `LEVEL ${this.level}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '24px',
      color: '#00f0ff'
    }).setOrigin(0.5);

    let scenarioName = 'THE CRYPTS';
    if (this.level === 2) scenarioName = 'THE HAUNTED DUNGEON';
    if (this.level === 3) scenarioName = 'PHANTOM\'S LAIR';

    const text2 = this.add.text(width / 2, height / 2 + 10, scenarioName, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#ff007f'
    }).setOrigin(0.5);

    const goal = this.levelGoals[this.level - 1];
    const text3 = this.add.text(width / 2, height / 2 + 50, `GOAL: COLLECT ${goal} COINS`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.overlayActive = true;
    this.physics.world.pause();

    this.time.delayedCall(2200, () => {
      overlay.destroy();
      text1.destroy();
      text2.destroy();
      text3.destroy();
      this.overlayActive = false;
      this.physics.world.resume();
    });
  }

  private triggerLevelComplete(): void {
    this.physics.world.pause();
    soundManager.playLevelClear();

    if (this.level < 3) {
      // Transiciona para a próxima fase carregando os mesmos dados e score acumulado
      this.scene.start('PlayScene', { score: this.score, level: this.level + 1 });
    } else {
      // Vitórias após passar as 3 fases!
      this.scene.start('VictoryScene', { score: this.score });
    }
  }

  private triggerGameOver(): void {
    this.physics.world.pause();
    soundManager.playGameOver();
    this.scene.start('GameOverScene', { score: this.score });
  }
}
