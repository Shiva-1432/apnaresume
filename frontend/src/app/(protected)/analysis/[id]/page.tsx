import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { API_BASE_URL } from "@/lib/apiBaseUrl";
import { validateId } from "@/lib/utils/validateId";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import ATSScoreCard from "@/components/ui/ATSScoreCard";
import { ArrowLeft, FileText, Sparkles, Target, Clock, CheckCircle2, AlertTriangle } from "lucide-react";

type AnalysisResponse = {
  success: boolean;
  resume: {
    _id: string;
    file_name?: string;
    version_name?: string;
    target_role?: string;
    created_at?: string;
    updated_at?: string;
    extracted_text?: string;
  };
  analysis: null | {
    ats_score: number;
    score_breakdown: {
      format: number;
      keywords: number;
      experience: number;
      education: number;
    };
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    confidence?: string;
    created_at?: string;
  };
};

async function getAnalysis(resumeId: string): Promise<AnalysisResponse> {
  const { getToken } = await auth();
  const token = await getToken();
  const span = Sentry.startInactiveSpan({ name: 'fetch-analysis' });

  try {
    if (!token) {
      redirect('/sign-in');
    }

    const response = await fetch(`${API_BASE_URL}/analysis/resume/${resumeId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (response.status === 404) {
      notFound();
    }

    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string; message?: string } | null;
      throw new Error(payload?.error || payload?.message || 'Failed to load analysis.');
    }

    return response.json() as Promise<AnalysisResponse>;
  } finally {
    span?.end();
  }
}

export default async function AnalysisDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const resumeId = String(params?.id || '').trim();

  // Validate route params before making any backend request.
  if (!validateId(resumeId)) {
    notFound();
  }

  const data = await getAnalysis(resumeId);
  const analysis = data?.analysis;
  const resume = data?.resume;

  return (
    <div className="min-h-screen bg-linear-to-br from-neutral-50 to-primary-50 px-4 py-8 lg:py-12">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/my-resumes"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Resumes
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-primary shadow-sm backdrop-blur">
            <Target className="h-4 w-4" />
            Resume Analysis
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Resume</p>
                  <h1 className="mt-2 text-3xl font-black tracking-tight text-neutral-900">
                    {resume?.version_name || resume?.file_name || 'Resume Analysis'}
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {resume?.target_role ? `Target role: ${resume.target_role}` : 'ATS breakdown and improvement guidance'}
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-primary/5 px-4 py-3 text-sm font-semibold text-primary">
                  <Clock className="h-4 w-4" />
                  {resume?.created_at ? new Date(resume.created_at).toLocaleDateString() : 'Recently analyzed'}
                </div>
              </div>
            </div>

            {analysis ? (
              <ATSScoreCard score={analysis.ats_score} breakdown={analysis.score_breakdown} />
            ) : (
              <Card className="border border-dashed border-muted-foreground/30 bg-white/70">
                <CardContent className="py-10 text-center space-y-3">
                  <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
                  <h2 className="text-xl font-bold text-neutral-900">No analysis found</h2>
                  <p className="text-sm text-muted-foreground">
                    This resume exists, but no ATS analysis result is available yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="border-0 bg-white/80 shadow-xl backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis?.strengths?.length ? analysis.strengths.map((item, index) => (
                  <div key={index} className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
                    {item}
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">No strengths data available.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/80 shadow-xl backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Weaknesses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis?.weaknesses?.length ? analysis.weaknesses.map((item, index) => (
                  <div key={index} className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                    {item}
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">No weaknesses data available.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/80 shadow-xl backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis?.suggestions?.length ? analysis.suggestions.map((item, index) => (
                  <div key={index} className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-neutral-900">
                    {item}
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">No suggestions data available.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
