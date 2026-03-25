'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import ATSScoreCard from '@/components/ui/ATSScoreCard';
import JobMatchCard from '@/components/ui/JobMatchCard';
import SuggestionCard from '@/components/ui/SuggestionCard';
import { useAuth } from '@/hooks/useAuth';
import { clearStoredSession, getStoredSession } from '@/lib/session';

type DashboardUser = {
  id?: string;
  email?: string;
  name?: string;
  credits?: number;
};

type AnalysisBreakdown = {
  format: number;
  keywords: number;
  experience: number;
  education: number;
};

type LatestAnalysis = {
  ats_score: number;
  score_breakdown: AnalysisBreakdown;
};

export default function Dashboard() {
  const [user] = useState<DashboardUser | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    const { user: sessionUser } = getStoredSession();
    return sessionUser as DashboardUser | null;
  });
  const [latestAnalysis] = useState<LatestAnalysis | null>({
    ats_score: 78,
    score_breakdown: {
      format: 82,
      keywords: 74,
      experience: 79,
      education: 76
    }
  });
  const router = useRouter();
  const { logout } = useAuth();

  const clearSessionAndRedirect = useCallback((reason: string) => {
    clearStoredSession();
    router.push(`/login?reason=${reason}`);
  }, [router]);

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  useEffect(() => {
    const { token, user: sessionUser } = getStoredSession();
    if (!token) {
      clearSessionAndRedirect('session-expired');
      return;
    }

    if (!sessionUser) {
      clearSessionAndRedirect('unauthorized');
    }
  }, [clearSessionAndRedirect]);

  if (!user) return <div className="min-h-screen flex items-center justify-center text-neutral-600">Loading dashboard...</div>;

  return (
    <div className="min-h-screen bg-linear-to-br from-neutral-50 to-primary-50">
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-start motion-fade-up">
            <div>
              <h1 className="text-4xl font-extrabold text-neutral-900">
                Welcome back, {user.name || 'User'}! 👋
              </h1>
              <p className="text-neutral-600 mt-2">
                Keep your profile sharp and interview-ready.
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-neutral-600">
                Available Credits
              </p>
              <p className="text-4xl font-extrabold text-primary-600">
                {user.credits ?? 0}
              </p>
              <div className="mt-3">
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-md border border-neutral-200 hover:shadow-lg transition motion-soft-pop stagger-1 hover-lift">
            <p className="text-neutral-600 font-semibold text-sm">Total Analyses</p>
            <p className="text-4xl font-extrabold text-primary-600 mt-2">12</p>
            <p className="text-xs text-neutral-500 mt-2">This month</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-neutral-200 hover:shadow-lg transition motion-soft-pop stagger-2 hover-lift">
            <p className="text-neutral-600 font-semibold text-sm">Job Matches</p>
            <p className="text-4xl font-extrabold text-accent-600 mt-2">5</p>
            <p className="text-xs text-neutral-500 mt-2">Tailored resumes</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-neutral-200 hover:shadow-lg transition motion-soft-pop stagger-3 hover-lift">
            <p className="text-neutral-600 font-semibold text-sm">Applications</p>
            <p className="text-4xl font-extrabold text-success-600 mt-2">8</p>
            <p className="text-xs text-neutral-500 mt-2">Tracked</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-neutral-200 hover:shadow-lg transition motion-soft-pop stagger-4 hover-lift">
            <p className="text-neutral-600 font-semibold text-sm">Success Rate</p>
            <p className="text-4xl font-extrabold text-success-600 mt-2">62%</p>
            <p className="text-xs text-neutral-500 mt-2">Shortlist rate</p>
          </div>
        </div>

        {latestAnalysis && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">
              Latest ATS Analysis
            </h2>
            <ATSScoreCard
              score={latestAnalysis.ats_score}
              breakdown={latestAnalysis.score_breakdown}
            />
          </div>
        )}

        <div className="bg-white rounded-xl p-8 shadow-md mb-12 motion-fade-up hover-lift-soft">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">
            What would you like to do?
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              icon="📄"
              onClick={() => router.push('/dashboard?tab=analyze')}
            >
              Upload Resume
            </Button>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              icon="🎯"
              onClick={() => router.push('/job-matcher')}
            >
              Match to Job
            </Button>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              icon="💼"
              onClick={() => router.push('/dashboard?tab=tracker')}
            >
              Track Applications
            </Button>
          </div>
        </div>

        <div className="mb-12 motion-fade-up">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">
            Recent Job Matches
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <JobMatchCard
              jobTitle="Senior Backend Engineer"
              company="Google"
              matchPercentage={85}
              missingSkills={['Kubernetes', 'GraphQL']}
              strengths={['Go', 'Microservices', 'AWS']}
            />
            <JobMatchCard
              jobTitle="Data Scientist"
              company="Amazon"
              matchPercentage={62}
              missingSkills={['PySpark', 'AWS SageMaker', 'MLOps']}
              strengths={['Python', 'SQL', 'Statistics']}
            />
          </div>
        </div>

        <div className="motion-fade-up">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">
            Smart Suggestions
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <SuggestionCard
              type="strength"
              title="Strong Core Skills"
              description="Your backend and cloud experience are highly relevant for current openings."
              action="See Matching Jobs"
              onActionClick={() => router.push('/job-matcher')}
              priority="low"
            />
            <SuggestionCard
              type="skill-gap"
              title="Close Kubernetes Gap"
              description="Adding one production Kubernetes project can improve matches significantly."
              action="View Skill Plan"
              onActionClick={() => router.push('/fresher-mode')}
              priority="high"
            />
            <SuggestionCard
              type="improvement"
              title="Add Quantified Impact"
              description="Add measurable achievements to improve ATS scoring in experience sections."
              action="Optimize Resume"
              onActionClick={() => router.push('/dashboard?tab=analyze')}
              priority="medium"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
