import { describe, it, expect } from 'vitest';
import { tickPowerUp } from '../../src/game/utils/powerupTimer';
import { POWERUP } from '../../src/game/utils/constants';

describe('tickPowerUp', () => {
  it('subtracts the raw ms delta (durations are in ms)', () => {
    const r = tickPowerUp(POWERUP.SPEED_DURATION, 1000);
    expect(r.timeLeft).toBe(POWERUP.SPEED_DURATION - 1000);
    expect(r.expired).toBe(false);
  });

  it('expires when the remaining time reaches zero', () => {
    expect(tickPowerUp(1000, 1000).expired).toBe(true);
    expect(tickPowerUp(500, 1000).expired).toBe(true);
    expect(tickPowerUp(500, 1000).timeLeft).toBeLessThanOrEqual(0);
  });

  it('does not expire while time remains', () => {
    const r = tickPowerUp(6000, 1000 / 60);
    expect(r.expired).toBe(false);
    expect(r.timeLeft).toBeCloseTo(6000 - 1000 / 60, 4);
  });

  it('a 6s effect depletes in ~6s of frames, not ~100min (units regression)', () => {
    let t: number = POWERUP.SPEED_DURATION; // 6000 ms
    const frameMs = 1000 / 60;
    let elapsedMs = 0;
    let guard = 0;
    while (t > 0 && guard < 100000) {
      t = tickPowerUp(t, frameMs).timeLeft;
      elapsedMs += frameMs;
      guard++;
    }
    expect(elapsedMs / 1000).toBeGreaterThan(5);
    expect(elapsedMs / 1000).toBeLessThan(7);
  });
});
