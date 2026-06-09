# Variedade de Moedas

## Objetivo
Introduzir múltiplos tipos de moedas com diferentes valores, cores e comportamentos visuais, adicionando profundidade à coleta e recompensando atenção do jogador.

## Problema
Atualmente todas as moedas são douradas e valem exatamente 10 pontos. Após alguns levels, a coleta se torna mecânica e previsível.

## Comportamento Desejado

### Tipos de Moeda

| Tipo | Valor | Raridade | Cor/Tint | Efeito Visual | Som |
|------|-------|----------|----------|---------------|-----|
| **Gold** | 10 pts | 80% | Dourado (`0xffd700`) | Flutuação vertical suave (atual) | `playCoin()` |
| **Silver** | 25 pts | 15% | Prata (`0xc0c0c0`) | Flutuação + pulso de escala (1.0 ↔ 1.3) | `playCoin()` com pitch mais agudo |
| **Rainbow** | 50 pts | 5% | Ciclo de cores (HSL) | Flutuação + arco-íris rotativo (tint cycling) | Tom especial ascendente |

### Spawn

Apenas **1 moeda por vez** na tela (manter mecânica atual). O tipo da moeda é sorteado no momento do spawn:

```typescript
private pickCoinType(): 'gold' | 'silver' | 'rainbow' {
    const roll = Math.random();
    if (roll < 0.05) return 'rainbow';
    if (roll < 0.20) return 'silver'; // 0.05 + 0.15
    return 'gold';
}
```

### Efeitos Visuais por Tipo

**Gold** (existente):
- Tint: `0xffd700`
- Tween de flutuação: `y += 8`, 600ms, Sine.easeInOut

**Silver** (novo):
- Tint: `0xc0c0c0`
- Tween de flutuação: `y += 6`, 500ms, Sine.easeInOut
- Tween de pulso adicional: `scaleX/Y 1.0 ↔ 1.3`, 800ms, yoyo infinito

**Rainbow** (novo):
- Sem tint fixa — usar `this.tweens.addCounter()` para percorrer matizes HSL a cada 2s
- Tween de flutuação: `y += 10`, 700ms, Sine.easeInOut
- Partículas sutis (faíscas) emanando da moeda — 3 partículas pequenas coloridas

### Coleção

```
handleCoinCollection()
  │
  ├── Calcula pontos baseado no tipo
  ├── Toca som específico do tipo
  ├── Efeito visual diferente por tipo:
  │     Gold:   scale 1.25, yoyo (atual)
  │     Silver: scale 1.5,  yoyo + partículas prateadas
  │     Rainbow: escala 1.75, yoyo + flash na tela + partículas rainbow
  │
  └── spawnCoinRandomly() → pickCoinType() antes de posicionar
```

### Estado Novo

```typescript
private coinType: 'gold' | 'silver' | 'rainbow' = 'gold';
```

### Som

**SoundGenerator:**
- `playCoinSilver()` — arpejo mais agudo que o gold, triangle wave
- `playCoinRainbow()` — arpejo rápido ascendente de 4 notas, square wave

### HUD

- O HUD de score não muda (score total acumulado)
- (Opcional) Breve texto flutuante "+25" ou "+50" ao coletar moeda especial, na cor do tipo

## Parâmetros de Balanceamento

| Parâmetro | Gold | Silver | Rainbow |
|-----------|------|--------|---------|
| Peso de spawn | 80% | 15% | 5% |
| Valor (pts) | 10 | 25 | 50 |
| Energia recuperada | +20 | +25 | +35 |
| Bônus ao progresso do level | 1 coin | 1 coin | 1 coin |

## Impacto na Dificuldade

- Moedas especiais não alteram a contagem de `coinsInLevel` (sempre contam como 1 para o goal)
- Moedas rainbow oferecem mais energia (+35 vs +20), dando sobrevida extra em momentos críticos
- A raridade cria momentos de "emoção" ao encontrar uma moeda rainbow

## Checklist de Implementação

- [ ] Definição do enum/tipo `CoinType`
- [ ] Método `pickCoinType()` com weighted random
- [ ] Lógica de tint/tweens diferente por tipo no `spawnCoinRandomly()`
- [ ] Som específico por tipo no `handleCoinCollection()`
- [ ] Efeito visual de coleta diferente por tipo
- [ ] HUD: texto flutuante "+N" ao coletar
- [ ] Atualizar energia recuperada por tipo
- [ ] Rainbow: tint cycling animation
- [ ] Rainbow: partículas de faísca
