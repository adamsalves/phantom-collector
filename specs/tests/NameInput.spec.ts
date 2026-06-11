import { describe, it, expect } from 'vitest';

const MAX_NAME_LENGTH = 8;
const ALLOWED_KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ';

function validateKey(key: string, currentName: string): { accepted: boolean; newName: string } {
  if (key === 'Enter') return { accepted: true, newName: currentName || '---' };
  if (key === 'Escape') return { accepted: true, newName: currentName };
  if (key === 'Backspace') return { accepted: true, newName: currentName.slice(0, -1) };

  if (currentName.length >= MAX_NAME_LENGTH) return { accepted: false, newName: currentName };

  const upper = key.toUpperCase();
  if (!ALLOWED_KEYS.includes(upper)) return { accepted: false, newName: currentName };

  return { accepted: true, newName: currentName + upper };
}

describe('NameInput Validation', () => {
  it('should accept uppercase letters', () => {
    const result = validateKey('a', '');
    expect(result.accepted).toBe(true);
    expect(result.newName).toBe('A');
  });

  it('should accept numbers', () => {
    const result = validateKey('5', 'ABC');
    expect(result.accepted).toBe(true);
    expect(result.newName).toBe('ABC5');
  });

  it('should accept space', () => {
    const result = validateKey(' ', 'HELLO');
    expect(result.accepted).toBe(true);
    expect(result.newName).toBe('HELLO ');
  });

  it('should reject special characters', () => {
    const result = validateKey('!', 'TEST');
    expect(result.accepted).toBe(false);
    expect(result.newName).toBe('TEST');
  });

  it('should reject when at max length', () => {
    const result = validateKey('X', 'ABCDEFGH');
    expect(result.accepted).toBe(false);
    expect(result.newName).toBe('ABCDEFGH');
  });

  it('should handle backspace', () => {
    const result = validateKey('Backspace', 'HELLO');
    expect(result.accepted).toBe(true);
    expect(result.newName).toBe('HELL');
  });

  it('should handle backspace on empty string', () => {
    const result = validateKey('Backspace', '');
    expect(result.accepted).toBe(true);
    expect(result.newName).toBe('');
  });

  it('should handle Enter with empty name', () => {
    const result = validateKey('Enter', '');
    expect(result.accepted).toBe(true);
    expect(result.newName).toBe('---');
  });

  it('should handle Enter with existing name', () => {
    const result = validateKey('Enter', 'PLAYER1');
    expect(result.accepted).toBe(true);
    expect(result.newName).toBe('PLAYER1');
  });

  it('should handle Escape', () => {
    const result = validateKey('Escape', 'TEST');
    expect(result.accepted).toBe(true);
    expect(result.newName).toBe('TEST');
  });
});
