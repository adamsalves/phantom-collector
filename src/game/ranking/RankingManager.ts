const STORAGE_KEY = 'phantom_ranking';
const MAX_ENTRIES = 10;

export interface RankingEntry {
  name: string;
  score: number;
  date: string;
}

export class RankingManager {
  static getScores(): RankingEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const entries: RankingEntry[] = JSON.parse(raw);
      return entries.sort((a, b) => b.score - a.score).slice(0, MAX_ENTRIES);
    } catch {
      return [];
    }
  }

  static saveScore(name: string, score: number): void {
    const entries = RankingManager.getScores();
    const displayName = name.trim() || '---';
    entries.push({ name: displayName, score, date: new Date().toISOString().slice(0, 10) });
    entries.sort((a, b) => b.score - a.score);
    if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // localStorage cheio ou indisponível — ignora silenciosamente
    }
  }

  static isHighScore(score: number): boolean {
    const entries = RankingManager.getScores();
    if (entries.length < MAX_ENTRIES) return true;
    return score > entries[entries.length - 1].score;
  }

  static clearScores(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignora
    }
  }
}
