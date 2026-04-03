"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Eye, Trash2, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAuthenticatedApi } from "@/hooks/useAuthenticatedApi";
import { useAdminResumes } from "@/hooks/admin";
import { ADMIN_ENDPOINTS } from "@/lib/api/endpoints";
import { admin } from "@/lib/api/queryKeys";
import { logAdminAction } from "@/lib/utils/auditLog";
import type { AdminResume } from "@/types/admin";

const STATUS_OPTIONS = ["all", "active", "analyzing", "deleted"];
const SCORE_TIER_OPTIONS = ["all", "poor", "average", "good"];

function getResumeName(resume: AdminResume): string {
  return (
    resume.fileName ||
    resume.analysis?.suggestions?.[0] ||
    "Untitled Resume"
  );
}

function getOwnerEmail(resume: AdminResume): string {
  return resume.owner?.email || "-";
}

export default function AdminResumesPage() {
  const queryClient = useQueryClient();
  const { request } = useAuthenticatedApi();
  const { user } = useUser();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [scoreTier, setScoreTier] = useState("all");

  const { data, isLoading, isError, error } = useAdminResumes({
    page,
    limit: 20,
    status,
    scoreTier,
    search,
  });

  const deleteMutation = useMutation({
    mutationFn: async (resumeId: string) => {
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
    },
    onError: (mutationError) => {
      const message = mutationError instanceof Error ? mutationError.message : "Failed to delete resume";
      toast.error(message);
    },
  });

  const resumes = data?.resumes ?? [];
  const pagination = data?.pagination;
  const totalPages = Number(pagination?.totalPages || 1);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const summary = useMemo(() => {
    const total = Number(pagination?.totalItems ?? pagination?.total ?? resumes.length ?? 0);
    return `${total} total resumes`;
  }, [pagination?.totalItems, pagination?.total, resumes.length]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Resumes</h1>
          <p className="text-sm text-slate-400">Global resume inventory with moderation actions</p>
        </div>
        <div className="text-sm text-slate-300">{summary}</div>
      </div>

      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-bold text-white">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Search</label>
            <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                placeholder="Owner email or resume name"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Status</label>
            <select
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option[0].toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Score Tier</label>
            <select
              value={scoreTier}
              onChange={(e) => {
                setPage(1);
                setScoreTier(e.target.value);
              }}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none"
            >
              {SCORE_TIER_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option[0].toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-white">Resume Table</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-slate-400">Loading resumes...</p>
          ) : isError ? (
            <p className="text-sm text-rose-300">Failed to load resumes: {String((error as Error)?.message || "Unknown error")}</p>
          ) : resumes.length === 0 ? (
            <p className="text-sm text-slate-400">No resumes match the current filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-2 py-3">Resume</th>
                    <th className="px-2 py-3">Owner</th>
                    <th className="px-2 py-3">Score</th>
                    <th className="px-2 py-3">Status</th>
                    <th className="px-2 py-3">Created</th>
                    <th className="px-2 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resumes.map((resume) => (
                    <tr key={resume.id} className="border-b border-slate-800/70 text-slate-200">
                      <td className="px-2 py-3 font-medium text-white">{getResumeName(resume)}</td>
                      <td className="px-2 py-3">{getOwnerEmail(resume)}</td>
                      <td className="px-2 py-3">{resume.score ?? resume.analysis?.ats_score ?? "-"}</td>
                      <td className="px-2 py-3">{resume.status ?? "unknown"}</td>
                      <td className="px-2 py-3">{resume.createdAt ? new Date(resume.createdAt).toLocaleDateString() : "-"}</td>
                      <td className="px-2 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/admin/resumes/${resume.id}`}>
                            <Button size="sm" variant="outline" icon={<Eye className="h-4 w-4" />}>
                              View Analysis
                            </Button>
                          </Link>

                          {resume.rawFileUrl || resume.fileUrl ? (
                            <a href={resume.rawFileUrl || resume.fileUrl} target="_blank" rel="noreferrer">
                              <Button size="sm" variant="secondary" icon={<FileText className="h-4 w-4" />}>
                                View File
                              </Button>
                            </a>
                          ) : (
                            <Button size="sm" variant="secondary" disabled icon={<FileText className="h-4 w-4" />}>
                              View File
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="danger"
                            loading={deleteMutation.isPending}
                            icon={<Trash2 className="h-4 w-4" />}
                            onClick={() => {
                              const ok = window.confirm("Delete this resume? This action cannot be undone.");
                              if (!ok) return;
                              deleteMutation.mutate(resume.id);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
            <Button
              size="sm"
              variant="ghost"
              disabled={!canPrev}
              icon={<ChevronLeft className="h-4 w-4" />}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-slate-400">Page {page} of {totalPages}</span>
            <Button
              size="sm"
              variant="ghost"
              disabled={!canNext}
              icon={<ChevronRight className="h-4 w-4" />}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
