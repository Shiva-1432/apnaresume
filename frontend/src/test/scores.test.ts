import {
  getScoreTier,
  getScoreLabel,
  getScoreColor,
} from '../lib/constants/scores';

describe('scores utility', () => {
  it('returns correct tiers at boundaries', () => {
    expect(getScoreTier(0)).toBe('poor');
    expect(getScoreTier(49)).toBe('poor');
    expect(getScoreTier(50)).toBe('average');
    expect(getScoreTier(79)).toBe('average');
    expect(getScoreTier(80)).toBe('good');
    expect(getScoreTier(100)).toBe('good');
  });

  it('returns expected labels and colors', () => {
    expect(getScoreLabel(10)).toBe('Needs Work');
    expect(getScoreLabel(60)).toBe('On Track');
    expect(getScoreLabel(95)).toBe('ATS Ready');

    expect(getScoreColor('poor')).toBe('text-rose-600');
    expect(getScoreColor('average')).toBe('text-amber-600');
    expect(getScoreColor('good')).toBe('text-emerald-600');
  });
});