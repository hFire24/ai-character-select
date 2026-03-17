import { CharacterFilterPipe, CharacterFilters, CharacterFilterOptions } from './character-filter.pipe';
import { Character } from '../services/character.service';

describe('CharacterFilterPipe', () => {
  let pipe: CharacterFilterPipe;
  let mockCharacters: Character[];

  beforeEach(() => {
    pipe = new CharacterFilterPipe();
    mockCharacters = [
      {
        id: 1,
        shortName: 'Active1',
        name: 'Active Character',
        status: 'active',
        img: '',
        generation: 1,
        tier: 1,
        color: 'blue',
        moe: 5,
        futuristic: 5,
        emotion: 'happy',
        pronouns: 'they/them',
        link: '',
        interests: 'testing',
        purpose: 'test',
        funFact: 'fact',
        description: 'desc'
      },
      {
        id: 2,
        shortName: 'Retired1',
        name: 'Retired Character',
        status: 'retired',
        img: '',
        generation: 1,
        tier: 1,
        color: 'red',
        moe: 5,
        futuristic: 5,
        emotion: 'sad',
        pronouns: 'she/her',
        link: '',
        interests: 'resting',
        purpose: 'test',
        funFact: 'fact',
        description: 'desc'
      },
      {
        id: 3,
        shortName: 'Side1',
        name: 'Side Character',
        status: 'side',
        img: '',
        generation: 1,
        tier: 1,
        color: 'green',
        moe: 5,
        futuristic: 5,
        emotion: 'neutral',
        pronouns: 'he/him',
        link: '',
        interests: 'supporting',
        purpose: 'test',
        funFact: 'fact',
        description: 'desc',
        musicEnjoyer: true
      },
      {
        id: 4,
        shortName: 'MoeChar',
        name: 'Very Moe Character',
        status: 'active',
        img: '',
        generation: 2,
        tier: 2,
        color: 'pink',
        moe: 9,
        futuristic: 2,
        emotion: 'cute',
        pronouns: 'she/her',
        link: '',
        interests: 'being cute',
        purpose: 'test',
        funFact: 'fact',
        description: 'desc'
      }
    ];
  });

  describe('Simple Filter Interface (Backwards Compatibility)', () => {
    it('should create an instance', () => {
      expect(pipe).toBeTruthy();
    });

    it('should return empty array when characters is null', () => {
      const filters: CharacterFilters = { active: true, inactive: false, retired: false, side: false };
      expect(pipe.transform(null as any, filters)).toEqual([]);
    });

    it('should filter active characters', () => {
      const filters: CharacterFilters = { active: true, inactive: false, retired: false, side: false };
      const result = pipe.transform(mockCharacters, filters);
      expect(result.length).toBe(2); // Active1 and MoeChar
      expect(result.every(c => c.status === 'active')).toBe(true);
    });

    it('should filter retired characters', () => {
      const filters: CharacterFilters = { active: false, inactive: false, retired: true, side: false };
      const result = pipe.transform(mockCharacters, filters);
      expect(result.length).toBe(1);
      expect(result[0].shortName).toBe('Retired1');
    });

    it('should filter side characters', () => {
      const filters: CharacterFilters = { active: false, inactive: false, retired: false, side: true };
      const result = pipe.transform(mockCharacters, filters);
      expect(result.length).toBe(1);
      expect(result[0].shortName).toBe('Side1');
    });

    it('should filter multiple character types', () => {
      const filters: CharacterFilters = { active: true, inactive: false, retired: true, side: false };
      const result = pipe.transform(mockCharacters, filters);
      expect(result.length).toBe(3); // Active1, MoeChar, Retired1
    });

    it('should search by shortName', () => {
      const filters: CharacterFilters = { active: true, inactive: false, retired: false, side: false };
      const result = pipe.transform(mockCharacters, filters, 'Active1');
      expect(result.length).toBe(1);
      expect(result[0].shortName).toBe('Active1');
    });

    it('should search by name (case insensitive)', () => {
      const filters: CharacterFilters = { active: true, inactive: false, retired: false, side: false };
      const result = pipe.transform(mockCharacters, filters, 'retired character');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Retired Character');
    });

    it('should ignore filters when searching', () => {
      const filters: CharacterFilters = { active: true, inactive: false, retired: false, side: false };
      const result = pipe.transform(mockCharacters, filters, 'Retired1');
      expect(result.length).toBe(1);
      expect(result[0].status).toBe('retired');
    });

    it('should return empty array when search does not match', () => {
      const filters: CharacterFilters = { active: true, inactive: false, retired: false, side: false };
      const result = pipe.transform(mockCharacters, filters, 'NonExistent');
      expect(result.length).toBe(0);
    });
  });

  describe('Advanced Filter Interface', () => {
    it('should filter by status using advanced options', () => {
      const options: CharacterFilterOptions = {
        status: { active: true, retired: true }
      };
      const result = pipe.transform(mockCharacters, options);
      expect(result.length).toBe(3); // Active1, MoeChar, Retired1
    });

    it('should filter by tier range', () => {
      const options: CharacterFilterOptions = {
        tier: { min: 2, max: 2 }
      };
      const result = pipe.transform(mockCharacters, options);
      expect(result.length).toBe(1);
      expect(result[0].shortName).toBe('MoeChar');
    });

    it('should filter by favorite tier', () => {
      const options: CharacterFilterOptions = {
        tier: { favorite: true }
      };
      const result = pipe.transform(mockCharacters, options);
      expect(result.length).toBe(4); // All have tier 1-2
    });

    it('should exclude specific tiers', () => {
      const options: CharacterFilterOptions = {
        tier: { exclude: [1] }
      };
      const result = pipe.transform(mockCharacters, options);
      expect(result.length).toBe(1);
      expect(result[0].tier).toBe(2);
    });

    it('should filter by moe range', () => {
      const options: CharacterFilterOptions = {
        attributes: {
          moe: { min: 7 }
        }
      };
      const result = pipe.transform(mockCharacters, options);
      expect(result.length).toBe(1);
      expect(result[0].shortName).toBe('MoeChar');
    });

    it('should filter by futuristic range', () => {
      const options: CharacterFilterOptions = {
        attributes: {
          futuristic: { max: 4 }
        }
      };
      const result = pipe.transform(mockCharacters, options);
      expect(result.length).toBe(1);
      expect(result[0].shortName).toBe('MoeChar');
    });

    it('should filter by colors', () => {
      const options: CharacterFilterOptions = {
        attributes: {
          colors: ['pink', 'red']
        }
      };
      const result = pipe.transform(mockCharacters, options);
      expect(result.length).toBe(2); // Retired1 (red), MoeChar (pink)
    });

    it('should filter by pronouns', () => {
      const options: CharacterFilterOptions = {
        attributes: {
          pronouns: ['she/her']
        }
      };
      const result = pipe.transform(mockCharacters, options);
      expect(result.length).toBe(2); // Retired1, MoeChar
    });

    it('should filter music enjoyers', () => {
      const options: CharacterFilterOptions = {
        attributes: {
          musicEnjoyer: true
        }
      };
      const result = pipe.transform(mockCharacters, options);
      expect(result.length).toBe(1);
      expect(result[0].shortName).toBe('Side1');
    });

    it('should exclude music enjoyers', () => {
      const options: CharacterFilterOptions = {
        attributes: {
          musicEnjoyer: false
        }
      };
      const result = pipe.transform(mockCharacters, options);
      expect(result.length).toBe(3); // All except Side1
    });

    it('should exclude by IDs', () => {
      const options: CharacterFilterOptions = {
        exclude: {
          ids: [1, 3]
        }
      };
      const result = pipe.transform(mockCharacters, options);
      expect(result.length).toBe(2);
      expect(result.every(c => ![1, 3].includes(c.id))).toBe(true);
    });

    it('should exclude by names', () => {
      const options: CharacterFilterOptions = {
        exclude: {
          names: ['Active1', 'Side1']
        }
      };
      const result = pipe.transform(mockCharacters, options);
      expect(result.length).toBe(2);
      expect(result.find(c => c.shortName === 'Active1')).toBeUndefined();
    });

    it('should exclude by status', () => {
      const options: CharacterFilterOptions = {
        exclude: {
          statuses: ['retired']
        }
      };
      const result = pipe.transform(mockCharacters, options);
      expect(result.find(c => c.status === 'retired')).toBeUndefined();
    });

    it('should filter with search', () => {
      const options: CharacterFilterOptions = {
        search: 'moe'
      };
      const result = pipe.transform(mockCharacters, options);
      expect(result.length).toBe(1);
      expect(result[0].shortName).toBe('MoeChar');
    });

    it('should use custom filter function', () => {
      const options: CharacterFilterOptions = {
        customFilter: (char) => char.generation === 2
      };
      const result = pipe.transform(mockCharacters, options);
      expect(result.length).toBe(1);
      expect(result[0].generation).toBe(2);
    });

    it('should combine multiple filters', () => {
      const options: CharacterFilterOptions = {
        status: { active: true },
        tier: { max: 2 },
        attributes: {
          pronouns: ['she/her']
        }
      };
      const result = pipe.transform(mockCharacters, options);
      expect(result.length).toBe(1);
      expect(result[0].shortName).toBe('MoeChar');
    });

    it('should prioritize search over other filters', () => {
      const options: CharacterFilterOptions = {
        status: { active: true },  // Would exclude retired
        search: 'retired'  // But search takes priority
      };
      const result = pipe.transform(mockCharacters, options);
      expect(result.length).toBe(1);
      expect(result[0].status).toBe('retired');
    });
  });
});
