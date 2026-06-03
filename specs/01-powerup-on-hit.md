# Preservar Power-up ao Tomar Dano

## Status
✅ Implementado no PR #6 — esta spec documenta o comportamento final.

## Problema
Quando o jogador tomava dano, `handlePlayerHurt()` sobrescrevia `activeEffect` e `powerUpTimeLeft` com `'shield'` e `1200ms`, descartando qualquer power-up que estivesse ativo (speed, magnet, phase). Após os 1.2s de invencibilidade, o power-up original havia sido perdido permanentemente.

## Solução Atual

### Estado — `PlayScene.ts`
- `isHurtInvincible: boolean` — flag separada do sistema de power-up
- `hurtInvincibleTimer: Phaser.Time.TimerEvent | null` — referência ao timer para cancelamento em hits consecutivos

### Fluxo

```
[Player toma dano]
       │
       ▼
  handlePlayerHurt()
       │
       ├── NÃO toca em activeEffect / powerUpTimeLeft
       ├── isHurtInvincible = true
       ├── Cancela hurtInvincibleTimer anterior (se houver)
       └── Agenda delayedCall(1200ms)
                │
                ▼
          Callback do timer
                │
                ├── isHurtInvincible = false
                └── Se activeEffect && powerUpTimeLeft > 0
                        → applyPowerUpVisuals()  (restaura cor/alpha do power-up)
                    Senão
                        → clearTint(), setAlpha(1), limpa texto
```

### Proteções
- Colisão com inimigo: `if (activeEffect !== 'shield' && !isHurtInvincible)`
- Coleta de power-up: liberada mesmo durante invencibilidade (não bloqueia)
- Múltiplos hits consecutivos: timer anterior é cancelado, novo timer de 1.2s é agendado a partir do último hit

### Método auxiliar novo
`applyPowerUpVisuals()` — restaura tint e alpha específicos de cada tipo de power-up sem resetar o estado interno.

## Refinamentos Futuros (não implementados)
- **[Opcional]** Efeito visual de "escudo quebrado" quando a invencibilidade expira (partículas)
- **[Opcional]** Som de "escudo ativado" ao tomar dano (curto, grave)
