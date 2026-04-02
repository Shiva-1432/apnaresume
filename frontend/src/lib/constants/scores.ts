export type ScoreTier = 'poor' | 'average' | 'good';

export const SCORE_THRESHOLDS = {
  poor: [0, 49],
  average: [50, 79],
  good: [80, 100],
} as const;

export function getScoreTier(score: number): ScoreTier {
  if (score <= SCORE_THRESHOLDS.poor[1]) {
    return 'poor';
  }

  if (score <= SCORE_THRESHOLDS.average[1]) {
    return 'average';
  }

  return 'good';
}

export function getScoreLabel(score: number): 'Needs Work' | 'On Track' | 'ATS Ready' {
  const tier = getScoreTier(score);

  if (tier === 'poor') {
    return 'Needs Work';
  }

  if (tier === 'average') {
    return 'On Track';
  }

  return 'ATS Ready';
}

export function getScoreColor(tier: ScoreTier): string {
  if (tier === 'poor') {
    return 'text-rose-600';
  }

  if (tier === 'average') {
    return 'text-amber-600';
  }

  return 'text-emerald-600';
}

export function getScoreBg(tier: ScoreTier): string {
  if (tier === 'poor') {
    return 'bg-rose-50';
  }

  if (tier === 'average') {
    return 'bg-amber-50';
  }

  return 'bg-emerald-50';
}

export function getScoreBarColor(tier: ScoreTier): string {
  if (tier === 'poor') {
    return 'bg-rose-500';
  }

  if (tier === 'average') {
    return 'bg-amber-500';
  }

  return 'bg-emerald-500';
}