export const resumes = {
  list: () => ["resumes", "list"] as const,
  detail: (id: string) => ["resumes", id] as const,
  analysis: (id: string) => ["resumes", id, "analysis"] as const,
  trash: () => ["resumes", "trash"] as const,
} as const;

export const tickets = {
  list: () => ["tickets", "list"] as const,
} as const;

export const jobMatch = {
  result: () => ["job-match"] as const,
} as const;

export const skillGap = {
  result: () => ["skill-gap"] as const,
} as const;