"use client";

import { useMemo } from "react";
import { useAdminBilling, useAdminQueue, useAdminStats, useAdminTickets, useAdminUsers } from "@/hooks/admin";

type NumericRecord = Record<string, unknown>;

function pickNumber(source: NumericRecord | undefined, keys: string[], fallback = 0) {
  if (!source) {
    return fallback;
  }

  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return fallback;
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AdminOverviewPage() {
  const statsQuery = useAdminStats();
  const usersQuery = useAdminUsers({ limit: 8 });
  const ticketsQuery = useAdminTickets({ limit: 8 });
  const queueQuery = useAdminQueue();
  const billingQuery = useAdminBilling();

  const stats = statsQuery.data as NumericRecord | undefined;

  const totalUsers = pickNumber(stats, ["totalUsers", "users", "usersTotal"]);
  const userGrowthPct = pickNumber(stats, ["userGrowthPct", "usersGrowthPct", "growthPct"]);
  const totalResumes = pickNumber(stats, ["totalResumes", "resumes", "resumesTotal"]);
  const resumesToday = pickNumber(stats, ["resumesToday", "todayResumes", "resumesTodayCount"]);
  const activeAnalysisJobs = pickNumber(stats, ["activeAnalysisJobs", "analysisJobsActive", "activeJobs"]);
  const openSupportTickets = pickNumber(stats, ["openSupportTickets", "openTickets", "ticketsOpen"]);
  const avgAtsScore = pickNumber(stats, ["avgAtsScore", "averageAtsScore", "atsAverage"]);
  const revenueThisMonth = pickNumber(stats, ["revenueThisMonth", "monthlyRevenue"]);

  const queueCounts = useMemo(() => {
    const jobs = queueQuery.data ?? [];
    return jobs.reduce(
      (acc, job) => {
        if (job.status === "pending") acc.pending += 1;
        if (job.status === "processing") acc.processing += 1;
        if (job.status === "failed") acc.failed += 1;
        return acc;
      },
      { pending: 0, processing: 0, failed: 0 }
    );
  }, [queueQuery.data]);

  const showRevenueCard = revenueThisMonth > 0 || Boolean(billingQuery.data?.stats);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Admin Overview</h1>
        <p className="text-sm text-slate-300 mt-1">Operational health, growth, and support pulse.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Total users</p>
          <p className="text-3xl font-black text-white mt-2">{totalUsers}</p>
          <p className="text-sm text-cyan-300 mt-2">{formatPercent(userGrowthPct)} vs last month</p>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Total resumes uploaded</p>
          <p className="text-3xl font-black text-white mt-2">{totalResumes}</p>
          <p className="text-sm text-cyan-300 mt-2">+{resumesToday} today</p>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Active analysis jobs</p>
          <p className="text-3xl font-black text-white mt-2">{activeAnalysisJobs}</p>
          <p className="text-sm text-slate-300 mt-2">Live processing workload</p>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Open support tickets</p>
          <p className="text-3xl font-black text-white mt-2">{openSupportTickets}</p>
          <p className="text-sm text-slate-300 mt-2">Customer requests awaiting action</p>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Avg ATS score</p>
          <p className="text-3xl font-black text-white mt-2">{avgAtsScore.toFixed(1)}</p>
          <p className="text-sm text-slate-300 mt-2">Across all uploaded resumes</p>
        </article>

        {showRevenueCard && (
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Revenue this month</p>
            <p className="text-3xl font-black text-white mt-2">{formatCurrency(revenueThisMonth)}</p>
            <p className="text-sm text-slate-300 mt-2">Shown only when billing is active</p>
          </article>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-white">Recent signups</h2>
            {usersQuery.isLoading && <span className="text-xs text-slate-400">Loading...</span>}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-xs tracking-widest">
                  <th className="py-3 text-left">Name</th>
                  <th className="py-3 text-left">Email</th>
                  <th className="py-3 text-left">Joined</th>
                  <th className="py-3 text-right">Resume count</th>
                </tr>
              </thead>
              <tbody>
                {(usersQuery.data ?? []).map((user) => {
                  const userRecord = user as unknown as NumericRecord;
                  const resumeCount = pickNumber(userRecord, ["resumeCount", "resumes", "resumesCount"]);

                  return (
                    <tr key={user.id} className="border-b border-slate-800/70">
                      <td className="py-3 text-white font-semibold">{user.name || "Unnamed"}</td>
                      <td className="py-3 text-slate-300">{user.email}</td>
                      <td className="py-3 text-slate-300">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="py-3 text-right text-slate-200 font-semibold">{resumeCount}</td>
                    </tr>
                  );
                })}
                {!usersQuery.isLoading && (usersQuery.data ?? []).length === 0 && (
                  <tr>
                    <td className="py-6 text-slate-400" colSpan={4}>No recent signups found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-black text-white mb-4">Analysis queue status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-slate-950 px-4 py-3 border border-slate-800">
              <span className="text-slate-300">Pending</span>
              <span className="text-cyan-300 font-black">{queueCounts.pending}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-950 px-4 py-3 border border-slate-800">
              <span className="text-slate-300">Processing</span>
              <span className="text-cyan-300 font-black">{queueCounts.processing}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-950 px-4 py-3 border border-slate-800">
              <span className="text-slate-300">Failed</span>
              <span className="text-rose-300 font-black">{queueCounts.failed}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-white">Recent tickets</h2>
          {ticketsQuery.isLoading && <span className="text-xs text-slate-400">Loading...</span>}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-xs tracking-widest">
                <th className="py-3 text-left">Subject</th>
                <th className="py-3 text-left">User</th>
                <th className="py-3 text-left">Status</th>
                <th className="py-3 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {(ticketsQuery.data ?? []).map((ticket) => {
                const ticketRecord = ticket as unknown as NumericRecord;
                const userName =
                  (ticketRecord.userName as string | undefined) ||
                  (ticketRecord.userEmail as string | undefined) ||
                  ticket.userId ||
                  "-";

                return (
                  <tr key={ticket.id} className="border-b border-slate-800/70">
                    <td className="py-3 text-white font-semibold">{ticket.subject}</td>
                    <td className="py-3 text-slate-300">{userName}</td>
                    <td className="py-3 text-slate-300">{ticket.status}</td>
                    <td className="py-3 text-slate-300">
                      {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                );
              })}
              {!ticketsQuery.isLoading && (ticketsQuery.data ?? []).length === 0 && (
                <tr>
                  <td className="py-6 text-slate-400" colSpan={4}>No recent tickets found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
