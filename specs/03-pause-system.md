# Sistema de Pausa

## Objetivo
Adicionar um overlay de pausa durante o gameplay, ativado pela tecla ESC, permitindo que o jogador pause/retome o jogo ou saia para o menu principal.

## Problema
O jogo arcade não tem nenhuma forma de pausa. Uma vez que o `PlayScene` inicia, o jogador está comprometido até morrer ou completar a fase. Isso é frustrante em partidas longas e impede o jogador de atender o telefone ou fazer uma pausa.

## Comportamento Desejado

### Ativação
- **ESC** (tecla): alterna entre pausado e não pausado
- A pausa só pode ser ativada quando `overlayActive === false` (não durante a intro de level)

### Estado Pausado

| Elemento | Comportamento |
|----------|---------------|
| Física | `this.physics.world.pause()` |
| Timers do jogo | Timers de power-up, decay de energia e spawn de inimigos congelam |
| Tweens ativos | Todos os tweens de jogabilidade pausam |
| Áudio | Nenhum som novo é tocado; sons existentes podem completar ou silenciar |

### Overlay Visual

```
┌─────────────────────────────────────┐
│            [Tela escurecida]         │
│              α = 0.75                │
│                                     │
│             ╔═══════════╗           │
│             ║  PAUSED   ║           │
│             ╚═══════════╝           │
│            (em cyan neon)           │
│                                     │
│        [RESUME]  (botão verde)      │
│       [QUIT TO MENU]  (botão rosa)  │
│                                     │
│   PRESS ESC OR CLICK TO CONTINUE    │
└─────────────────────────────────────┘
```

### Botões do Menu de Pausa

**Resume:**
- Clique ou ESC retoma o jogo
- Descongela física e timers
- Tweens retomam do estado atual

**Quit to Menu:**
- Confirmação? Sim — pequeno toast "QUIT? Y/N" antes de sair (opcional)
- Navega para `MenuScene`
- Perde progresso do level atual (score é mantido? Decisão de design: **score é perdido**, como em arcades clássicos)

### Requisitos Técnicos

**Estado:**
- `isPaused: boolean`
- `previousPhysicsState: boolean` (para restaurar corretamente se já estava pausado por overlay de level)

**Tecla:**
- Registrar handler para `this.input.keyboard.on('keydown-ESC', ...)`
- Remover handler no `shutdown()` da cena

**Overlay:**
- Container com depth alta (ex: `setDepth(200)`)
- Retângulo semi-transparente (preto, α 0.75)
- Texto "PAUSED" e botões

**Timers:**
- `this.time.paused = true` pausa todos os time events do Phaser
- Alternativamente, controlar manualmente

### Interações
- ESC fecha o overlay e retoma (mesmo que o botão Resume)
- Clique em Resume → retoma
- Clique em Quit → `this.scene.start('MenuScene')`
- Não é possível coletar moedas, power-ups ou ser atingido durante pausa

### Som
- Som de "pausa" curto (chiptune toggle) ao pausar/retomar
- `SoundGenerator.playPause()` — tom único agudo, 100ms

## Parâmetros de Balanceamento

| Parâmetro | Valor |
|-----------|-------|
| Overlay alpha | 0.75 |
| Animação de abertura | Fade in do overlay (200ms) |
| Animação de fechamento | Fade out (100ms) |

## Checklist de Implementação

- [ ] Detecção da tecla ESC no `PlayScene`
- [ ] Toggle de pausa com `physics.world.pause/resume`
- [ ] Pausar/retomar time events
- [ ] Container do overlay com depth alto
- [ ] Botão Resume funcional
- [ ] Botão Quit to Menu funcional
- [ ] Som de toggle
- [ ] Fade in/out do overlay
- [ ] Impedir pausa durante overlay de level (`overlayActive`)
- [ ] Limpeza no `shutdown()`
