import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RankingManager } from '../../src/game/ranking/RankingManager';

// Mock simples para o localStorage global
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] || null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); })
};
vi.stubGlobal('localStorage', localStorageMock);

describe('RankingManager', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should return empty array when no scores are saved', () => {
    const scores = RankingManager.getScores();
    expect(scores).toEqual([]);
    expect(localStorageMock.getItem).toHaveBeenCalledWith('phantom_ranking');
  });

  it('should save a score and retrieve it sorted by score descending', () => {
    RankingManager.saveScore('PLY1', 100);
    RankingManager.saveScore('PLY2', 250);
    RankingManager.saveScore('PLY3', 150);

    const scores = RankingManager.getScores();
    expect(scores).toHaveLength(3);
    expect(scores[0]).toEqual(expect.objectContaining({ name: 'PLY2', score: 250 }));
    expect(scores[1]).toEqual(expect.objectContaining({ name: 'PLY3', score: 150 }));
    expect(scores[2]).toEqual(expect.objectContaining({ name: 'PLY1', score: 100 }));
  });

  it('should limit the entries to max 10 entries', () => {
    for (let i = 1; i <= 12; i++) {
      RankingManager.saveScore(`P${i}`, i * 10);
    }

    const scores = RankingManager.getScores();
    expect(scores).toHaveLength(10);
    expect(scores[0].score).toBe(120);
    expect(scores[9].score).toBe(30);
  });

  it('should detect a high score correctly', () => {
    // Menos de 10 scores salvos sempre aceita high score
    expect(RankingManager.isHighScore(5)).toBe(true);

    for (let i = 1; i <= 10; i++) {
      RankingManager.saveScore(`PLY${i}`, i * 10); // 10, 20, 30, ..., 100
    }

    // Com 10 scores, o menor é 10
    expect(RankingManager.isHighScore(5)).toBe(false);
    expect(RankingManager.isHighScore(10)).toBe(false); // deve ser estritamente maior
    expect(RankingManager.isHighScore(15)).toBe(true);
  });

  it('should clear all scores', () => {
    RankingManager.saveScore('TEST', 100);
    expect(RankingManager.getScores()).toHaveLength(1);

    RankingManager.clearScores();
    expect(RankingManager.getScores()).toEqual([]);
  });
});
