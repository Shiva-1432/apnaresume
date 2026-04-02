import { validateId } from '../lib/utils/validateId';

describe('validateId', () => {
  it('accepts a valid uuid', () => {
    expect(validateId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('rejects an empty string', () => {
    expect(validateId('')).toBe(false);
  });

  it('rejects a string with spaces', () => {
    expect(validateId('abc 123')).toBe(false);
  });

  it('rejects SQL injection attempts', () => {
    expect(validateId("abc'; DROP TABLE users; --")).toBe(false);
  });

  it("accepts a normal slug 'abc-123'", () => {
    expect(validateId('abc-123')).toBe(true);
  });
});