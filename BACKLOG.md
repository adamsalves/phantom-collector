# BACKLOG - Phantom: The Collector

> Última atualização: 2026-06-17
> Branch: fix/critical-bugs

---

## 🔴 CRÍTICO (Jogo não funciona como esperado)

| # | Bug | Ficheiro | Linhas | Descrição | Status |
|---|-----|----------|--------|-----------|--------|
| 1 | VictoryScene inalcançável | `src/game/scenes/PlayScene.ts` | 440-448 | Adicionado `GAME.MAX_LEVEL = 50`. Ao completar o nível 50, o jogo transita para VictoryScene como recompensa. | ✅ Resolvido |
| 2 | Jogador imortal a 0 energy | `src/game/scenes/PlayScene.ts` | 172-180 | Removido guard `getEnergy() > 0`. EnergySystem.update() já retorna false quando energy <= 0. | ✅ Resolvido |
| 3 | Energy drena durante level-complete | `src/game/scenes/PlayScene.ts` | 440-448 | Adicionado `this.overlayActive = true` em `triggerLevelComplete()`. | ✅ Resolvido |

---

## 🟠 ALTO (Bugs que afetam gameplay significativamente)

| # | Bug | Ficheiro | Linhas | Descrição | Status |
|---|-----|----------|--------|-----------|--------|
| 4 | EnemySystem.cleanup() nunca chamado | `src/game/scenes/PlayScene.ts` | 465-476 | Adicionado `this.enemySystem.cleanup()` ao `cleanupScene()`. | ✅ Resolvido |
| 5 | isHurtInvincible persiste entre levels | `src/game/scenes/PlayScene.ts` | 58-65, 166-167 | Adicionado reset de `isHurtInvincible` e destruição de `hurtInvincibleTimer` em `init()`. | ✅ Resolvido |
| 6 | Re-aceleração de inimigos sem cap | `src/game/systems/EnemySystem.ts` | 57-61 | Substituído `100 + level * 20` por `getEnemySpeed(level)` que tem cap em 200. | ✅ Resolvido |

---

## 🟡 MÉDIO (Bugs menores)

| # | Bug | Ficheiro | Linhas | Descrição |
|---|-----|----------|--------|-----------|
| 7 | Speed trail quando parado | `src/game/scenes/PlayScene.ts` | 242-245 | Trail é spawnado mesmo quando o jogador não se move. |
| 8 | Quit clicável durante resume fade | `src/game/systems/PauseSystem.ts` | 141-143 | Race condition no botão quit durante animação de resume. |
| 9 | Coin spawn quadrant fallback | `src/game/systems/CoinSystem.ts` | 60-65 | Após 10 tentativas, coin pode spawnar no quadrante do jogador. |
| 10 | Floaty text offset | `src/game/scenes/PlayScene.ts` | 298-319 | Posição do floaty text baseada na tween position, não na physics position. |
| 11 | HUD cleanup() vazio e nunca chamado | `src/game/components/HUD.ts` / `src/game/scenes/PlayScene.ts` | 137-139 / 465-476 | `cleanup()` não faz nada e nunca é invocado no `cleanupScene()`. |
| 12 | Energy bar mostra 2px a 0% | `src/game/components/HUD.ts` | 111-116 | `Math.max(2, ...)` faz a barra mostrar um sliver verde a 0%. |

---

## 🔵 MELHORIAS DE CÓDIGO

| # | Item | Ficheiro(s) | Descrição |
|---|------|-------------|-----------|
| 13 | Constantes duplicadas | `config.ts`, `constants.ts`, `coinHelper.ts` | Game dimensions duplicadas em `config.ts` e `constants.ts`; coin values duplicados em `coinHelper.ts` em vez de usar `COIN` constants. |
| 14 | Código duplicado: createRetroGrid() | `MenuScene.ts:100-112`, `RankingScene.ts:98-108` | Método idêntico em dois ficheiros. Extrair para util partilhado. |
| 15 | Código duplicado: hover/pulse tweens | `MenuScene.ts`, `GameOverScene.ts`, `VictoryScene.ts`, `RankingScene.ts`, `PauseSystem.ts` | Mesmo padrão de hover color + shadow + pulse repetido ~6x. Criar helper `makeHoverable()`. |
| 16 | Código duplicado: power-up color mapping | `PlayScene.ts:391-405, 423-437`, `PowerUpSystem.ts:94-97` | Mapeamento tipo→cor/tint duplicado 3x. Extrair para constante. |
| 17 | Código duplicado: WebkitAudioContext | `main.ts:10`, `SoundGenerator.ts:10` | Polyfill duplicado. Extrair para util. |
| 18 | Magic numbers | Vários ficheiros | ~15+ valores hardcoded: spawn margins (50, 100), decay factor (16.666), velocities (100, 200), thresholds (0.35, 0.65), diagonal normalization (0.7071), drag (400), etc. |
| 19 | Unsafe type casts | `PlayScene.ts:159`, `main.ts:10`, `SoundGenerator.ts:10` | `as unknown as Record<string, boolean>` para aceder `isHurtInvincible` — cast desnecessário e perigoso. | ✅ PlayScene resolvido |
| 20 | Console.warn em produção | `SoundGenerator.ts` | 10x `console.warn` em catch blocks. Usar debug flag ou remover. |
| 21 | Missing Phaser import | `NameInput.ts:4` | Usa `Phaser.Scene` como tipo mas não importa Phaser. Depende de ambient types. |
| 22 | Heartbeat usa setTimeout | `SoundGenerator.ts:239-282` | Devia usar Phaser timer; setTimeout continua após scene shutdown. |
| 23 | Crisis timers frágil | `EnergySystem.ts:112-115` | `advanceCrisisTimers` depende de ordem exata de chamadas. |

---

## ⚪ INFRAESTRUTURA

| # | Item | Descrição |
|---|------|-----------|
| 24 | Adicionar ESLint | Não existe linting configurado. Instalar `eslint` + `@typescript-eslint` com regras mínimas (`no-console`, `no-debugger`). |
| 25 | Coverage de testes | 39 testes mas sem `vitest.config.ts` nem coverage thresholds. Adicionar `vitest.config.ts` com v8 provider. |
| 26 | Upgrade Vite 5→6 | 5 vulnerabilidades de segurança (dev-only). Upgrade para `vite@^6.4.3`. |
| 27 | Expandir .gitignore | Falta `*.log`, `.env*`, `*.tsbuildinfo`, `yarn-debug.log*`, `yarn-error.log*`. |
| 28 | tsconfig mais strict | Adicionar `forceConsistentCasingInFileNames` e `noUncheckedIndexedAccess`. |
| 29 | Adicionar Prettier | Formatação consistente no codebase. |
| 30 | Atualizar README | Adicionar `RankingScene` ao directory tree. |

---

## 📊 Resumo

| Prioridade | Total | Resolvidos |
|------------|-------|------------|
| 🔴 Crítico | 3 | 3 |
| 🟠 Alto | 3 | 3 |
| 🟡 Médio | 6 | 0 |
| 🔵 Code Quality | 11 | 1 |
| ⚪ Infraestrutura | 7 | 0 |
| **Total** | **30** | **7** |
