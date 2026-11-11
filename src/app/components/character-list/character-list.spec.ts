import { CharacterList } from './character-list';
import { Character } from '../../services/character.service';

describe('Stats section merging', () => {
  let list: CharacterList;
  const item = (id: number, status: string, daysAgo: number) => ({
    character: { id, status } as Character,
    timestamp: new Date(Date.now() - daysAgo * 86400000),
    chatCount: 1,
    weeklyChatCount: 0
  });

  beforeEach(() => { list = new CharacterList(); });

  for (const count of [0, 1, 3, 4, 5]) {
    it(`handles ${count} characters in the inactive section`, () => {
      const inactive = Array.from({ length: count }, (_, index) => item(-700 - index, 'inactive', 30 + index));
      const older = item(-710, 'active', 15);
      list.lastChattedCharacters = [...inactive, older];

      expect(list.inactiveChattedCharacters.length).toBe(count);
      expect(list.displayedOlderChattedCharacters).toEqual(count < 4 ? [] : [older]);
      expect(list.displayedInactiveChattedCharacters.length).toBe(count < 4 ? count + 1 : count);
      const displayed = [...list.displayedOlderChattedCharacters, ...list.displayedInactiveChattedCharacters];
      expect(new Set(displayed.map(entry => entry.character.id)).size).toBe(count + 1);
      expect(list.displayedInactiveChattedCharacters).toEqual(list.sortCharacters(list.displayedInactiveChattedCharacters));
    });
  }

  it('keeps retired and active chats out of the merged section', () => {
    const retired = item(-720, 'retired', 60);
    const inactive = item(-721, 'inactive', 30);
    const older = item(-722, 'active', 15);
    const active = item(-723, 'active', 10);
    localStorage.setItem('chatLink_-723', 'https://chatgpt.com/c/abcdef');
    try {
      list.lastChattedCharacters = [retired, inactive, older, active];
      expect(list.displayedInactiveChattedCharacters).toEqual([older, inactive]);
      expect(list.retiredChattedCharacters).toEqual([retired]);
      expect(list.activeChattedCharacters).toEqual([active]);
    } finally {
      localStorage.removeItem('chatLink_-723');
    }
  });
});
