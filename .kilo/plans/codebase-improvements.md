# Plano de Melhorias — Phantom Collector

## Análise do codebase

Jogo Phaser 3 (canvas 700×400) com cenas Boot/Menu/Play/GameOver/Victory/Ranking, sistemas de energia/inimigos/moedas/powerups e ranking em localStorage.

---

## Problemas identificados

### 1. v3.4.3 do Tailwind CSS instalada mas não utilizada
**Arquivo:** `package.json:19`
- Tailwind 3.4.3 + postcss.config.js + estilo global existem, mas nenhum `.html`/`.tsx` referencia classes utilitárias.
- **Impacto:** Dependência morta de ~700 KB no bundle final.

### 2. Flag de debug de physics ativa em produção
**Arquivo:** `src/game/config.ts:22`
- `debug: false` está explícito, porém a propriedade `debug` não deveria existir em release.

### 3. Progresso do power-up contado em `delta` de引擎 (ms), não segundos
**Arquivos:** `src/game/systems/PowerUpSystem.ts:44`, `src/game/systems/EnergySystem.ts:33`
- A comparação `delta` (ms) é subtraída diretamente de valores configurados em milissegundos. Se o frame cair abaixo de ~16 ms o power-up dura proporcionalmente mais, enquanto que a energia usa `(delta / 16.666)` — inconsistência de unidades entre sistemas simples.

### 4. `EnergySystem` lança som de crise mesmo quando scene está pausada
**Arquivo:** `src/game/systems/EnergySystem.ts:76-101` + `src/game/systems/PauseSystem.ts:37`
- `stopHeartbeat()` não é chamado no pause — apenas no toggle. Se o jogador pausa em níveis críticos, o heartbeat continua tocando.
- A lógica de "não reproduzir se suspended" existe (`EnergySystem.ts:240`), mas o timeout roda e consome CPU mesmo assim.

### 5. NameInput: `physics.world.pause/resume` duplicado
**Arquivo:** `src/game/ranking/NameInput.ts:90-101`
- PlayScene já pausa a física quando inicia o NameInput (via overlay ou shutdown). NameInput checa `originalPause`, mas em várias condições o estado pode ficar inconsistente ao sair.

### 6. Colisão player-inimigo reavaliada a cada frame sem cache
**Arquivo:** `src/game/scenes/PlayScene.ts:157-163`
- Overlap callback é chamado toda frame enquanto os corpos se sobrepõem, podendo causar múltiplos `handlePlayerHurt` mesmo com `isHurtInvincible` ativo (o check está lá, mas overlap continua sendo processado desnecessariamente).

### 7. Hardcoded strings de cores repetidas em ~5 arquivos
**Pattern:** `#00f0ff`, `#ff007f`, `#39ff14`, `#ffd700` aparecem em BootScene, MenuScene, PlayScene, HUD, VictoryScene, GameOverScene, LevelOverlay, NameInput.
- **Impacto:** Manutenibilidade baixa; trocar o tema exige busca/replace em 8+ arquivos.

### 8. Timers do PowerUp usam `scene.time.delayedCall` sem referência para cancelar
**Arquivo:** `src/game/systems/PowerUpSystem.ts:113-120`
- Timer de 7s para expirar não é rastreado; se o sprite for coletado manualmente ou cena reiniciada, o timer pode disparar e tocar `deactivate()` em objeto já destruído (protegido por checks, mas desperdício).

### 9. RankingManager re-lê e re-escreve localStorage sempre
**Arquivo:** `src/game/ranking/RankingManager.ts:21-26`
- `saveScore` chama `getScores()` (lê + parse + sort) e depois re-sort e re-set. Em browser moderno é rápido, mas é duplicação de trabalho.

### 10. Ausência de meta tags e configurações de build otimizadas
**Arquivos:** `index.html` (existente mas não lido), `vite.config.ts`
- Sem `<meta name="viewport">`, sem favicon, sem `preview` config, sem `sourcemap` controlado em produção.

---

## Plano priorizado (sem quebrar funcionalidades)

| # | Melhoria | Arquivo(s) | Risco |
|---|----------|------------|-------|
| 1 | **Extrair hardcoded colors em constantes theme** | Novo `theme.ts` + import em scenes/components | Baixo |
| 2 | **Corrigir unidade de delta no PowerUpSystem** | `PowerUpSystem.ts:44`, confirmar EnergySystem | Baixo |
| 3 | **Pausar heartbeat ao ativar pause** | `EnergySystem.ts` + `PauseSystem.ts:41` | Baixo |
| 4 | **Rastrear timer de expiração do powerup** | `PowerUpSystem.ts` | Baixo |
| 5 | **Otimizar overlap player-inimigo** | `PlayScene.ts:157-163` | Baixo |
| 6 | **Remover dependência morta do Tailwind CSS** | `package.json`, `postcss.config.js`, `tailwind.config.js` | Baixo |
| 7 | **Adicionar meta tags em index.html** | `index.html` | Baixo |
| 8 | **Cachear `isHighScore` no fluxo de save** | `RankingManager.ts` | Baixo |

Melhorias #1, #2 e #3 são as de maior impacto real (manutenibilidade + UX de áudio + consistência).

---

## Ordem sugerida de implementação

1. **theme.ts** — centraliza paleta, HUD usa constantes ao invés de literais.
2. **PowerUpSystem delta fix** — garante que 6000ms = 6s independente de frame rate.
3. **Pause + heartbeat** — usa o callback `onPause` para parar/retomar heartbeat corretamente.
4. **Expire timer tracking** — salva referência e cancela no cleanup/collect.
5. **Overlap otimizado** — checa `isHurtInvincible` ANTES de chamar overlap callback.
6. **Tailwind cleanup** — remove dep do package.json + configs.
7. **HTML meta** — viewport, description, theme-color.
8. **Ranking cache** — refatora `saveScore` para não re-ler localStorage.

