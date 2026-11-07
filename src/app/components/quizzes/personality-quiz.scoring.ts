import { CHARACTERS, SCORING_CONFIG } from './personality-quiz.content';
import { BipolarQuestion, CharacterId, CHARACTER_IDS, QuizContent, QuizResult, SCALE_IDS, ScaleId } from './personality-quiz.types';

export type Responses = Record<string, string>;

// Seeded Fisher-Yates: stable for a given attempt and salt, with no fixed name preference.
export function shuffled<T>(items: readonly T[], seed: number, salt: string): T[] {
  let state = seed >>> 0;
  for (const char of salt) state = (Math.imul(state, 31) + char.charCodeAt(0)) >>> 0;
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    const other = Math.floor((((value ^ (value >>> 14)) >>> 0) / 4294967296) * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

export function scalePositions(questions: BipolarQuestion[], responses: Responses): Record<ScaleId, number> {
  return Object.fromEntries(SCALE_IDS.map(scale => {
    const items = questions.filter(question => question.scale === scale);
    const values = items.map(question => question.options.find(option => option.id === responses[question.id])?.value);
    if (!values.length || values.some(value => value === undefined)) throw new Error(`Incomplete ${scale} responses`);
    // Inputs are binary-exact halves, so sums and all equality comparisons remain exact here.
    const total = values.reduce<number>((sum, value) => sum + value!, 0);
    return [scale, total / values.length];
  })) as Record<ScaleId, number>;
}

export function baseAffinity(id: CharacterId, scales: Record<ScaleId, number>): number {
  const character = CHARACTERS[id];
  return character.pole === 1 ? scales[character.scale] : 1 - scales[character.scale];
}

export function shortlist(content: QuizContent, responses: Responses, seed: number): CharacterId[] {
  const scales = scalePositions(content.foundation, responses);
  return shuffled(CHARACTER_IDS, seed, 'shortlist').sort((a, b) => baseAffinity(b, scales) - baseAffinity(a, scales)).slice(0, 4);
}

export function calculateResult(content: QuizContent, responses: Responses, seed: number,
  explorationPointWeight: number = SCORING_CONFIG.explorationPointWeight): QuizResult {
  if (!Number.isFinite(explorationPointWeight) || explorationPointWeight < 0) throw new Error('Invalid exploration weight');
  const directQuestions = [...content.foundation, ...content.refinement];
  const scales = scalePositions(directQuestions, responses);
  const candidates = shortlist(content, responses, seed);
  const counts = Object.fromEntries(CHARACTER_IDS.map(id => [id, 0])) as Record<CharacterId, number>;
  for (const question of content.exploration) {
    const id = responses[question.id] as CharacterId;
    if (!candidates.includes(id)) throw new Error(`Invalid or incomplete response: ${question.id}`);
    counts[id]++;
  }
  const ranking = shuffled(CHARACTER_IDS, seed, 'ranking').map(id => {
    // 5 observations per scale. Work in half-point integer units so complementary
    // poles receive identical exact base scores when mathematically tied.
    const sum = directQuestions.filter(q => q.scale === CHARACTERS[id].scale)
      .reduce((total, q) => total + q.options.find(o => o.id === responses[q.id])!.value * 2, 0);
    const baseScore = (CHARACTERS[id].pole === 1 ? sum : 10 - sum) * 10;
    return { id, baseScore, explorationCount: counts[id], rankingScore: baseScore + explorationPointWeight * counts[id] };
  }).sort((a, b) => b.rankingScore - a.rankingScore);
  return { scales, ranking, tied: ranking.filter(entry => entry.rankingScore === ranking[0].rankingScore).map(entry => entry.id) };
}

export function tieVotes(content: QuizContent, responses: Responses, contenders: readonly CharacterId[]): Record<CharacterId, number> {
  const votes = Object.fromEntries(CHARACTER_IDS.map(id => [id, 0])) as Record<CharacterId, number>;
  for (const question of content.tiebreakers) {
    const id = responses[question.id] as CharacterId;
    if (!contenders.includes(id)) throw new Error(`Invalid or incomplete tie response: ${question.id}`);
    votes[id]++;
  }
  return votes;
}
