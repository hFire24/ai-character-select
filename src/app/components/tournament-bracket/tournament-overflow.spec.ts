import { of } from 'rxjs';
import { TournamentBracket } from './tournament-bracket';
import { Character, CharacterService } from '../../services/character.service';

describe('Tournament overflow', () => {
  for (const preference of ['high', 'low'] as const) {
    it(`includes successive score groups for ${preference} seeds, including cutoff ties`, () => {
      const bracket = new TournamentBracket({} as CharacterService);
      bracket.seedPreference = preference;
      const score = (level: number) => preference === 'high' ? level : 11 - level;
      bracket.overflowCandidates = Array.from({ length: 141 }, (_, i) => ({
        id: i, moe: score(i < 10 ? 1 : i < 18 ? 2 : 3)
      } as Character));

      expect(bracket.requiredExclusions).toBe(13);
      expect(bracket.bottomSeedMoe).toBe(score(2));
      expect(bracket.visibleExclusionCandidates.length).toBe(18);
      for (const character of bracket.visibleExclusionCandidates.slice(0, 13)) {
        bracket.toggleExclusion(character.id);
      }
      expect(bracket.excludedOverflowIds.size).toBe(13);

      bracket.showAllExclusionCandidates = true;
      expect(bracket.visibleExclusionCandidates.length).toBe(141);
    });

    it(`stops at a sufficient score group for ${preference} seeds`, () => {
      const bracket = new TournamentBracket({} as CharacterService);
      bracket.seedPreference = preference;
      bracket.overflowCandidates = Array.from({ length: 141 }, (_, i) => ({
        id: i, moe: preference === 'high' ? (i < 13 ? 2 : 4) : (i < 13 ? 9 : 7)
      } as Character));
      expect(bracket.visibleExclusionCandidates.length).toBe(13);
    });
  }

  function create(size: number, count: number) {
    const characters = Array.from({ length: count }, (_, i) => ({
      id: i + 1000, shortName: 'Character ' + i, status: 'active', tier: 1, moe: i % 10
    } as Character));
    characters.push({ id: 9999, status: 'future', tier: 10 } as Character);
    const bracket = new TournamentBracket({ getCharactersSplitTwins: () => of(characters) } as CharacterService);
    bracket.bracketSize = size;
    bracket.ngOnInit();
    return bracket;
  }

  it('requires exactly the excess exclusions before starting 128 players', () => {
    const bracket = create(128, 130);
    expect(bracket.choosingExclusions).toBeTrue();
    expect(bracket.requiredExclusions).toBe(2);
    bracket.toggleExclusion(1000);
    bracket.confirmExclusions();
    expect(bracket.players.length).toBe(0);
    bracket.toggleExclusion(1001);
    bracket.toggleExclusion(1002);
    expect(bracket.excludedOverflowIds.size).toBe(2);
    bracket.confirmExclusions();
    expect(bracket.players.length).toBe(128);
    expect(bracket.players.some(c => c.id === 1000 || c.id === 1001 || c.id === 9999)).toBeFalse();
  });

  it('starts immediately at exactly 128 eligible characters', () => {
    const bracket = create(128, 128);
    expect(bracket.choosingExclusions).toBeFalse();
    expect(bracket.players.length).toBe(128);
  });

  for (const size of [64, 8]) {
    it('does not prompt for a ' + size + '-player bracket', () => {
      const bracket = create(size, 130);
      expect(bracket.choosingExclusions).toBeFalse();
      expect(bracket.players.length).toBe(size);
    });
  }
});
