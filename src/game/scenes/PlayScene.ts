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
  private droppedPowerUp: PowerUp | null = null;

  // Lógica de Estado
  private score: number = 0;
  private level: number = 1;
  private energy: number = 100;
  private maxEnergy: number = 100;
  
  // Power-up ativo no jogador
  private activeEffect: 'speed' | 'shield' | 'magnet' | 'phase' | null = null;
  private powerUpTimeLeft: number = 0;
  private isHurtInvincible: boolean = false;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  // UI (HUD)
  private scoreText!: Phaser.GameObjects.Text;
  private energyBar!: Phaser.GameObjects.Graphics;
  private powerUpText!: Phaser.GameObjects.Text;

  // Estado do overlay inicial de level
  private overlayActive: boolean = true;

  // Gatilhos de power-up por contexto
  private coinsInLevel: number = 0;
  private energyCrisisTriggered: boolean = false;
  private manyEnemiesTriggered: boolean = false;

  // Dificuldade e Balanço por Nível
  private energyDecayRate: number = 0.15;
  private playerBaseSpeed: number = 220;
  private powerUpSpawnDelay: number = 12000;

  constructor() {
    super('PlayScene');
  }

  public init(data: PlaySceneData): void {
    this.score = data.score || 0;
    this.level = data.level || 1;
    this.energy = 100;
    this.activeEffect = null;
    this.powerUpTimeLeft = 0;
    this.isHurtInvincible = false;
    this.overlayActive = true;
    this.droppedPowerUp = null;
    this.coinsInLevel = 0;
    this.energyCrisisTriggered = false;
    this.manyEnemiesTriggered = false;

    this.energyDecayRate = this.getEnergyDecay();
    this.powerUpSpawnDelay = this.getPowerUpDelay();
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

    // 8. Agendamento para Spawn Esporádico de Power-ups (delay dinâmico por nível)
    this.time.addEvent({
      delay: this.powerUpSpawnDelay,
      callback: this.spawnPowerUp,
      callbackScope: this,
      loop: true
    });

    // 9. Welcome pack — primeiro power-up mais cedo
    this.time.delayedCall(this.level === 1 ? 5000 : 8000, () => {
      if (!this.droppedPowerUp) this.spawnPowerUp();
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
      if (this.activeEffect !== 'shield') {
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

    // D. Gatilhos contextuais de power-up
    this.checkPowerUpTriggers();

    // E. Atração do Ímã de Moedas (se ativo)
    if (this.activeEffect === 'magnet') {
      this.handleMagnetEffect();
    }

    // E. Wrap Fantasma (Phase) — atravessa paredes e surge do lado oposto
    if (this.activeEffect === 'phase') {
      this.handlePhaseWrap();
    }

    // F. Gerenciamento de Duração do Power-Up
    if (this.activeEffect && this.powerUpTimeLeft > 0) {
      this.powerUpTimeLeft -= delta;
      const secondsLeft = Math.ceil(this.powerUpTimeLeft / 1000);
      this.powerUpText.setText(`[${this.activeEffect.toUpperCase()}: ${secondsLeft}S]`);
      
      if (this.activeEffect === 'shield' && secondsLeft <= 2) {
        this.player.setAlpha(Math.sin(_time / 50) > 0 ? 1 : 0.4);
      }

      if (this.powerUpTimeLeft <= 0) {
        this.deactivatePowerUp();
      }
    }

    // G. Colisão Player <-> Power-up ativo na cena (ignorado durante invencibilidade pós-dano)
    if (this.droppedPowerUp && !this.isHurtInvincible) {
      if (this.physics.overlap(this.player, this.droppedPowerUp.sprite)) {
        this.handlePowerUpCollection();
      }
    }
  }

  private handlePlayerMovement(): void {
    let speed = this.playerBaseSpeed;

    // Dobra a velocidade se tiver Speed Boots
    if (this.activeEffect === 'speed') {
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
      
      // Inteligência de Perseguição a cada 5 níveis (stalker)
      if (this.level % 5 === 0 && enemy.name === 'stalker') {
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

  private checkPowerUpTriggers(): void {
    if (this.droppedPowerUp) return;

    if (this.energy < 25 && !this.energyCrisisTriggered) {
      this.energyCrisisTriggered = true;
      if (Math.random() < 0.7) {
        this.spawnPowerUp('shield', 'speed');
        return;
      }
    }

    const aliveCount = this.enemies.countActive();
    if (aliveCount >= 5 && !this.manyEnemiesTriggered) {
      this.manyEnemiesTriggered = true;
      if (Math.random() < 0.6) {
        this.spawnPowerUp('phase', 'speed');
      }
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
    this.coinsInLevel++;

    // Gatilho de power-up a cada 3 moedas no level
    if (this.coinsInLevel % 3 === 0 && !this.droppedPowerUp) {
      this.spawnPowerUp();
    }

    // Atualiza HUD
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.drawEnergyBar();

    // Verifica vitória ou passagem de fase
    const goal = this.getLevelGoal();

    if (this.coinsInLevel >= goal) {
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
    this.activeEffect = 'shield';
    this.powerUpTimeLeft = 1200; // 1.2 segundos de invencibilidade grátis após dano
    this.isHurtInvincible = true;
    this.powerUpText.setText('[INVENCIBLE!]');
    this.player.setTint(0xff0055);
  }

  private handlePowerUpCollection(): void {
    if (!this.droppedPowerUp) return;

    soundManager.playPowerup();
    const type = this.droppedPowerUp.type;

    // Destrói o sprite na tela
    this.droppedPowerUp.sprite.destroy();
    this.droppedPowerUp = null;

    // Ativa power-up no jogador
    this.activeEffect = type;
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
    if (this.activeEffect === 'phase') {
      this.player.setCollideWorldBounds(true);
    }
    this.activeEffect = null;
    this.isHurtInvincible = false;
    this.powerUpText.setText('');
    this.player.clearTint();
    this.player.setAlpha(1);
  }

  private spawnCoinRandomly(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const margin = 30;
    const midX = width / 2;
    const midY = height / 2;

    // Determina quadrante do jogador
    const playerQx = this.player.x < midX ? 0 : 1;
    const playerQy = this.player.y < midY ? 0 : 1;

    // Escolhe quadrante diferente (NW, NE, SW, SE)
    let qx: number, qy: number;
    do {
      qx = Phaser.Math.Between(0, 1);
      qy = Phaser.Math.Between(0, 1);
    } while (qx === playerQx && qy === playerQy);

    const rx = Phaser.Math.Between(
      qx === 0 ? margin : midX + margin,
      qx === 0 ? midX - margin : width - margin
    );
    const ry = Phaser.Math.Between(
      qy === 0 ? 100 : midY + margin,
      qy === 0 ? midY - margin : height - margin
    );

    this.coin.setPosition(rx, ry);
    this.coin.setVelocity(0, 0);
  }

  private spawnEnemies(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Inimigos escalam com o nível até um máximo de 7 (padrão arcade)
    const count = this.getEnemyCount();

    for (let i = 0; i < count; i++) {
      const rx = Phaser.Math.Between(50, width - 50);
      const ry = Phaser.Math.Between(100, height - 100);
      
      const enemy = this.enemies.create(rx, ry, 'enemy') as Phaser.Physics.Arcade.Sprite;
      enemy.setCollideWorldBounds(true);
      enemy.setBounce(1, 1); // Rebate perfeitamente nas bordas
      
      const enemyBody = enemy.body as Phaser.Physics.Arcade.Body;
      if (enemyBody) {
        const baseSpeed = this.getEnemySpeed();
        const angle = Phaser.Math.Between(0, 360) * (Math.PI / 180);
        this.physics.velocityFromRotation(angle, baseSpeed, enemyBody.velocity);
      }

      // Stalker (IA de perseguição) a cada 5 níveis, apenas 1 por level
      if (this.level % 5 === 0 && i === 0) {
        enemy.setName('stalker');
        enemy.setTint(0xff00ff);
      }
    }
  }

  private spawnPowerUp(biasA?: 'speed' | 'shield' | 'magnet' | 'phase', biasB?: 'speed' | 'shield' | 'magnet' | 'phase'): void {
    if (this.droppedPowerUp) return;

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const rx = Phaser.Math.Between(50, width - 50);
    const ry = Phaser.Math.Between(100, height - 100);

    const chosenType = this.pickPowerUpType(biasA, biasB);
    let textureKey = 'powerup_speed';
    if (chosenType === 'shield') textureKey = 'powerup_shield';
    if (chosenType === 'magnet') textureKey = 'powerup_magnet';
    if (chosenType === 'phase') textureKey = 'powerup_phase';

    const sprite = this.physics.add.sprite(rx, ry, textureKey);
    sprite.setCollideWorldBounds(true);

    this.droppedPowerUp = {
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
      if (this.droppedPowerUp && this.droppedPowerUp.sprite === sprite) {
        sprite.destroy();
        this.droppedPowerUp = null;
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

    // 2. Nível Atual (endless — sem teto)
    this.add.text(175, 15, `LEVEL: ${this.level}`, {
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

    const fillWidth = Math.max(2, currentWidth - 2);
    if (fillWidth > 0) {
      this.energyBar.fillStyle(color, 1);
      this.energyBar.fillRect(barX + 1, barY + 1, fillWidth, barHeight - 2);
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

    const scenarioName = this.getScenarioName(this.level);

    const text2 = this.add.text(width / 2, height / 2 + 10, scenarioName, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#ff007f'
    }).setOrigin(0.5);

    const goal = this.getLevelGoal();
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

    this.scene.start('PlayScene', { score: this.score, level: this.level + 1 });
  }

  private triggerGameOver(): void {
    this.physics.world.pause();
    soundManager.playGameOver();
    this.scene.start('GameOverScene', { score: this.score });
  }

  private getLevelGoal(): number {
    return Math.min(10 + Math.floor(Math.pow(this.level, 0.7) * 4), 28);
  }

  private getEnemyCount(): number {
    return Math.min(1 + Math.floor(this.level / 2.5), 7);
  }

  private getEnemySpeed(): number {
    return Math.min(80 + this.level * 7, 200);
  }

  private getEnergyDecay(): number {
    return Math.min(0.10 + Math.sqrt(this.level) * 0.10, 0.55);
  }

  private getPowerUpDelay(): number {
    return Math.max(12000 - (this.level - 1) * 300, 5000);
  }

  private pickPowerUpType(
    biasA?: 'speed' | 'shield' | 'magnet' | 'phase',
    biasB?: 'speed' | 'shield' | 'magnet' | 'phase'
  ): 'speed' | 'shield' | 'magnet' | 'phase' {
    const all: ('speed' | 'shield' | 'magnet' | 'phase')[] = ['speed', 'shield', 'magnet', 'phase'];
    const pool = [...all];

    if (biasA) {
      pool.push(biasA, biasA);
    }
    if (biasB) {
      pool.push(biasB);
    }

    return Phaser.Math.RND.pick(pool);
  }

  private getScenarioName(level: number): string {
    const names = [
      'THE CRYPTS', 'THE HAUNTED DUNGEON', 'PHANTOM\'S LAIR',
      'THE DARK FOREST', 'THE ABANDONED MINE', 'THE SPECTRAL TOWER',
      'THE VOID GATE', 'THE ECHO CAVERNS', 'THE OBSIDIAN FORTRESS',
      'THE NEXUS'
    ];
    return names[(level - 1) % names.length];
  }
}
