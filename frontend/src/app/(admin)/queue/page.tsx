"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCcw, RotateCcw, SquareX, Eye } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuthenticatedApi } from "@/hooks/useAuthenticatedApi";
import { ADMIN_ENDPOINTS } from "@/lib/api/endpoints";
import { admin } from "@/lib/api/queryKeys";
import type { QueueJob, QueueStatus } from "@/types/admin";

type QueueJobRecord = QueueJob & {
  _id?: string;
  created_at?: string;
  updated_at?: string;
  resumeId?: string;
  resume_id?: string;
  resumeName?: string;
  resume_name?: string;
  ownerName?: string;
  owner_name?: string;
  ownerEmail?: string;
  owner_email?: string;
  errorMessage?: string;
  error_message?: string;
};

type QueueResponse = {
  success?: boolean;
  queue?: QueueJobRecord[];
  jobs?: QueueJobRecord[];
};

const EMPTY_JOBS: QueueJobRecord[] = [];

function asDate(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function calcDuration(job: QueueJobRecord): string {
  const created = asDate(job.createdAt || job.created_at);
  const updated = asDate(job.updatedAt || job.updated_at);
  if (!created) return "-";
  const end = updated || new Date();
  const diffMs = Math.max(0, end.getTime() - created.getTime());
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

function statusClasses(status: QueueStatus | string): string {
  switch (status) {
    case "processing":
      return "bg-blue-500/15 text-blue-300 border border-blue-500/30 animate-pulse";
    case "completed":
      return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30";
    case "failed":
      return "bg-rose-500/15 text-rose-300 border border-rose-500/30";
    case "pending":
    default:
      return "bg-slate-500/15 text-slate-300 border border-slate-500/30";
  }
}

function getResumeName(job: QueueJobRecord): string {
  return (
    job.resumeName ||
    job.resume_name ||
    String(job.payload?.resumeName || "") ||
    String(job.payload?.resume_name || "") ||
    "Unknown Resume"
  );
}

function getOwner(job: QueueJobRecord): string {
  return (
    job.ownerEmail ||
    job.owner_email ||
    job.ownerName ||
    job.owner_name ||
    String(job.payload?.ownerEmail || "") ||
    String(job.payload?.owner_email || "") ||
    String(job.payload?.ownerName || "") ||
    "-"
  );
}

function getResumeId(job: QueueJobRecord): string | null {
  const value =
    job.resumeId ||
    job.resume_id ||
    String(job.payload?.resumeId || "") ||
    String(job.payload?.resume_id || "");

  const trimmed = String(value || "").trim();
  return trimmed ? trimmed : null;
}

function getJobId(job: QueueJobRecord): string {
  return String(job.id || job._id || "");
}

function isToday(value?: string): boolean {
  const d = asDate(value);
  if (!d) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function AdminQueuePage() {
  const queryClient = useQueryClient();
  const { request, isLoaded } = useAuthenticatedApi();
  const [activeTab, setActiveTab] = useState<"all" | "failed">("all");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const queueQuery = useQuery<QueueJobRecord[]>({
    queryKey: admin.queue(),
    enabled: isLoaded,
    refetchInterval: autoRefresh ? 5000 : false,
    queryFn: async () => {
      const response = await request<QueueResponse>({
        method: "GET",
        url: ADMIN_ENDPOINTS.queue,
      });
      return response.queue ?? response.jobs ?? [];
    },
  });

  const jobs = useMemo(() => queueQuery.data ?? EMPTY_JOBS, [queueQuery.data]);

  const retryMutation = useMutation({
    mutationFn: async (jobId: string) => {
      await request({ method: "POST", url: ADMIN_ENDPOINTS.queueRetry(jobId) });
    },
    onSuccess: () => {
      toast.success("Job retried successfully");
      queryClient.invalidateQueries({ queryKey: admin.queue() });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to retry job");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (jobId: string) => {
      await request({ method: "DELETE", url: ADMIN_ENDPOINTS.queueJob(jobId) });
    },
    onSuccess: () => {
      toast.success("Pending job cancelled");
      queryClient.invalidateQueries({ queryKey: admin.queue() });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to cancel job");
    },
  });

  const bulkRetryMutation = useMutation({
    mutationFn: async (failedJobIds: string[]) => {
      const settled = await Promise.allSettled(
        failedJobIds.map((id) => request({ method: "POST", url: ADMIN_ENDPOINTS.queueRetry(id) }))
      );
      const successCount = settled.filter((result) => result.status === "fulfilled").length;
      const failedCount = settled.length - successCount;
      return { successCount, failedCount };
    },
    onSuccess: ({ successCount, failedCount }) => {
      if (failedCount > 0) {
        toast.error(`Retried ${successCount} jobs, ${failedCount} failed`);
      } else {
        toast.success(`Retried ${successCount} failed jobs`);
      }
      queryClient.invalidateQueries({ queryKey: admin.queue() });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Bulk retry failed");
    },
  });

  const pendingCount = useMemo(() => jobs.filter((j) => j.status === "pending").length, [jobs]);
  const processingCount = useMemo(() => jobs.filter((j) => j.status === "processing").length, [jobs]);
  const failedTodayCount = useMemo(
    () => jobs.filter((j) => j.status === "failed" && isToday(j.createdAt || j.created_at)).length,
    [jobs]
  );
  const avgProcessingTime = useMemo(() => {
    const completed = jobs.filter((j) => j.status === "completed");
    if (completed.length === 0) return "-";

    const avgMs =
      completed.reduce((acc, job) => {
        const created = asDate(job.createdAt || job.created_at);
        const updated = asDate(job.updatedAt || job.updated_at);
        if (!created || !updated) return acc;
        return acc + Math.max(0, updated.getTime() - created.getTime());
      }, 0) / completed.length;

    const minutes = Math.floor(avgMs / 60000);
    const seconds = Math.floor((avgMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }, [jobs]);

  const failedJobs = useMemo(() => jobs.filter((j) => j.status === "failed"), [jobs]);
  const visibleJobs = activeTab === "failed" ? failedJobs : jobs;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Resume Analysis Queue</h1>
          <p className="text-sm text-slate-400">Live processing jobs across the platform</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "primary" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh((value) => !value)}
          >
            Auto-refresh: {autoRefresh ? "On" : "Off"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCcw className="h-4 w-4" />}
            onClick={() => queueQuery.refetch()}
          >
            Refresh now
          </Button>
        </div>
      </div>

      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardContent className="py-4 text-sm text-slate-200">
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            <span>{pendingCount} pending</span>
            <span className="text-slate-500">·</span>
            <span>{processingCount} processing</span>
            <span className="text-slate-500">·</span>
            <span>{failedTodayCount} failed today</span>
            <span className="text-slate-500">·</span>
            <span>Avg processing time: {avgProcessingTime}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={activeTab === "all" ? "primary" : "outline"}
          onClick={() => setActiveTab("all")}
        >
          All Jobs
        </Button>
        <Button
          size="sm"
          variant={activeTab === "failed" ? "primary" : "outline"}
          onClick={() => setActiveTab("failed")}
        >
          Failed Jobs
        </Button>
        {activeTab === "failed" ? (
          <Button
            size="sm"
            variant="secondary"
            icon={<RotateCcw className="h-4 w-4" />}
            loading={bulkRetryMutation.isPending}
            disabled={failedJobs.length === 0}
            onClick={() => bulkRetryMutation.mutate(failedJobs.map(getJobId).filter(Boolean))}
          >
            Bulk Retry
          </Button>
        ) : null}
      </div>

      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle className="text-base font-bold text-white">
            {activeTab === "failed" ? "Failed Jobs" : "Live Queue"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {queueQuery.isLoading ? (
            <p className="text-sm text-slate-400">Loading queue...</p>
          ) : queueQuery.isError ? (
            <p className="text-sm text-rose-300">
              Failed to load queue: {String((queueQuery.error as Error)?.message || "Unknown error")}
            </p>
          ) : visibleJobs.length === 0 ? (
            <p className="text-sm text-slate-400">No jobs to display.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-2 py-3">Job ID</th>
                    <th className="px-2 py-3">Resume Name</th>
                    <th className="px-2 py-3">Owner</th>
                    <th className="px-2 py-3">Status</th>
                    <th className="px-2 py-3">Created</th>
                    <th className="px-2 py-3">Duration</th>
                    <th className="px-2 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleJobs.map((job) => {
                    const jobId = getJobId(job);
                    const resumeId = getResumeId(job);
                    const created = job.createdAt || job.created_at;
                    const errorMessage = job.error || job.errorMessage || job.error_message;

                    return (
                      <Fragment key={jobId}>
                        <tr key={jobId} className="border-b border-slate-800/70 text-slate-200">
                          <td className="px-2 py-3 font-mono text-xs text-white">{jobId || "-"}</td>
                          <td className="px-2 py-3">{getResumeName(job)}</td>
                          <td className="px-2 py-3">{getOwner(job)}</td>
                          <td className="px-2 py-3">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold uppercase ${statusClasses(job.status)}`}>
                              {job.status}
                            </span>
                          </td>
                          <td className="px-2 py-3">{created ? new Date(created).toLocaleString() : "-"}</td>
                          <td className="px-2 py-3">{calcDuration(job)}</td>
                          <td className="px-2 py-3">
                            <div className="flex flex-wrap gap-2">
                              {job.status === "failed" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  icon={<RotateCcw className="h-4 w-4" />}
                                  loading={retryMutation.isPending && retryMutation.variables === jobId}
                                  onClick={() => retryMutation.mutate(jobId)}
                                >
                                  Retry
                                </Button>
                              ) : null}

                              {job.status === "pending" ? (
                                <Button
                                  size="sm"
                                  variant="danger"
                                  icon={<SquareX className="h-4 w-4" />}
                                  loading={cancelMutation.isPending && cancelMutation.variables === jobId}
                                  onClick={() => cancelMutation.mutate(jobId)}
                                >
                                  Cancel
                                </Button>
                              ) : null}

                              {job.status === "completed" && resumeId ? (
                                <Link href={`/admin/resumes/${resumeId}`}>
                                  <Button size="sm" variant="secondary" icon={<Eye className="h-4 w-4" />}>
                                    View result
                                  </Button>
                                </Link>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                        {activeTab === "failed" && errorMessage ? (
                          <tr key={`${jobId}-error`} className="border-b border-slate-800/70 bg-rose-950/20">
                            <td colSpan={7} className="px-3 py-3 text-xs text-rose-200">
                              <details>
                                <summary className="cursor-pointer font-semibold">Error details</summary>
                                <pre className="mt-2 whitespace-pre-wrap font-mono text-xs">{errorMessage}</pre>
                              </details>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
