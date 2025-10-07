import { normalizeText, levenshteinDistance } from './normalize';

describe('normalizeText', () => {
  it('should convert text to lowercase', () => {
    expect(normalizeText('Hello World')).toBe('hello world');
  });

  it('should remove accents', () => {
    expect(normalizeText('Áéíóúñ')).toBe('aeioun');
  });

  it('should remove non-alphanumeric characters and extra spaces', () => {
    expect(normalizeText('  Hello,   World!  123  ')).toBe('hello world 123');
  });

  it('should handle empty strings', () => {
    expect(normalizeText('')).toBe('');
  });

  it('should handle numbers', () => {
    expect(normalizeText('12345')).toBe('12345');
  });
});

describe('levenshteinDistance', () => {
  it('should return 0 for identical strings', () => {
    expect(levenshteinDistance('hello', 'hello')).toBe(0);
  });

  it('should return the correct distance for a single insertion', () => {
    expect(levenshteinDistance('kitten', 'kittens')).toBe(1);
  });

  it('should return the correct distance for a single deletion', () => {
    expect(levenshteinDistance('sitting', 'sittin')).toBe(1);
  });

  it('should return the correct distance for a single substitution', () => {
    expect(levenshteinDistance('kitten', 'sitten')).toBe(1);
  });

  it('should return the correct distance for multiple operations', () => {
    expect(levenshteinDistance('flaw', 'lawn')).toBe(2);
  });

  it('should handle empty strings', () => {
    expect(levenshteinDistance('', 'abc')).toBe(3);
    expect(levenshteinDistance('abc', '')).toBe(3);
    expect(levenshteinDistance('', '')).toBe(0);
  });

  it('should be case-insensitive and ignore accents due to normalizeText', () => {
    expect(levenshteinDistance('Hello', 'héllo')).toBe(0);
    expect(levenshteinDistance('Resumé', 'resume')).toBe(0);
  });

  it('should ignore non-alphanumeric characters and extra spaces', () => {
    expect(levenshteinDistance('Hello, World!', 'hello world')).toBe(0);
    expect(levenshteinDistance('  test  ', 'test')).toBe(0);
  });

  it('should return the correct distance for complex cases', () => {
    expect(levenshteinDistance('distance', 'distanc')).toBe(1);
    expect(levenshteinDistance('apple', 'aple')).toBe(1);
    expect(levenshteinDistance('book', 'back')).toBe(2);
  });
});
