import { describe, it, expect } from 'vitest';
import { phaseWrap } from '../../src/game/utils/phaseWrap';
import { GAME } from '../../src/game/utils/constants';

describe('phaseWrap', () => {
  const WIDTH = 700;
  const HEIGHT = 400;
  const TOP = GAME.WORLD_BOUND_BOTTOM_PADDING;
  const wrap = (x: number, y: number) => phaseWrap(x, y, WIDTH, HEIGHT);

  it('should wrap x from left to right', () => {
    expect(wrap(-17, 200).x).toBe(WIDTH + 16);
  });

  it('should wrap x from right to left', () => {
    expect(wrap(WIDTH + 17, 200).x).toBe(-16);
  });

  it('should wrap y from top to bottom', () => {
    expect(wrap(350, TOP - 1).y).toBe(HEIGHT + 16);
  });

  it('should wrap y from bottom to top', () => {
    expect(wrap(350, HEIGHT + 17).y).toBe(TOP);
  });

  it('should not wrap when inside bounds', () => {
    const result = wrap(350, 200);
    expect(result.x).toBe(350);
    expect(result.y).toBe(200);
  });

  it('should not wrap at exact boundary values', () => {
    expect(wrap(-16, 200).x).toBe(-16);
    expect(wrap(WIDTH + 16, 200).x).toBe(WIDTH + 16);
    expect(wrap(350, TOP).y).toBe(TOP);
    expect(wrap(350, HEIGHT + 16).y).toBe(HEIGHT + 16);
  });
});
