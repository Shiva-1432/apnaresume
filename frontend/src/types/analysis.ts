import type { ScoreTier } from '@/lib/constants/scores';

export type { ScoreTier } from '@/lib/constants/scores';
export {
  SCORE_THRESHOLDS,
  getScoreTier,
  getScoreLabel,
  getScoreColor,
  getScoreBg,
} from '@/lib/constants/scores';

export interface ATSScore {
  value: number;
  tier: ScoreTier;
}

export interface KeywordMatch {
  keyword: string;
  matched: boolean;
  frequency?: number;
}

export interface SectionFeedback {
  section: string;
  score: number;
  feedback: string;
  suggestions: string[];
}

export interface Analysis {
  id: string;
  resumeId: string;
  userId: string;
  atsScore: ATSScore;
  keywordMatches: KeywordMatch[];
  sectionFeedback: SectionFeedback[];
  summary: string;
  createdAt: string;
  updatedAt: string;
}
