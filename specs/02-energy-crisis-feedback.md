# Feedback de Energia Crítica

## Objetivo
Melhorar a comunicação visual e sonora quando a energia ectoplásmica do jogador está baixa (≤ 25%), ajudando o jogador a perceber o perigo iminente sem precisar olhar fixamente para a HUD.

## Problema
Atualmente, quando a energia cai abaixo de 25%, a única indicação é:
1. A barra de energia muda de verde para amarelo (65%–35%) e depois para vermelho (< 35%)
2. A energia continua decaindo silenciosamente até 0, quando o jogo termina

Não há nenhum feedback *urgente* que alerte o jogador durante ação intensa.

## Comportamento Desejado

### 1. Efeito Visual na Tela (Camera)

| Nível | Efeito | Parâmetros |
|-------|--------|------------|
| Energia ≤ 25% | Borda vermelha sutil pulsando na tela | `camera.flash(400, 255, 0, 0, 0.15)` a cada 2s |
| Energia ≤ 10% | Tela treme levemente | `camera.shake(100, 0.005)` em loop rápido |

### 2. Efeito na HUD (Energy Bar)

- Barra de energia começa a pulsar (scale tween) quando ≤ 25%
- Abaixo de 10%, a barra pisca (alpha alternando 1.0 ↔ 0.3) em vez de pulsar

### 3. Efeito Sonoro

- Loop de áudio de "batimento cardíaco" (tom grave pulsante, 60 BPM) quando ≤ 25%
- Loop para quando a energia é recuperada acima de 25%
- Abaixo de 10%, a frequência do batimento dobra (120 BPM)

**Implementação no SoundGenerator:**
```typescript
// Novo método
public playCrisisHeartbeat(): { start: () => void; stop: () => void } {
    const ctx = this.initContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 40; // Tom grave
    gain.gain.value = 0.04;
    // Envelope pulsante
    // Retorna objeto com start() e stop()
}
```

### 4. Power-up Contextual (Já Implementado)

O sistema de `checkPowerUpTriggers()` já spawna power-ups shield/speed com 70% de chance quando `energy < 25`. Manter essa mecânica.

## Parâmetros de Balanceamento

| Parâmetro | Valor |
|-----------|-------|
| Threshold crítico | ≤ 25% de energia |
| Threshold agônico | ≤ 10% de energia |
| Intervalo do flash na tela | 2000ms |
| Duração do shake | 100ms |
| Frequência do heartbeat (crítico) | 60 BPM |
| Frequência do heartbeat (agônico) | 120 BPM |

## Requisitos Técnicos

- Adicionar à `PlayScene.update()`, logo após o decay de energia
- Armazenar referência para o objeto de heartbeat para poder parar o som
- Cancelar heartbeat ao sair da cena (game over ou level complete)
- Os efeitos visuais (flash/shake) devem ser leves e não interferir na jogabilidade
- Usar `camera.flash()` e `camera.shake()` do Phaser 3 (já importado)

## Checklist de Implementação

- [ ] Detecção de threshold ≤ 25% no `update()`
- [ ] Camera flash periódico no estado crítico
- [ ] Camera shake no estado agônico
- [ ] Tween de pulso na barra de energia
- [ ] Som de heartbeat com frequência variável
- [ ] Limpeza de efeitos ao recuperar energia ou mudar de cena
