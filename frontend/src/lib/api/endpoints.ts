export const analysisEndpoints = {
  resume: (resumeId: string) => `/analysis/resume/${resumeId}`,
};

export const ADMIN_ENDPOINTS = {
  stats: '/api/admin/stats',
  users: '/api/admin/users',
  user: (id: string) => `/api/admin/users/${id}`,
  resumes: '/api/admin/resumes',
  resume: (id: string) => `/api/admin/resumes/${id}`,
  tickets: '/api/admin/tickets',
  ticket: (id: string) => `/api/admin/tickets/${id}`,
  queue: '/api/admin/queue',
  queueJob: (id: string) => `/api/admin/queue/${id}`,
  flags: '/api/admin/flags',
  flag: (name: string) => `/api/admin/flags/${name}`,
  billing: '/api/admin/billing/subscriptions',
  analytics: '/api/admin/analytics',
} as const;