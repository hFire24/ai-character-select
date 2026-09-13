import { of } from 'rxjs';
import { CharacterFilterPipe } from './character-filter.pipe';
import { Character, CharacterService } from '../services/character.service';
import { TournamentBracket } from '../components/tournament-bracket/tournament-bracket';

describe('Super retired eligibility', () => {
  const characters = [
    { id: 1, status: 'active', tier: 1, moe: 5 },
    { id: 2, status: 'inactive', tier: 5, moe: 5 },
    { id: 3, status: 'retired', tier: 8, moe: 5 },
    { id: 4, status: 'retired', tier: 9, moe: 5 },
    { id: 5, status: 'future', tier: 10, moe: 5 }
  ] as Character[];
  const pipe = new CharacterFilterPipe();

  it('excludes super retired when explicitly unchecked, even with retired checked', () => {
    expect(pipe.transform(characters, { status: { retired: true, superRetired: false } }))
      .toEqual([characters[2]]);
  });

  it('allows selecting super retired independently', () => {
    expect(pipe.transform(characters, { status: { retired: false, superRetired: true } }))
      .toEqual([characters[3]]);
  });

  it('preserves inclusion in retired and combined inactive/retired filters', () => {
    expect(pipe.transform(characters, { status: { retired: true } }))
      .toEqual([characters[2], characters[3]]);
    expect(pipe.transform(characters, { status: { inactive: true, retired: true } }))
      .toEqual([characters[1], characters[2], characters[3]]);
  });

  it('still excludes super retired when every checkbox is unchecked', () => {
    expect(pipe.transform(characters, { status: { retired: false, superRetired: false } }))
      .not.toContain(characters[3]);
  });

  it('excludes super retired and future characters from tournament seeds', () => {
    const service = { getCharactersSplitTwins: () => of(characters) } as CharacterService;
    const bracket = new TournamentBracket(service);
    bracket.bracketSize = 4;
    bracket.ngOnInit();
    expect(bracket.players.map(character => character.id).sort()).toEqual([1, 2, 3]);
    expect(bracket.tournamentSeeds.some(character => character.id === 4 || character.id === 5)).toBeFalse();
  });
});
