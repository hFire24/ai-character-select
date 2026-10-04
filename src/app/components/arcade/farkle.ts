// Arcade house rules: triples, single ones/fives, and doubling four-plus of a kind.
// Combinations must be made within one roll; a non-scoring selected die is invalid.
export function scoreDice(dice: number[]): number {
  if (!dice.length || dice.some(d => !Number.isInteger(d) || d < 1 || d > 6)) return 0;
  const counts = Array.from({ length: 6 }, (_, i) => dice.filter(d => d === i + 1).length);
  if (dice.length === 6 && counts.every(n => n === 1)) return 1500;
  if (dice.length === 6 && counts.filter(n => n === 2).length === 3) return 1500;
  let score = 0;
  for (let i = 0; i < 6; i++) {
    const n = counts[i];
    if (n >= 3) score += (i === 0 ? 1000 : (i + 1) * 100) * 2 ** (n - 3);
    else if (i === 0) score += n * 100;
    else if (i === 4) score += n * 50;
    else if (n) return 0;
  }
  return score;
}

export function bestSelection(dice: number[]): { indices: number[]; score: number } {
  let best = { indices: [] as number[], score: 0 };
  for (let mask = 1; mask < 1 << dice.length; mask++) {
    const indices = dice.map((_, i) => i).filter(i => mask & (1 << i));
    const score = scoreDice(indices.map(i => dice[i]));
    if (score > best.score) best = { indices, score };
  }
  return best;
}
