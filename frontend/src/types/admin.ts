export type QueueStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'unpaid';

export interface AdminStats {
  totalUsers: number;
  totalResumes: number;
  totalTickets: number;
  totalSubscriptions: number;
  activeUsers24h?: number;
  queuedJobs?: number;
  userGrowthPct?: number;
  resumesToday?: number;
  activeAnalysisJobs?: number;
  openSupportTickets?: number;
  avgAtsScore?: number;
  revenueThisMonth?: number;
  updatedAt?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  credits?: number;
  createdAt?: string;
  lastActiveAt?: string;
  isBlocked?: boolean;
}

export interface AdminResume {
  id: string;
  userId: string;
  owner?: {
    id?: string;
    name?: string;
    email?: string;
  };
  fileName?: string;
  format?: string;
  score?: number;
  status?: string;
  notes?: string;
  fileUrl?: string;
  rawFileUrl?: string;
  analysis?: {
    ats_score?: number;
    score_breakdown?: {
      format?: number;
      keywords?: number;
      experience?: number;
      education?: number;
    };
    strengths?: string[];
    weaknesses?: string[];
    suggestions?: string[];
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminTicketReply {
  id: string;
  authorId?: string;
  authorName?: string;
  isAdmin?: boolean;
  message: string;
  createdAt: string;
}

export interface AdminTicket {
  id: string;
  ticketNumber?: string;
  userId?: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
  };
  subject: string;
  category?: string;
  description?: string;
  message?: string;
  attachments?: Array<{
    filename?: string;
    url: string;
    uploadedAt?: string;
  }>;
  status: 'open' | 'in-progress' | 'waiting-customer' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  internalNotes?: string;
  createdAt?: string;
  updatedAt?: string;
  replies?: AdminTicketReply[];
}

export interface QueueJob {
  id: string;
  type: string;
  status: QueueStatus;
  attempts?: number;
  maxAttempts?: number;
  payload?: Record<string, unknown>;
  error?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description?: string;
  rolloutPercentage?: number;
  environments?: {
    dev?: boolean;
    staging?: boolean;
    prod?: boolean;
  };
  updatedAt?: string;
  updatedBy?: string;
}

export interface AuditLogRecord {
  id: string;
  adminId: string;
  adminName?: string;
  action: string;
  targetType: string;
  targetId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: string;
  status: SubscriptionStatus;
  amount?: number;
  currency?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

export interface BillingStats {
  totalRevenue: number;
  mrr?: number;
  arr?: number;
  activeSubscriptions: number;
  churnRate?: number;
  currency?: string;
}

export interface AdminAnalyticsPoint {
  label: string;
  value: number;
}

export interface AdminAnalytics {
  range: string;
  series: AdminAnalyticsPoint[];
  summary?: Record<string, number>;
}

export interface AdminUsersFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface AdminTicketsFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
  sort?: string;
  priority?: string;
}
