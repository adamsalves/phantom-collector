import { GAME } from './constants';

/**
 * Decaimento de energia independente de frame-rate. `deltaMs` é o delta do
 * Phaser em ms, normalizado por um frame de referência a 60fps.
 */
export function stepEnergyDecay(energy: number, decayRate: number, deltaMs: number): number {
  return energy - decayRate * (deltaMs / GAME.REFERENCE_FRAME_MS);
}
