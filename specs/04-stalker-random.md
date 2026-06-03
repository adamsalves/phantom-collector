# Stalker Aleatório

## Objetivo
Em vez de sempre o primeiro inimigo (`i === 0`) ser o stalker perseguidor nos levels múltiplos de 5, sortear aleatoriamente qual inimigo do grupo recebe esse comportamento, tornando a mecânica menos previsível.

## Problema
Atualmente em `spawnEnemies()`:
```typescript
if (this.level % 5 === 0 && i === 0) {
    enemy.setName('stalker');
    enemy.setTint(0xff00ff);
}
```

O stalker é sempre o primeiro inimigo criado. Jogadores experientes identificam rapidamente que o primeiro inimigo spawnado é o perseguidor, tornando a ameaça trivial de evitar.

## Comportamento Desejado

### Regras
- Apenas em levels `% 5 === 0` (5, 10, 15, ...) — manter condição atual
- Exatamente **1 stalker** por level (manter)
- O stalker deve ser um inimigo **aleatório** do grupo, não o primeiro
- O stalker mantém o tint roxo (`0xff00ff`) e o nome `'stalker'`

### Fluxo

```
spawnEnemies()
  │
  ├── Cria todos os inimigos normalmente (sem stalker)
  │
  └── Se level % 5 === 0
        │
        └── Escolhe índice aleatório: [0, count - 1]
              │
              └── enemies.getChildren()[randomIndex].setName('stalker')
                                                    .setTint(0xff00ff)
```

### Implementação

```typescript
private spawnEnemies(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const count = this.getEnemyCount();

    // Cria todos os inimigos primeiro
    for (let i = 0; i < count; i++) {
        const rx = Phaser.Math.Between(50, width - 50);
        const ry = Phaser.Math.Between(100, height - 100);

        const enemy = this.enemies.create(rx, ry, 'enemy') as Phaser.Physics.Arcade.Sprite;
        enemy.setCollideWorldBounds(true);
        enemy.setBounce(1, 1);

        const enemyBody = enemy.body as Phaser.Physics.Arcade.Body;
        if (enemyBody) {
            const baseSpeed = this.getEnemySpeed();
            const angle = Phaser.Math.Between(0, 360) * (Math.PI / 180);
            this.physics.velocityFromRotation(angle, baseSpeed, enemyBody.velocity);
        }
    }

    // Sorteia o stalker entre os inimigos criados
    if (this.level % 5 === 0 && count > 0) {
        const stalkerIndex = Phaser.Math.Between(0, count - 1);
        const stalker = this.enemies.getChildren()[stalkerIndex] as Phaser.Physics.Arcade.Sprite;
        stalker.setName('stalker');
        stalker.setTint(0xff00ff);
    }
}
```

### IA do Stalker (já implementada em `handleEnemiesAI()`)
Não muda: persegue o jogador com `chaseSpeed = 110`. Manter.

## Parâmetros de Balanceamento

| Parâmetro | Atual | Proposto |
|-----------|-------|----------|
| Stalker index | Fixo: 0 | Aleatório: [0, count-1] |
| Número de stalkers | 1 | 1 (mantido) |
| Tint | 0xff00ff | 0xff00ff (mantido) |
| Velocidade de perseguição | 110 | 110 (mantido) |

## Checklist de Implementação

- [ ] Mover lógica do stalker para após a criação de todos os inimigos
- [ ] Usar `Phaser.Math.Between(0, count - 1)` para índice aleatório
- [ ] Garantir que a IA em `handleEnemiesAI()` ainda detecta `enemy.name === 'stalker'`
- [ ] Testar que exatamente 1 stalker existe por level 5+
