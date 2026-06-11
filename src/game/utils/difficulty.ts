import { POWERUP } from './constants';

export function getLevelGoal(level: number): number {
  return Math.min(10 + Math.floor(Math.pow(Math.max(level - 1, 0), 0.75) * 5), 28);
}

export function getEnemyCount(level: number): number {
  return Math.min(1 + Math.floor(level / 2.5), 7);
}

export function getEnemySpeed(level: number): number {
  return Math.min(80 + level * 7, 200);
}

export function getEnergyDecay(level: number): number {
  return Math.min(0.08 + Math.sqrt(level) * 0.10, 0.55);
}

export function getPowerUpDelay(level: number): number {
  return Math.max(
    POWERUP.SPAWN_INTERVAL_BASE - (level - 1) * POWERUP.SPAWN_INTERVAL_DECREMENT,
    POWERUP.SPAWN_INTERVAL_MIN
  );
}

export function getScenarioName(level: number): string {
  const names = [
    'THE CRYPTS', 'THE HAUNTED DUNGEON', "PHANTOM'S LAIR",
    'THE DARK FOREST', 'THE ABANDONED MINE', 'THE SPECTRAL TOWER',
    'THE VOID GATE', 'THE ECHO CAVERNS', 'THE OBSIDIAN FORTRESS',
    'THE NEXUS'
  ];
  return names[(level - 1) % names.length];
}
