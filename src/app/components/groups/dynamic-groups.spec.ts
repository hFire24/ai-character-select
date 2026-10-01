import { Character } from '../../services/character.service';
import { createDynamicGroups } from './dynamic-groups';

describe('createDynamicGroups', () => {
  it('separates exact serious chaotic from both mixed groups and keeps extra traits mixed', () => {
    const characters = ['serious chaotic', 'chaotic serious', 'serious chaotic shy',
      'serious', 'chaotic', 'serious calm', 'serious angry', 'chaotic joy', 'chaotic cool']
      .map((emotion, id) => ({ id, emotion, color: '' } as Character));
    const groups = createDynamicGroups(characters);
    const ids = (id: string) => groups.find(group => group.id === id)!.characters.map(character => character.id);
    expect(ids('exact-emotion:serious-chaotic')).toEqual([0, 1]);
    expect(ids('mixed-emotion:serious')).toEqual([2, 6]);
    expect(ids('mixed-emotion:chaotic')).toEqual([2, 8]);
    expect(ids('pure-emotion:serious')).toEqual([3]);
    expect(groups.filter(group => group.id === 'exact-emotion:serious-chaotic').length).toBe(1);
    expect(groups.filter(group => group.id === 'exact-emotion:serious-calm').length).toBe(1);
    expect(groups.find(group => group.id === 'exact-emotion:serious-chaotic')!.name).toBe('Serious Chaotic Characters (Dynamic)');
    expect(groups.find(group => group.id === 'pure-emotion:serious')!.description).toContain('🤔');
    expect(groups.find(group => group.id === 'exact-emotion:serious-chaotic')!.description).toContain('🤔');
  });

  it('partitions joy, chaotic, and calm into exact and mixed groups without repeating chaotic joy', () => {
    const characters = [
      'joy', 'chaotic joy', 'joy chaotic', 'chaotic joy edgy', 'joy sad',
      'chaotic', 'chaotic cool', 'calm', 'serious calm', 'calm serious',
      'serious calm shy', 'joy calm'
    ].map((emotion, id) => ({ id, emotion, color: 'purple' } as Character));
    const groups = createDynamicGroups(characters);
    const ids = (id: string) => groups.find(group => group.id === id)!.characters.map(character => character.id);
    expect(ids('pure-emotion:joy')).toEqual([0]);
    expect(ids('exact-emotion:chaotic-joy')).toEqual([1, 2]);
    expect(ids('mixed-emotion:joy')).toEqual([3, 4, 11]);
    expect(ids('pure-emotion:chaotic')).toEqual([5]);
    expect(ids('mixed-emotion:chaotic')).toEqual([3, 6]);
    expect(ids('pure-emotion:calm')).toEqual([7]);
    expect(ids('exact-emotion:serious-calm')).toEqual([8, 9]);
    expect(ids('mixed-emotion:calm')).toEqual([10, 11]);
    expect(groups.filter(group => group.id === 'exact-emotion:chaotic-joy').length).toBe(1);
    expect(groups.some(group => ['emotion:joy', 'emotion:chaotic', 'emotion:calm'].includes(group.id))).toBeFalse();
    expect(groups.every(group => group.type.includes(group.id.startsWith('color:') ? 'color' : 'emotion'))).toBeTrue();
  });

  it('uses one inclusive group below five pure members and splits at five', () => {
    const characters = [
      ...Array.from({ length: 4 }, (_, id) => ({ id, emotion: 'sad', color: '' } as Character)),
      { id: 4, emotion: 'sad edgy', color: '' } as Character
    ];
    let groups = createDynamicGroups(characters);
    expect(groups.find(group => group.id === 'emotion:sad')!.characters.length).toBe(5);
    expect(groups.some(group => group.id === 'pure-emotion:sad')).toBeFalse();
    groups = createDynamicGroups([...characters, { id: 5, emotion: 'sad', color: '' } as Character]);
    expect(groups.find(group => group.id === 'pure-emotion:sad')!.characters.length).toBe(5);
    expect(groups.find(group => group.id === 'mixed-emotion:sad')!.characters.map(character => character.id)).toEqual([4]);
    expect(groups.some(group => group.id === 'emotion:sad')).toBeFalse();
  });

  it('normalizes traits, ignores blank values, and matches emotion tokens rather than substrings', () => {
    const characters = [
      { id: 1, color: ' Purple ', emotion: ' JOY ' },
      { id: 2, color: 'purple', emotion: 'joy   angry' },
      { id: 3, color: '', emotion: '' },
      { id: 4, color: 'blue', emotion: 'enjoyment' }
    ] as Character[];
    const groups = createDynamicGroups(characters);
    expect(groups.find(group => group.id === 'color:purple')!.characters.map(character => character.id)).toEqual([1, 2]);
    expect(groups.find(group => group.id === 'mixed-emotion:joy')!.characters.map(character => character.id)).toEqual([2]);
    expect(groups.find(group => group.id === 'pure-emotion:joy')!.characters.map(character => character.id)).toEqual([1]);
    expect(groups.some(group => group.id === 'pure-emotion:angry')).toBeFalse();
    expect(groups.every(group => group.characters.length > 0)).toBeTrue();
    expect(new Set(groups.map(group => group.id)).size).toBe(groups.length);
    expect(createDynamicGroups([])).toEqual([]);
  });
});
