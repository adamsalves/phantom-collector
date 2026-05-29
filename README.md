# Phantom: The Collector

Jogo retro arcade 8-bit construído com **Phaser 3**, **TypeScript** e **Tailwind CSS**.

## Stack

- **Phaser 3** — Motor de jogo com física Arcade
- **TypeScript** — Tipagem estática e strict mode
- **Vite** — Bundler e dev server
- **Tailwind CSS** — Estilização da HUD externa
- **PostCSS / Autoprefixer** — Pipeline de CSS

## Scripts

```bash
npm run dev      # Inicia servidor de desenvolvimento
npm run build    # Compila TS + gera bundle de produção
npm run preview  # Preview do build local
```

## Como Jogar

- **Setas do teclado** — Move o Phantom
- **Moedas douradas** — Colete para recuperar energia e avançar de fase
- **Inimigos** — Evite os espectros ou use escudo

## Estrutura

```
src/
├── game/           # Lógica do jogo Phaser
│   ├── scenes/     # BootScene, MenuScene, PlayScene, GameOverScene, VictoryScene
│   ├── audio/      # SoundGenerator (chiptune via Web Audio API)
│   └── config.ts   # Configuração central do Phaser
├── styles/         # Estilos globais (Tailwind + efeitos CRT)
└── main.ts         # Entry point
```
