import { of } from 'rxjs';
import { Hangouts } from './hangouts';
import { Character, CharacterService } from '../../services/character.service';

describe('Hangout room persistence', () => {
  const character = { id: 100, shortName: 'Test', name: 'Test', img: 'main/Test.png', status: 'active', tier: 1 } as Character;
  const service = {
    getCharactersSplitTwins: () => of([character, { id: 101, tier: 10 } as Character]),
    getBonusCharacters: () => []
  } as unknown as CharacterService;

  function open() {
    const page = new Hangouts(service);
    page.ngOnInit();
    return page;
  }

  beforeEach(() => {
    localStorage.clear();
    spyOn(console, 'log');
  });
  afterEach(() => localStorage.clear());

  it('restores room names, occupants, empty rooms, and room capacity', () => {
    const page = open();
    page.rooms = [{ name: 'Friends', characters: [character] }, { name: 'Empty', characters: [] }];
    page.maxCharacters = 4;
    page.ngDoCheck();
    const restored = open();
    expect(restored.rooms).toEqual(page.rooms);
    expect(restored.maxCharacters).toBe(4);
    expect(restored.characters.some(c => c.id === character.id)).toBeFalse();
  });

  it('permanently removes rooms and clears stale selections on reset', () => {
    const page = open();
    page.rooms = [{ name: 'Friends', characters: [character] }];
    page.ngDoCheck();
    page.selectedRoomChar = { roomIdx: 0, charIdx: 0 };
    page.draggedCharacter = character;
    page.dragSource = 0;
    spyOn(window, 'confirm').and.returnValue(true);
    page.resetRooms();
    expect(page.rooms).toEqual([]);
    expect(page.selectedRoomChar).toBeNull();
    expect(page.draggedCharacter).toBeNull();
    expect(page.dragSource).toBeNull();
    expect(open().rooms).toEqual([]);
    expect(open().characters.some(c => c.id === character.id)).toBeTrue();
  });

  it('keeps saved rooms when reset is canceled', () => {
    const page = open();
    page.rooms = [{ name: 'Friends', characters: [character] }];
    page.ngDoCheck();
    spyOn(window, 'confirm').and.returnValue(false);
    page.resetRooms();
    expect(open().rooms).toEqual(page.rooms);
    expect(page.rooms.length).toBe(1);
  });
});
