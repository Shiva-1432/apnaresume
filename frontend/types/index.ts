export interface User {
  _id: string;
  email: string;
  name: string;
  credits: number;
}

export interface Resume {
  _id: string;
  file_name: string;
  extracted_text: string;
  created_at: string;
  is_version?: boolean;
  target_role?: string;
  applications_count?: number;
  shortlist_count?: number;
}

export interface AnalysisResult {
  success: boolean;
  analysis: {
    ats_score: number;
    score_breakdown: Record<string, number>;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
  credits_remaining: number;
}

export interface JobMatch {
  _id: string;
  job_title: string;
  company: string;
  match_percentage: number;
  match_score: string;
  missing_skills: string[];
  improvements: string[];
  optimized_bullets: {
    experience: string[];
    skills: string[];
    projects: string[];
  };
}

export interface ApplicationStats {
  total_applications: number;
  total_analyses: number;
  total_matches: number;
  success_rate: number;
  by_status: {
    applied: number;
    shortlisted: number;
    interviewed: number;
    offers: number;
    rejected: number;
  };
}
