import { describe, it, expect } from 'vitest';
import { getCoinValue, getCoinEnergy, pickCoinType } from '../../src/game/utils/coinHelper';

describe('CoinVariety Utility', () => {
  it('should return correct points for each coin type', () => {
    expect(getCoinValue('gold')).toBe(10);
    expect(getCoinValue('silver')).toBe(25);
    expect(getCoinValue('rainbow')).toBe(50);
  });

  it('should return correct energy recovery values for each coin type', () => {
    expect(getCoinEnergy('gold')).toBe(20);
    expect(getCoinEnergy('silver')).toBe(25);
    expect(getCoinEnergy('rainbow')).toBe(35);
  });

  it('should pick coin type based on custom roll values (probability weights)', () => {
    // Rainbow: roll < 0.05
    expect(pickCoinType(0.01)).toBe('rainbow');
    expect(pickCoinType(0.049)).toBe('rainbow');

    // Silver: 0.05 <= roll < 0.20
    expect(pickCoinType(0.05)).toBe('silver');
    expect(pickCoinType(0.15)).toBe('silver');
    expect(pickCoinType(0.199)).toBe('silver');

    // Gold: roll >= 0.20
    expect(pickCoinType(0.20)).toBe('gold');
    expect(pickCoinType(0.50)).toBe('gold');
    expect(pickCoinType(0.99)).toBe('gold');
  });

  it('should fallback to default random value if no roll is supplied', () => {
    const coin = pickCoinType();
    expect(['gold', 'silver', 'rainbow']).toContain(coin);
  });
});
