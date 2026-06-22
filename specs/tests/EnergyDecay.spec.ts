import { describe, it, expect } from 'vitest';
import { stepEnergyDecay } from '../../src/game/utils/energy';

describe('stepEnergyDecay', () => {
  it('decays proportionally to rate over a 60fps frame', () => {
    const next = stepEnergyDecay(100, 0.15, 1000 / 60);
    expect(next).toBeCloseTo(100 - 0.15, 5);
  });

  it('is frame-rate independent (two half-frames == one full frame)', () => {
    const full = stepEnergyDecay(100, 0.3, 1000 / 60);
    const half = stepEnergyDecay(stepEnergyDecay(100, 0.3, 500 / 60), 0.3, 500 / 60);
    expect(half).toBeCloseTo(full, 10);
  });

  it('scales linearly with delta', () => {
    const base = 100;
    const small = base - stepEnergyDecay(base, 0.2, 8);
    const big = base - stepEnergyDecay(base, 0.2, 16);
    expect(big).toBeCloseTo(small * 2, 10);
  });
});
