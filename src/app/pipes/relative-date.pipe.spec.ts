import { RelativeDatePipe } from './relative-date.pipe';

describe('RelativeDatePipe', () => {
  let pipe: RelativeDatePipe;

  beforeEach(() => {
    pipe = new RelativeDatePipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return "Today" for today\'s date', () => {
    const today = new Date();
    expect(pipe.transform(today)).toBe('Today');
  });

  it('should return "Yesterday" for yesterday\'s date', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(pipe.transform(yesterday)).toBe('Yesterday');
  });

  it('should return formatted date for dates beyond yesterday', () => {
    const pastDate = new Date('2024-01-15');
    const result = pipe.transform(pastDate);
    expect(result).toContain('Jan');
    expect(result).toContain('15');
  });

  it('should handle string dates', () => {
    const today = new Date().toISOString();
    expect(pipe.transform(today)).toBe('Today');
  });

  it('should return empty string for null', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should handle dates at midnight boundary correctly', () => {
    const today = new Date();
    // Set to 11:59 PM yesterday
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 23, 59, 59);
    expect(pipe.transform(yesterday)).toBe('Yesterday');
  });
});
