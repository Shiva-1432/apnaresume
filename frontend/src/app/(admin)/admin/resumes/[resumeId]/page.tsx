"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, AlertTriangle, Sparkles, Download, Trash2, Save } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ATSScoreCard from "@/components/ui/ATSScoreCard";
import { useAuthenticatedApi } from "@/hooks/useAuthenticatedApi";
import { useAdminResume } from "@/hooks/admin";
import { ADMIN_ENDPOINTS } from "@/lib/api/endpoints";
import { admin } from "@/lib/api/queryKeys";
import { logAdminAction } from "@/lib/utils/auditLog";

export default function AdminResumeDetailPage() {
  const params = useParams<{ resumeId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { request } = useAuthenticatedApi();
  const { user } = useUser();

  const resumeId = String(params?.resumeId || "").trim();
  const { data: resume, isLoading, isError, error } = useAdminResume(resumeId);
  const [notesDraft, setNotesDraft] = useState<string | null>(null);

  const saveNotesMutation = useMutation({
    mutationFn: async (payload: { notes: string }) => {
      await request({
        method: "PATCH",
        url: ADMIN_ENDPOINTS.resumeNotes(resumeId),
        data: payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: admin.resumes() });
      queryClient.invalidateQueries({ queryKey: [...admin.resumes(), "detail", resumeId] });
      toast.success("Admin notes saved");
    },
    onError: (mutationError) => {
      const message = mutationError instanceof Error ? mutationError.message : "Failed to save notes";
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await logAdminAction({
        adminId: user?.id || "unknown",
        action: "resume_delete",
        targetType: "resume",
        targetId: resumeId,
      });
      await request({ method: "DELETE", url: ADMIN_ENDPOINTS.resume(resumeId) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: admin.resumes() });
      toast.success("Resume deleted successfully");
      router.push("/admin/resumes");
    },
    onError: (mutationError) => {
      const message = mutationError instanceof Error ? mutationError.message : "Failed to delete resume";
      toast.error(message);
    },
  });

  const displayName = useMemo(
    () => resume?.fileName || "Resume Analysis",
    [resume?.fileName]
  );

  const analysis = resume?.analysis;
  const breakdown = {
    format: analysis?.score_breakdown?.format ?? 0,
    keywords: analysis?.score_breakdown?.keywords ?? 0,
    experience: analysis?.score_breakdown?.experience ?? 0,
    education: analysis?.score_breakdown?.education ?? 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/resumes" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200">
          <ArrowLeft className="h-4 w-4" />
          Back to Resumes
        </Link>
        <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Admin Resume Detail</div>
      </div>

      {isLoading ? (
        <Card className="border-slate-800 bg-slate-900 text-slate-300">
          <CardContent className="py-10">Loading resume details...</CardContent>
        </Card>
      ) : isError || !resume ? (
        <Card className="border-slate-800 bg-slate-900 text-rose-300">
          <CardContent className="py-10">Failed to load resume: {String((error as Error)?.message || "Not found")}</CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <Card className="border-slate-800 bg-slate-900 text-slate-100">
              <CardHeader>
                <CardTitle className="text-xl font-black text-white">{displayName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-300">
                <p>Status: <span className="text-white">{resume.status ?? "unknown"}</span></p>
                <p>Created: <span className="text-white">{resume.createdAt ? new Date(resume.createdAt).toLocaleString() : "-"}</span></p>
                <p>Owner: <span className="text-white">{resume.owner?.email || resume.userId}</span></p>
              </CardContent>
            </Card>

            {analysis ? (
              <ATSScoreCard score={analysis.ats_score ?? resume.score ?? 0} breakdown={breakdown} />
            ) : (
              <Card className="border-slate-800 bg-slate-900 text-slate-300">
                <CardContent className="py-8">No analysis data available.</CardContent>
              </Card>
            )}

            <Card className="border-slate-800 bg-slate-900 text-slate-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><CheckCircle2 className="h-5 w-5 text-emerald-400" />Strengths</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis?.strengths?.length ? analysis.strengths.map((item, index) => (
                  <div key={index} className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">{item}</div>
                )) : <p className="text-sm text-slate-400">No strengths data.</p>}
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900 text-slate-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><AlertTriangle className="h-5 w-5 text-amber-400" />Weaknesses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis?.weaknesses?.length ? analysis.weaknesses.map((item, index) => (
                  <div key={index} className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">{item}</div>
                )) : <p className="text-sm text-slate-400">No weaknesses data.</p>}
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900 text-slate-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Sparkles className="h-5 w-5 text-cyan-300" />Suggestions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis?.suggestions?.length ? analysis.suggestions.map((item, index) => (
                  <div key={index} className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100">{item}</div>
                )) : <p className="text-sm text-slate-400">No suggestions data.</p>}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-slate-800 bg-slate-900 text-slate-100">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white">Owner Panel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-300">
                <p>Name: <span className="text-white">{resume.owner?.name || "-"}</span></p>
                <p>Email: <span className="text-white">{resume.owner?.email || "-"}</span></p>
                <p>User ID: <span className="text-white">{resume.owner?.id || resume.userId}</span></p>
                {resume.owner?.id ? (
                  <Link href={`/admin/users/${resume.owner.id}`}>
                    <Button variant="outline" size="sm">Open User Profile</Button>
                  </Link>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900 text-slate-100">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white">File</CardTitle>
              </CardHeader>
              <CardContent>
                {resume.rawFileUrl || resume.fileUrl ? (
                  <a href={resume.rawFileUrl || resume.fileUrl} target="_blank" rel="noreferrer">
                    <Button variant="secondary" size="sm" icon={<Download className="h-4 w-4" />}>
                      Download Raw File
                    </Button>
                  </a>
                ) : (
                  <p className="text-sm text-slate-400">Raw file URL unavailable.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900 text-slate-100">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white">Admin Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  value={notesDraft ?? resume?.notes ?? ""}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  rows={8}
                  placeholder="Add investigation context, policy notes, or moderation rationale"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
                />
                <Button
                  variant="success"
                  size="sm"
                  loading={saveNotesMutation.isPending}
                  icon={<Save className="h-4 w-4" />}
                  onClick={() => saveNotesMutation.mutate({ notes: notesDraft ?? resume?.notes ?? "" })}
                >
                  Save Notes
                </Button>
              </CardContent>
            </Card>

            <Card className="border-rose-900/40 bg-rose-950/30 text-rose-100">
              <CardHeader>
                <CardTitle className="text-base font-bold">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="danger"
                  size="sm"
                  loading={deleteMutation.isPending}
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={() => {
                    const ok = window.confirm("Permanently delete this resume and analysis? This cannot be undone.");
                    if (!ok) return;
                    deleteMutation.mutate();
                  }}
                >
                  Delete Resume
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
