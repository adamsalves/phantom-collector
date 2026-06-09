import Phaser from 'phaser';
import { soundManager } from '../audio/SoundGenerator';
import { getCoinValue, getCoinEnergy, pickCoinType } from '../utils/coinHelper';

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
  private hurtInvincibleTimer: Phaser.Time.TimerEvent | null = null;

  // Variedade de moedas (Spec 05)
  private coinType: 'gold' | 'silver' | 'rainbow' = 'gold';
  private rainbowTweenCounter: Phaser.Tweens.Tween | null = null;
  private coinParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  // Crise de Energia (Spec 02)
  private heartbeatAudio: { stop: () => void } | null = null;
  private heartbeatBpm: number | null = null;
  private nextFlashTime: number = 0;
  private nextShakeTime: number = 0;

  // Sistema de Pausa (Spec 03)
  private isPaused: boolean = false;
  private pauseOverlay: Phaser.GameObjects.Container | null = null;
  private pauseKey!: Phaser.Input.Keyboard.Key;

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
    this.coinType = 'gold';
    this.rainbowTweenCounter = null;
    this.coinParticles = null;
    this.heartbeatAudio = null;
    this.heartbeatBpm = null;
    this.nextFlashTime = 0;
    this.nextShakeTime = 0;
    this.isPaused = false;
    this.pauseOverlay = null;

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

    // Configura o emissor de partículas para moedas (Phaser 3)
    this.coinParticles = this.add.particles(0, 0, 'spark', {
      lifespan: 600,
      speed: { min: 40, max: 120 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 0.8, end: 0 },
      frequency: -1, // Emite apenas sob demanda (explodir)
      quantity: 12
    });
    this.coinParticles.setDepth(15);

    this.spawnCoinRandomly();

    // 5. Grupo de Inimigos (Bats/Ghosts)
    this.enemies = this.physics.add.group();
    this.spawnEnemies();

    // ESC para Pausa (Spec 03)
    if (this.input.keyboard) {
      this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      this.pauseKey.on('down', () => {
        this.togglePause();
      });
    }

    // Eventos de limpeza da cena (evitar vazamento de áudio/timers)
    this.events.once('shutdown', () => {
      this.cleanupScene();
    });
    this.events.once('destroy', () => {
      this.cleanupScene();
    });

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
      if (this.activeEffect !== 'shield' && !this.isHurtInvincible) {
        this.handlePlayerHurt();
      }
    }, undefined, this);
  }

  public update(_time: number, delta: number): void {
    // Se estiver pausado, não processa nada do update (Spec 03)
    if (this.isPaused) return;

    // A. Atualiza energia (apenas quando o overlay inicial já fechou)
    if (this.energy > 0 && !this.overlayActive) {
      this.energy -= this.energyDecayRate * (delta / 16.666);
      
      // Feedback de Energia Crítica (Spec 02)
      this.handleEnergyCrisisFeedback(_time);

      this.drawEnergyBar();

      if (this.energy <= 0) {
        this.energy = 0;
        this.stopHeartbeat();
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

    // F. Texto de Invencibilidade (sobrescreve o texto de power-up)
    if (this.isHurtInvincible) {
      this.powerUpText.setText('[INVENCIBLE!]');
    }

    // G. Gerenciamento de Duração do Power-Up
    if (this.activeEffect && this.powerUpTimeLeft > 0) {
      this.powerUpTimeLeft -= delta;
      const secondsLeft = Math.ceil(this.powerUpTimeLeft / 1000);

      if (!this.isHurtInvincible) {
        this.powerUpText.setText(`[${this.activeEffect.toUpperCase()}: ${secondsLeft}S]`);
      }

      if (this.activeEffect === 'shield' && secondsLeft <= 2) {
        this.player.setAlpha(Math.sin(_time / 50) > 0 ? 1 : 0.4);
      }

      if (this.powerUpTimeLeft <= 0) {
        this.deactivatePowerUp();
      }
    }

    // H. Colisão Player <-> Power-up ativo na cena
    if (this.droppedPowerUp) {
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
    // 1. Toca som e define os valores baseados no tipo (Spec 05)
    let scoreGain = getCoinValue(this.coinType);
    let energyGain = getCoinEnergy(this.coinType);
    let playerScale = 1.25;
    let floatyColor = '#ffd700';

    if (this.coinType === 'gold') {
      soundManager.playCoin();
      floatyColor = '#ffd700';
    } else if (this.coinType === 'silver') {
      soundManager.playCoinSilver();
      playerScale = 1.5;
      floatyColor = '#c0c0c0';

      // Partículas prateadas
      if (this.coinParticles) {
        this.coinParticles.setConfig({
          tint: 0xc0c0c0,
          scale: { start: 1.5, end: 0 },
          lifespan: 600,
          speed: { min: 40, max: 120 }
        });
        this.coinParticles.explode(15, this.coin.x, this.coin.y);
      }
    } else if (this.coinType === 'rainbow') {
      soundManager.playCoinRainbow();
      playerScale = 1.75;
      floatyColor = '#00f0ff'; // Texto flutuante neon azul/ciano

      // Flash na tela
      this.cameras.main.flash(200, 255, 255, 255);

      // Partículas coloridas
      if (this.coinParticles) {
        this.coinParticles.setConfig({
          tint: [0xff007f, 0x00f0ff, 0x39ff14, 0xffd700],
          scale: { start: 2.0, end: 0 },
          lifespan: 700,
          speed: { min: 60, max: 150 }
        });
        this.coinParticles.explode(25, this.coin.x, this.coin.y);
      }
    }

    // Texto flutuante com o valor
    this.showFloatyText(this.coin.x, this.coin.y, `+${scoreGain}`, floatyColor);

    // Tweens divertidos de feedback
    this.tweens.add({
      targets: this.player,
      scaleX: playerScale,
      scaleY: playerScale,
      duration: 120,
      yoyo: true,
      ease: 'Quad.easeInOut'
    });

    // Score e Recuperação de energia ectoplásmica
    this.score += scoreGain;
    this.energy = Math.min(this.maxEnergy, this.energy + energyGain); // Recupera de forma variável
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

    this.energy = Math.max(0, this.energy - 30);
    soundManager.playHurt();

    this.cameras.main.flash(200, 255, 0, 0);

    const randomAngle = Phaser.Math.Between(0, 360) * (Math.PI / 180);
    this.physics.velocityFromRotation(randomAngle, 300, playerBody.velocity);

    this.isHurtInvincible = true;
    this.player.setTint(0xff0055);

    if (this.hurtInvincibleTimer) {
      this.hurtInvincibleTimer.destroy();
    }
    this.hurtInvincibleTimer = this.time.delayedCall(1200, () => {
      this.isHurtInvincible = false;
      this.hurtInvincibleTimer = null;

      if (this.activeEffect && this.powerUpTimeLeft > 0) {
        this.applyPowerUpVisuals();
      } else {
        this.player.clearTint();
        this.player.setAlpha(1);
        this.powerUpText.setText('');
      }
    });
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
    this.powerUpText.setText('');
    this.player.clearTint();
    this.player.setAlpha(1);
  }

  private applyPowerUpVisuals(): void {
    if (!this.activeEffect) return;
    this.player.clearTint();
    this.player.setAlpha(1);
    switch (this.activeEffect) {
      case 'speed':
        this.player.setTint(0x00f0ff);
        break;
      case 'shield':
        this.player.setTint(0xff007f);
        break;
      case 'magnet':
        this.player.setTint(0x39ff14);
        break;
      case 'phase':
        this.player.setTint(0xaa00ff);
        this.player.setAlpha(0.7);
        break;
    }
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
      qy === 0 ? margin + 50 : midY + margin,
      qy === 0 ? midY - margin : height - margin
    );

    this.coin.setPosition(rx, ry);
    this.coin.setVelocity(0, 0);

    // Variedade de moedas (Spec 05)
    this.coinType = pickCoinType();

    // Limpa tweens antigos da moeda
    this.tweens.killTweensOf(this.coin);
    if (this.rainbowTweenCounter) {
      this.rainbowTweenCounter.stop();
      this.rainbowTweenCounter = null;
    }

    // Para qualquer emissão de partículas antiga
    if (this.coinParticles) {
      this.coinParticles.stopFollow();
      this.coinParticles.stop();
    }

    // Configura visuais baseados no tipo
    this.coin.setScale(1.0);
    this.coin.clearTint();

    if (this.coinType === 'gold') {
      this.coin.setTint(0xffd700);
      
      this.tweens.add({
        targets: this.coin,
        y: '+=8',
        yoyo: true,
        repeat: -1,
        duration: 600,
        ease: 'Sine.easeInOut'
      });
    } else if (this.coinType === 'silver') {
      this.coin.setTint(0xc0c0c0);

      // Flutuação
      this.tweens.add({
        targets: this.coin,
        y: '+=6',
        yoyo: true,
        repeat: -1,
        duration: 500,
        ease: 'Sine.easeInOut'
      });

      // Pulso de escala
      this.tweens.add({
        targets: this.coin,
        scaleX: 1.3,
        scaleY: 1.3,
        yoyo: true,
        repeat: -1,
        duration: 800,
        ease: 'Linear'
      });
    } else if (this.coinType === 'rainbow') {
      // Ciclo de cores HSL
      this.rainbowTweenCounter = this.tweens.addCounter({
        from: 0,
        to: 360,
        duration: 2000,
        repeat: -1,
        onUpdate: (tween) => {
          const hue = (tween.getValue() as number) ?? 0;
          const color = Phaser.Display.Color.HSLToColor(hue / 360, 1, 0.5);
          this.coin.setTint(color.color);
        }
      });

      // Flutuação
      this.tweens.add({
        targets: this.coin,
        y: '+=10',
        yoyo: true,
        repeat: -1,
        duration: 700,
        ease: 'Sine.easeInOut'
      });

      // Emana faíscas sutis
      if (this.coinParticles) {
        this.coinParticles.startFollow(this.coin);
        this.coinParticles.setConfig({
          frequency: 200,
          quantity: 1,
          scale: { start: 1.2, end: 0 },
          lifespan: 500,
          speed: { min: 20, max: 50 },
          tint: [0xff007f, 0x00f0ff, 0x39ff14, 0xffd700]
        });
        this.coinParticles.start();
      }
    }
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
    }

    // Sorteia o stalker entre os inimigos criados (Spec 04 — Stalker Aleatório)
    if (this.level % 5 === 0 && count > 0) {
      const stalkerIndex = Phaser.Math.Between(0, count - 1);
      const stalker = this.enemies.getChildren()[stalkerIndex] as Phaser.Physics.Arcade.Sprite;
      stalker.setName('stalker');
      stalker.setTint(0xff00ff);
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

    // Efeitos visuais na barra de energia (Spec 02)
    if (this.energy <= 10) {
      // Abaixo de 10%, pisca (alpha alternando 1.0 ↔ 0.3)
      const pulseTime = this.time.now;
      this.energyBar.setAlpha(Math.sin(pulseTime / 80) > 0 ? 1.0 : 0.3);
      this.energyBar.setScale(1.0);
      this.energyBar.setPosition(0, 0);
    } else if (this.energy <= 25) {
      // Entre 10% e 25%, pulsa em escala a partir do centro da barra
      const pulseTime = this.time.now;
      const scale = 1.0 + Math.sin(pulseTime / 150) * 0.08;
      this.energyBar.setAlpha(1.0);
      
      const centerX = barX + barWidth / 2;
      const centerY = barY + barHeight / 2;
      
      this.energyBar.setScale(scale);
      this.energyBar.setPosition(centerX * (1 - scale), centerY * (1 - scale));
    } else {
      // Estado normal
      this.energyBar.setAlpha(1.0);
      this.energyBar.setScale(1.0);
      this.energyBar.setPosition(0, 0);
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
    this.stopHeartbeat();
    this.physics.world.pause();
    soundManager.playLevelClear();

    this.scene.start('PlayScene', { score: this.score, level: this.level + 1 });
  }

  private triggerGameOver(): void {
    this.stopHeartbeat();
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

  // Métodos do Sistema de Pausa (Spec 03)
  private togglePause(): void {
    if (this.overlayActive) return;

    this.isPaused = !this.isPaused;
    soundManager.playPause();

    if (this.isPaused) {
      this.physics.world.pause();
      this.time.paused = true;
      this.tweens.pauseAll();

      if (this.heartbeatAudio) {
        this.heartbeatAudio.stop();
        this.heartbeatAudio = null;
      }

      this.createPauseOverlay();
    } else {
      this.resumeGameplay();
    }
  }

  private resumeGameplay(): void {
    this.isPaused = false;

    if (this.pauseOverlay) {
      this.pauseOverlay.destroy();
      this.pauseOverlay = null;
    }

    this.physics.world.resume();
    this.time.paused = false;
    this.tweens.resumeAll();
  }

  private createPauseOverlay(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.pauseOverlay = this.add.container(0, 0).setDepth(200);

    const background = this.add.rectangle(width / 2, height / 2, width, height, 0x0d041a, 0.75);
    this.pauseOverlay.add(background);

    const pausedText = this.add.text(width / 2, height / 3, 'PAUSED', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '28px',
      color: '#00f0ff'
    }).setOrigin(0.5).setShadow(0, 0, '#00f0ff', 10, true, true);
    this.pauseOverlay.add(pausedText);

    const resumeBtn = this.add.text(width / 2, height * 0.52, 'RESUME', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#39ff14'
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setShadow(0, 0, '#39ff14', 4, true, true);
    
    resumeBtn.on('pointerdown', () => {
      this.resumeGameplay();
      soundManager.playPause();
    });
    resumeBtn.on('pointerover', () => {
      resumeBtn.setColor('#ffffff');
      resumeBtn.setShadow(0, 0, '#ffffff', 8, true, true);
    });
    resumeBtn.on('pointerout', () => {
      resumeBtn.setColor('#39ff14');
      resumeBtn.setShadow(0, 0, '#39ff14', 4, true, true);
    });
    this.pauseOverlay.add(resumeBtn);

    const quitBtn = this.add.text(width / 2, height * 0.65, 'QUIT TO MENU', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#ff007f'
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setShadow(0, 0, '#ff007f', 4, true, true);

    quitBtn.on('pointerdown', () => {
      this.stopHeartbeat();
      soundManager.playPause();
      this.scene.start('MenuScene');
    });
    quitBtn.on('pointerover', () => {
      quitBtn.setColor('#ffffff');
      quitBtn.setShadow(0, 0, '#ffffff', 8, true, true);
    });
    quitBtn.on('pointerout', () => {
      quitBtn.setColor('#ff007f');
      quitBtn.setShadow(0, 0, '#ff007f', 4, true, true);
    });
    this.pauseOverlay.add(quitBtn);

    const tipText = this.add.text(width / 2, height * 0.8, 'PRESS ESC OR CLICK RESUME TO CONTINUE', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#888888'
    }).setOrigin(0.5);
    this.pauseOverlay.add(tipText);
  }

  // Métodos do Feedback de Energia Crítica (Spec 02)
  private handleEnergyCrisisFeedback(time: number): void {
    if (this.energy <= 25) {
      const targetBpm = this.energy <= 10 ? 120 : 60;
      
      if (this.heartbeatAudio === null || this.heartbeatBpm !== targetBpm) {
        if (this.heartbeatAudio) {
          this.heartbeatAudio.stop();
        }
        this.heartbeatAudio = soundManager.playCrisisHeartbeat(targetBpm);
        this.heartbeatBpm = targetBpm;
      }

      if (time > this.nextFlashTime) {
        this.cameras.main.flash(400, 255, 0, 0);
        this.nextFlashTime = time + 2000;
      }

      if (this.energy <= 10 && time > this.nextShakeTime) {
        this.cameras.main.shake(100, 0.005);
        this.nextShakeTime = time + 2000;
      }
    } else {
      this.stopHeartbeat();
    }
  }

  private stopHeartbeat(): void {
    if (this.heartbeatAudio) {
      this.heartbeatAudio.stop();
      this.heartbeatAudio = null;
      this.heartbeatBpm = null;
    }
  }

  private cleanupScene(): void {
    this.stopHeartbeat();
    if (this.rainbowTweenCounter) {
      this.rainbowTweenCounter.stop();
    }
    if (this.pauseKey) {
      this.pauseKey.removeAllListeners();
    }
  }
}
