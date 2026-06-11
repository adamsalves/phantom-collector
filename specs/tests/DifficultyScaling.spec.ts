import { describe, it, expect } from 'vitest';
import { getLevelGoal, getEnemyCount, getEnemySpeed, getEnergyDecay, getPowerUpDelay, getScenarioName } from '../../src/game/utils/difficulty';

describe('Difficulty Scaling', () => {
  describe('getLevelGoal', () => {
    it('should return 10 for level 1', () => {
      expect(getLevelGoal(1)).toBe(10);
    });

    it('should increase with level', () => {
      expect(getLevelGoal(5)).toBeGreaterThan(10);
      expect(getLevelGoal(10)).toBeGreaterThan(getLevelGoal(5));
    });

    it('should cap at 28', () => {
      expect(getLevelGoal(100)).toBe(28);
    });

    it('should handle level 0 gracefully', () => {
      expect(getLevelGoal(0)).toBe(10);
    });
  });

  describe('getEnemyCount', () => {
    it('should return 1 for level 1', () => {
      expect(getEnemyCount(1)).toBe(1);
    });

    it('should increase with level', () => {
      expect(getEnemyCount(5)).toBeGreaterThan(1);
      expect(getEnemyCount(10)).toBeGreaterThan(getEnemyCount(5));
    });

    it('should cap at 7', () => {
      expect(getEnemyCount(100)).toBe(7);
    });
  });

  describe('getEnemySpeed', () => {
    it('should return 87 for level 1', () => {
      expect(getEnemySpeed(1)).toBe(87);
    });

    it('should increase with level', () => {
      expect(getEnemySpeed(5)).toBeGreaterThan(87);
      expect(getEnemySpeed(10)).toBeGreaterThan(getEnemySpeed(5));
    });

    it('should cap at 200', () => {
      expect(getEnemySpeed(100)).toBe(200);
    });
  });

  describe('getEnergyDecay', () => {
    it('should return ~0.18 for level 1', () => {
      const decay = getEnergyDecay(1);
      expect(decay).toBeGreaterThanOrEqual(0.17);
      expect(decay).toBeLessThanOrEqual(0.19);
    });

    it('should increase with level', () => {
      expect(getEnergyDecay(5)).toBeGreaterThan(getEnergyDecay(1));
      expect(getEnergyDecay(10)).toBeGreaterThan(getEnergyDecay(5));
    });

    it('should cap at 0.55', () => {
      expect(getEnergyDecay(1000)).toBe(0.55);
    });
  });

  describe('getPowerUpDelay', () => {
    it('should return 12000 for level 1', () => {
      expect(getPowerUpDelay(1)).toBe(12000);
    });

    it('should decrease with level', () => {
      expect(getPowerUpDelay(5)).toBeLessThan(12000);
      expect(getPowerUpDelay(10)).toBeLessThan(getPowerUpDelay(5));
    });

    it('should cap at 5000 minimum', () => {
      expect(getPowerUpDelay(100)).toBe(5000);
    });
  });

  describe('getScenarioName', () => {
    it('should return THE CRYPTS for level 1', () => {
      expect(getScenarioName(1)).toBe('THE CRYPTS');
    });

    it('should cycle through names', () => {
      expect(getScenarioName(11)).toBe('THE CRYPTS');
      expect(getScenarioName(2)).toBe('THE HAUNTED DUNGEON');
    });

    it('should never return undefined', () => {
      for (let i = 1; i <= 20; i++) {
        expect(getScenarioName(i)).toBeDefined();
        expect(typeof getScenarioName(i)).toBe('string');
      }
    });
  });
});
