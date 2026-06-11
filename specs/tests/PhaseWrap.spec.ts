import { describe, it, expect } from 'vitest';

describe('PhaseWrap Logic', () => {
  const WIDTH = 700;
  const HEIGHT = 400;

  function phaseWrap(x: number, y: number): { x: number; y: number } {
    let nx = x;
    let ny = y;

    if (nx < -16) {
      nx = WIDTH + 16;
    } else if (nx > WIDTH + 16) {
      nx = -16;
    }

    if (ny < 34) {
      ny = HEIGHT + 16;
    } else if (ny > HEIGHT + 16) {
      ny = 34;
    }

    return { x: nx, y: ny };
  }

  it('should wrap x from left to right', () => {
    const result = phaseWrap(-17, 200);
    expect(result.x).toBe(WIDTH + 16);
  });

  it('should wrap x from right to left', () => {
    const result = phaseWrap(WIDTH + 17, 200);
    expect(result.x).toBe(-16);
  });

  it('should wrap y from top to bottom', () => {
    const result = phaseWrap(350, 33);
    expect(result.y).toBe(HEIGHT + 16);
  });

  it('should wrap y from bottom to top', () => {
    const result = phaseWrap(350, HEIGHT + 17);
    expect(result.y).toBe(34);
  });

  it('should not wrap when inside bounds', () => {
    const result = phaseWrap(350, 200);
    expect(result.x).toBe(350);
    expect(result.y).toBe(200);
  });

  it('should not wrap at exact boundary values', () => {
    const result1 = phaseWrap(-16, 200);
    expect(result1.x).toBe(-16);

    const result2 = phaseWrap(WIDTH + 16, 200);
    expect(result2.x).toBe(WIDTH + 16);

    const result3 = phaseWrap(350, 34);
    expect(result3.y).toBe(34);

    const result4 = phaseWrap(350, HEIGHT + 16);
    expect(result4.y).toBe(HEIGHT + 16);
  });
});
