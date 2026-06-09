export function getCoinValue(type: 'gold' | 'silver' | 'rainbow'): number {
  switch (type) {
    case 'silver':
      return 25;
    case 'rainbow':
      return 50;
    case 'gold':
    default:
      return 10;
  }
}

export function getCoinEnergy(type: 'gold' | 'silver' | 'rainbow'): number {
  switch (type) {
    case 'silver':
      return 25;
    case 'rainbow':
      return 35;
    case 'gold':
    default:
      return 20;
  }
}

export function pickCoinType(roll: number = Math.random()): 'gold' | 'silver' | 'rainbow' {
  if (roll < 0.05) {
    return 'rainbow';
  }
  if (roll < 0.20) {
    return 'silver';
  }
  return 'gold';
}
