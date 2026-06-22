import { GAME } from './constants';

// Margem além da borda visível antes de teletransportar o player para o lado oposto.
const EDGE_MARGIN = 16;

export interface Position {
  x: number;
  y: number;
}

/**
 * Lógica do power-up "phase": ao atravessar as bordas da tela, o player
 * reaparece no lado oposto. Função pura para ser reutilizada pela PlayScene
 * e coberta diretamente por testes (fonte única de verdade).
 */
export function phaseWrap(
  x: number,
  y: number,
  width: number,
  height: number,
  bottomPadding: number = GAME.WORLD_BOUND_BOTTOM_PADDING
): Position {
  let nx = x;
  let ny = y;

  if (nx < -EDGE_MARGIN) {
    nx = width + EDGE_MARGIN;
  } else if (nx > width + EDGE_MARGIN) {
    nx = -EDGE_MARGIN;
  }

  if (ny < bottomPadding) {
    ny = height + EDGE_MARGIN;
  } else if (ny > height + EDGE_MARGIN) {
    ny = bottomPadding;
  }

  return { x: nx, y: ny };
}
