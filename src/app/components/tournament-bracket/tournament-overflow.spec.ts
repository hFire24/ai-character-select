import { of } from 'rxjs';
import { TournamentBracket } from './tournament-bracket';
import { Character, CharacterService } from '../../services/character.service';

describe('Tournament overflow', () => {
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
