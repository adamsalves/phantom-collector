import type { PowerUpType } from '../systems/PowerUpSystem';

/**
 * Regra de dano por colisão com inimigo: o player só toma dano se NÃO tiver
 * escudo ativo e NÃO estiver no período de invencibilidade pós-dano.
 * Função pura para documentar a regra e cobri-la por testes.
 */
export function shouldTakeEnemyDamage(
  activeEffect: PowerUpType | null,
  isHurtInvincible: boolean
): boolean {
  return activeEffect !== 'shield' && !isHurtInvincible;
}
