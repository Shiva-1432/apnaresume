export interface SkillGap {
  id: string;
  name: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  recommendations: string[];
}

export interface JobMatch {
  id: string;
  userId: string;
  resumeId: string;
  jobTitle: string;
  company: string;
  matchScore: number;
  strengths: string[];
  missingSkills: string[];
  skillGaps: SkillGap[];
  createdAt: string;
  updatedAt: string;
}
