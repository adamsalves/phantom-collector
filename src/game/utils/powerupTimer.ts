export interface PowerUpTick {
  timeLeft: number;
  expired: boolean;
}

/**
 * Avança o timer de um power-up ativo. `deltaMs` é o delta do Phaser em
 * MILISSEGUNDOS — as durações em POWERUP.*_DURATION também estão em ms.
 * (Regressão histórica: subtrair `delta / 1000` fazia o efeito durar ~1000x mais.)
 */
export function tickPowerUp(timeLeft: number, deltaMs: number): PowerUpTick {
  const next = timeLeft - deltaMs;
  return { timeLeft: next, expired: next <= 0 };
}
