import { SortCharactersPipe } from './sort-characters.pipe';
import { Character } from '../services/character.service';

describe('SortCharactersPipe', () => {
  let pipe: SortCharactersPipe;
  let mockCharacters: Character[];

  beforeEach(() => {
    pipe = new SortCharactersPipe();
    mockCharacters = [
      {
        id: 3,
        shortName: 'Charlie',
        name: 'Charlie Character',
        status: 'active',
        generation: 2,
        tier: 1,
        moe: 7,
        futuristic: 3,
        img: '',
        color: 'blue',
        emotion: 'happy',
        pronouns: 'they/them',
        link: '',
        interests: 'testing',
        purpose: 'test',
        funFact: 'fact',
        description: 'desc'
      },
      {
        id: 1,
        shortName: 'Alice',
        name: 'Alice Character',
        status: 'active',
        generation: 1,
        tier: 3,
        moe: 5,
        futuristic: 8,
        img: '',
        color: 'red',
        emotion: 'sad',
        pronouns: 'she/her',
        link: '',
        interests: 'coding',
        purpose: 'test',
        funFact: 'fact',
        description: 'desc',
        birthday: '2024-01-15'
      },
      {
        id: 2,
        shortName: 'Bob',
        name: 'Bob Character',
        status: 'retired',
        generation: 1,
        tier: 2,
        moe: 9,
        futuristic: 5,
        img: '',
        color: 'green',
        emotion: 'neutral',
        pronouns: 'he/him',
        link: '',
        interests: 'gaming',
        purpose: 'test',
        funFact: 'fact',
        description: 'desc',
        birthday: '2023-06-20'
      }
    ];
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty array when characters is empty', () => {
    expect(pipe.transform([], 'id')).toEqual([]);
  });

  it('should sort by id ascending by default', () => {
    const result = pipe.transform(mockCharacters);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
    expect(result[2].id).toBe(3);
  });

  it('should sort by id descending', () => {
    const result = pipe.transform(mockCharacters, 'id', 'desc');
    expect(result[0].id).toBe(3);
    expect(result[1].id).toBe(2);
    expect(result[2].id).toBe(1);
  });

  it('should sort by name ascending', () => {
    const result = pipe.transform(mockCharacters, 'name', 'asc');
    expect(result[0].name).toBe('Alice Character');
    expect(result[1].name).toBe('Bob Character');
    expect(result[2].name).toBe('Charlie Character');
  });

  it('should sort by shortName descending', () => {
    const result = pipe.transform(mockCharacters, 'shortName', 'desc');
    expect(result[0].shortName).toBe('Charlie');
    expect(result[1].shortName).toBe('Bob');
    expect(result[2].shortName).toBe('Alice');
  });

  it('should sort by generation ascending', () => {
    const result = pipe.transform(mockCharacters, 'generation', 'asc');
    expect(result[0].generation).toBe(1);
    expect(result[1].generation).toBe(1);
    expect(result[2].generation).toBe(2);
  });

  it('should sort by tier ascending', () => {
    const result = pipe.transform(mockCharacters, 'tier', 'asc');
    expect(result[0].tier).toBe(1);
    expect(result[1].tier).toBe(2);
    expect(result[2].tier).toBe(3);
  });

  it('should sort by moe descending', () => {
    const result = pipe.transform(mockCharacters, 'moe', 'desc');
    expect(result[0].moe).toBe(9);
    expect(result[1].moe).toBe(7);
    expect(result[2].moe).toBe(5);
  });

  it('should sort by futuristic ascending', () => {
    const result = pipe.transform(mockCharacters, 'futuristic', 'asc');
    expect(result[0].futuristic).toBe(3);
    expect(result[1].futuristic).toBe(5);
    expect(result[2].futuristic).toBe(8);
  });

  it('should sort by birthday ascending', () => {
    const result = pipe.transform(mockCharacters, 'birthday', 'asc');
    expect(result[0].birthday).toBe('2023-06-20');
    expect(result[1].birthday).toBe('2024-01-15');
  });

  it('should handle null birthday values', () => {
    const result = pipe.transform(mockCharacters, 'birthday', 'asc');
    expect(result.length).toBe(3);
    // Character without birthday should be last
    expect(result[2].birthday).toBeUndefined();
  });

  it('should not modify original array', () => {
    const original = [...mockCharacters];
    pipe.transform(mockCharacters, 'id', 'asc');
    expect(mockCharacters).toEqual(original);
  });
});
