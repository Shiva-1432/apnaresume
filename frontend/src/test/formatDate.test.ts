import { formatDate, formatRelativeDate } from '../lib/utils/formatDate';

describe('formatDate utility', () => {
  it('formats a valid date', () => {
    expect(formatDate('2026-04-01T00:00:00.000Z', 'en-US')).toBe('4/1/2026');
  });

  it('returns Recently for invalid and empty values', () => {
    expect(formatDate('not-a-date')).toBe('Recently');
    expect(formatDate('')).toBe('Recently');
  });

  it('returns relative date output', () => {
    const now = '2026-04-02T12:00:00.000Z';

    expect(formatRelativeDate('2026-04-02T01:00:00.000Z', now)).toBe('Today');
    expect(formatRelativeDate('2026-04-01T01:00:00.000Z', now)).toBe('Yesterday');
    expect(formatRelativeDate('2026-03-30T01:00:00.000Z', now)).toBe('3 days ago');
  });
});