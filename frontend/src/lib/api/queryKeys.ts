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

export const admin = {
  root: () => ["admin"] as const,
  stats: () => ["admin", "stats"] as const,
  users: () => ["admin", "users"] as const,
  usersFiltered: (filters?: Record<string, unknown>) => ["admin", "users", filters ?? {}] as const,
  user: (id: string) => ["admin", "user", id] as const,
  resumes: () => ["admin", "resumes"] as const,
  tickets: () => ["admin", "tickets"] as const,
  ticketsFiltered: (filters?: Record<string, unknown>) => ["admin", "tickets", filters ?? {}] as const,
  ticket: (id: string) => ["admin", "ticket", id] as const,
  queue: () => ["admin", "queue"] as const,
  flags: () => ["admin", "flags"] as const,
  billing: () => ["admin", "billing"] as const,
  analytics: (range?: string) => ["admin", "analytics", range ?? "default"] as const,
} as const;