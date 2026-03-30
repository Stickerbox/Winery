import { describe, it, expect } from 'vitest';
import { cn, groupWinesByMonth } from './utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('resolves Tailwind conflicts keeping the last value', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('ignores falsy values', () => {
    expect(cn('foo', false, undefined, null, 'bar')).toBe('foo bar');
  });

  it('returns empty string with no arguments', () => {
    expect(cn()).toBe('');
  });
});

describe('groupWinesByMonth', () => {
  it('returns empty array for empty input', () => {
    expect(groupWinesByMonth([], 'en-US')).toEqual([]);
  });

  it('groups wines in the same month into one bucket', () => {
    const wines = [
      { createdAt: new Date('2024-03-10'), name: 'A' },
      { createdAt: new Date('2024-03-20'), name: 'B' },
    ];
    const result = groupWinesByMonth(wines, 'en-US');
    expect(result).toHaveLength(1);
    expect(result[0].wines).toHaveLength(2);
  });

  it('groups wines in different months into separate buckets', () => {
    const wines = [
      { createdAt: new Date('2024-01-01'), name: 'A' },
      { createdAt: new Date('2024-03-01'), name: 'B' },
    ];
    const result = groupWinesByMonth(wines, 'en-US');
    expect(result).toHaveLength(2);
  });

  it('sorts buckets newest-first', () => {
    const wines = [
      { createdAt: new Date('2024-01-01'), name: 'A' },
      { createdAt: new Date('2024-03-01'), name: 'B' },
    ];
    const result = groupWinesByMonth(wines, 'en-US');
    expect(result[0].wines[0].name).toBe('B'); // March first
    expect(result[1].wines[0].name).toBe('A'); // January second
  });

  it('accepts string dates', () => {
    const wines = [{ createdAt: '2024-06-15', name: 'C' }];
    const result = groupWinesByMonth(wines, 'en-US');
    expect(result).toHaveLength(1);
    expect(result[0].wines[0].name).toBe('C');
  });
});
