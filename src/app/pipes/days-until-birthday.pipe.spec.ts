import { DaysUntilBirthdayPipe } from './days-until-birthday.pipe';
import { Character } from '../services/character.service';

describe('DaysUntilBirthdayPipe', () => {
  let pipe: DaysUntilBirthdayPipe;

  beforeEach(() => {
    pipe = new DaysUntilBirthdayPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  describe('without character', () => {
    it('should return "Today!" for 0 days', () => {
      expect(pipe.transform(0)).toBe('Today!');
    });

    it('should return "Tomorrow" for 1 day', () => {
      expect(pipe.transform(1)).toBe('Tomorrow');
    });

    it('should return "X days" for multiple days', () => {
      expect(pipe.transform(5)).toBe('5 days');
      expect(pipe.transform(30)).toBe('30 days');
      expect(pipe.transform(365)).toBe('365 days');
    });
  });

  describe('with character (he/him)', () => {
    const maleChar: Partial<Character> = {
      id: 1,
      shortName: 'Test Boy',
      pronouns: 'he/him'
    };

    it('should return "Today is his birthday!" for 0 days', () => {
      expect(pipe.transform(0, maleChar as Character)).toBe('Today is his birthday!');
    });

    it('should return "Tomorrow" for 1 day', () => {
      expect(pipe.transform(1, maleChar as Character)).toBe('Tomorrow');
    });

    it('should return "X days" for multiple days', () => {
      expect(pipe.transform(10, maleChar as Character)).toBe('10 days');
    });
  });

  describe('with character (she/her)', () => {
    const femaleChar: Partial<Character> = {
      id: 2,
      shortName: 'Test Girl',
      pronouns: 'she/her'
    };

    it('should return "Today is her birthday!" for 0 days', () => {
      expect(pipe.transform(0, femaleChar as Character)).toBe('Today is her birthday!');
    });

    it('should return "Tomorrow" for 1 day', () => {
      expect(pipe.transform(1, femaleChar as Character)).toBe('Tomorrow');
    });
  });

  describe('with character (they/them)', () => {
    const nonbinaryChar: Partial<Character> = {
      id: 3,
      shortName: 'Test Person',
      pronouns: 'they/them'
    };

    it('should return "Today is their birthday!" for 0 days', () => {
      expect(pipe.transform(0, nonbinaryChar as Character)).toBe('Today is their birthday!');
    });
  });

  describe('with character (no pronouns)', () => {
    const charWithoutPronouns: Partial<Character> = {
      id: 4,
      shortName: 'Unknown'
    };

    it('should default to "their" when pronouns are missing', () => {
      expect(pipe.transform(0, charWithoutPronouns as Character)).toBe('Today is their birthday!');
    });
  });

  describe('edge cases', () => {
    it('should handle 2 days correctly', () => {
      expect(pipe.transform(2)).toBe('2 days');
    });

    it('should handle large numbers of days', () => {
      expect(pipe.transform(999)).toBe('999 days');
    });
  });
});
