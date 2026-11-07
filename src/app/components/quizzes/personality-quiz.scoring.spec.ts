import { CHARACTERS, QUIZ_CONTENT } from './personality-quiz.content';
import { fixtureContent, fixtureResponses } from './personality-quiz.fixtures';
import { calculateResult, scalePositions, shuffled, shortlist, tieVotes } from './personality-quiz.scoring';
import { CHARACTER_IDS, SCALE_IDS } from './personality-quiz.types';
import { validateContent } from './personality-quiz.validation';

describe('Personality quiz content and scoring', () => {
  const seed = 17;
  const content = fixtureContent();

  it('has exactly 35 main questions and five conditional prompts, with balanced scales', () => {
    expect(content.foundation.length + content.exploration.length + content.refinement.length).toBe(35);
    expect(content.tiebreakers.length).toBe(5);
    for (const scale of SCALE_IDS) {
      expect(content.foundation.filter(q => q.scale === scale).length).toBe(4);
      expect(content.refinement.filter(q => q.scale === scale).length).toBe(1);
    }
    expect(validateContent(content)).toEqual({ errors: [], pending: [], ready: true });
    expect(validateContent(QUIZ_CONTENT).errors).toEqual([]);
    expect(validateContent(QUIZ_CONTENT).ready).toBeFalse();
  });

  it('detects missing copy, missing keys, malformed options, phases, scales, and IDs', () => {
    const broken = fixtureContent();
    broken.foundation[0].options[1].value = 0;
    broken.foundation[0].prompt = '';
    broken.foundation[0].scale = 'SOCIAL';
    broken.exploration[0].id = 'F01';
    delete (broken.exploration[0].answers as Partial<typeof broken.exploration[0]['answers']>).maddie;
    broken.refinement[0].phase = 1;
    const report = validateContent(broken);
    expect(report.errors.length).toBeGreaterThan(4);
    expect(report.pending).toContain('F01 prompt');
    expect(report.ready).toBeFalse();
  });

  it('supports both poles and neutral and uses all five direct observations', () => {
    const responses = fixtureResponses(content, seed);
    expect(scalePositions([...content.foundation, ...content.refinement], responses).CARE).toBe(0.5);
    content.foundation.filter(q => q.scale === 'CARE').forEach(q => responses[q.id] = `${q.id}-A`);
    responses['R01'] = 'R01-B';
    const positions = scalePositions([...content.foundation, ...content.refinement], responses);
    expect(positions.CARE).toBe(0.2);
    expect((1 - positions.CARE) + positions.CARE).toBe(1);
  });

  it('selects four distinct candidates reproducibly and varies tied boundaries across attempts', () => {
    const responses = fixtureResponses(content, seed);
    const selected = shortlist(content, responses, seed);
    expect(selected.length).toBe(4);
    expect(new Set(selected).size).toBe(4);
    expect(shortlist(content, responses, seed)).toEqual(selected);
    const selections = new Set(Array.from({ length: 25 }, (_, i) => shortlist(content, responses, i).join(',')));
    expect(selections.size).toBeGreaterThan(1);
    expect(shuffled(selected, seed, 'E01')).toEqual(shuffled(selected, seed, 'E01'));
  });

  it('keeps exploration points out of the bars and applies configurable weight', () => {
    const responses = fixtureResponses(content, seed);
    const result = calculateResult(content, responses, seed);
    const heavier = calculateResult(content, responses, seed, 2);
    expect(result.scales).toEqual(heavier.scales);
    expect(result.ranking[0].rankingScore).toBe(60);
    expect(heavier.ranking[0].rankingScore).toBe(70);
    expect(result.ranking.reduce((sum, entry) => sum + entry.explorationCount, 0)).toBe(10);
    expect(result.ranking.length).toBe(9);
    expect(Object.keys(CHARACTERS).sort()).toEqual([...CHARACTER_IDS].sort());
  });

  it('allows a girl outside the four candidates to lead after refinement', () => {
    const responses = fixtureResponses(content, seed, [3, 3, 2, 2]);
    const selected = shortlist(content, responses, seed);
    const outsider = CHARACTER_IDS.find(id => !selected.includes(id))!;
    const identity = CHARACTERS[outsider];
    const question = content.refinement.find(q => q.scale === identity.scale)!;
    responses[question.id] = `${question.id}-${identity.pole === 1 ? 'B' : 'A'}`;
    const result = calculateResult(content, responses, seed);
    expect(result.tied).toEqual([outsider]);
  });

  it('detects exact two-way and multiway top ties and excludes merely close scores', () => {
    expect(calculateResult(content, fixtureResponses(content, seed, [5, 5, 0, 0]), seed).tied.length).toBe(2);
    expect(calculateResult(content, fixtureResponses(content, seed, [3, 3, 3, 1]), seed).tied.length).toBe(3);
    expect(calculateResult(content, fixtureResponses(content, seed, [4, 3, 2, 1]), seed).tied.length).toBe(1);
  });

  it('preserves exact complementary equality and keeps ranking points distinct from percentages', () => {
    const responses = fixtureResponses(content, seed);
    for (const q of [...content.foundation, ...content.refinement]) responses[q.id] = `${q.id}-B`;
    const candidates = shortlist(content, responses, seed);
    content.exploration.forEach(q => responses[q.id] = candidates[0]);
    const result = calculateResult(content, responses, seed);
    expect(result.ranking[0].rankingScore).toBe(110);
    expect(result.scales.HEART).toBe(1);
    expect(result.ranking.every(entry => CHARACTER_IDS.includes(entry.id))).toBeTrue();
  });

  it('rejects incomplete direct, exploration, and noncontender tie responses', () => {
    const responses = fixtureResponses(content, seed);
    delete responses['F01'];
    expect(() => calculateResult(content, responses, seed)).toThrow();
    const invalid = fixtureResponses(content, seed);
    invalid['E01'] = 'notMaddie';
    expect(() => calculateResult(content, invalid, seed)).toThrow();
    content.tiebreakers.forEach(q => invalid[q.id] = 'crimson');
    expect(() => tieVotes(content, invalid, ['maddie', 'cyan'])).toThrow();
  });
});
