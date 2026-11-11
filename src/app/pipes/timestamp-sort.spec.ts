import { SortCharactersPipe } from './sort-characters.pipe';
import { Character } from '../services/character.service';
import { RosterFilter } from '../components/roster-filter/roster-filter';

describe('Roster timestamp sorts', () => {
  const characters = [-901, -902, -903, -904].map(id => ({ id } as Character));
  const pipe = new SortCharactersPipe();

  beforeEach(() => {
    localStorage.setItem('chatLinkTimestamp_-901', '2026-11-01T12:00:00.000Z');
    localStorage.setItem('chatLinkTimestamp_-902', '2026-11-10T12:00:00.000Z');
    localStorage.setItem('chatLinkTimestamp_-904', 'invalid');
  });
  afterEach(() => characters.forEach(c => localStorage.removeItem('chatLinkTimestamp_' + c.id)));

  it('sorts recent first and leaves missing or invalid timestamps last', () => {
    expect(pipe.transform(characters, 'timestamp', 'desc').map(c => c.id))
      .toEqual([-902, -901, -903, -904]);
    expect(characters.map(c => c.id)).toEqual([-901, -902, -903, -904]);
  });

  it('sorts oldest first and leaves missing or invalid timestamps last', () => {
    expect(pipe.transform(characters, 'timestamp', 'asc').map(c => c.id))
      .toEqual([-901, -902, -903, -904]);
  });

  it('uses the parent timestamp for characters sharing chat stats', () => {
    const child = { id: -905, parentId: -902 } as Character;
    expect(pipe.transform([characters[0], child], 'timestamp', 'desc')[0]).toBe(child);
  });

  it('places the new sorts above ID and Name below both ID options', () => {
    const filter = new RosterFilter({} as any);
    expect(filter.sortOptions.map(option => option.value).slice(0, 6))
      .toEqual(['tier', 'recent', 'recentDesc', 'id', 'idDesc', 'shortName']);
  });
});
