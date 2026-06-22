import { describe, it, expect } from 'vitest';
import { shouldTakeEnemyDamage } from '../../src/game/utils/combat';

describe('shouldTakeEnemyDamage', () => {
  it('blocks damage while a shield is active', () => {
    expect(shouldTakeEnemyDamage('shield', false)).toBe(false);
    expect(shouldTakeEnemyDamage('shield', true)).toBe(false);
  });

  it('blocks damage during post-hit invincibility', () => {
    expect(shouldTakeEnemyDamage(null, true)).toBe(false);
    expect(shouldTakeEnemyDamage('speed', true)).toBe(false);
  });

  it('takes damage with no shield and not invincible', () => {
    expect(shouldTakeEnemyDamage(null, false)).toBe(true);
    expect(shouldTakeEnemyDamage('speed', false)).toBe(true);
    expect(shouldTakeEnemyDamage('magnet', false)).toBe(true);
    expect(shouldTakeEnemyDamage('phase', false)).toBe(true);
  });
});
