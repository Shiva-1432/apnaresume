"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAdminAnalytics } from "@/hooks/admin";
import {
  downloadCsv,
  normalizeAdminAnalytics,
  toAdminAnalyticsCsvRows,
} from "@/lib/admin/analyticsNormalization";

const UserGrowthChartPanel = dynamic(
  () => import("@/components/admin/analytics/UserGrowthChartPanel"),
  { ssr: false }
);
const ResumeUploadsChartPanel = dynamic(
  () => import("@/components/admin/analytics/ResumeUploadsChartPanel"),
  { ssr: false }
);
const ScoreDistributionChartPanel = dynamic(
  () => import("@/components/admin/analytics/ScoreDistributionChartPanel"),
  { ssr: false }
);
const TopMissingKeywordsChartPanel = dynamic(
  () => import("@/components/admin/analytics/TopMissingKeywordsChartPanel"),
  { ssr: false }
);
const TicketVolumeChartPanel = dynamic(
  () => import("@/components/admin/analytics/TicketVolumeChartPanel"),
  { ssr: false }
);
const FeatureUsageChartPanel = dynamic(
  () => import("@/components/admin/analytics/FeatureUsageChartPanel"),
  { ssr: false }
);

const RANGE_OPTIONS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "all", label: "All time" },
] as const;

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]["value"]>("30d");
  const analyticsQuery = useAdminAnalytics(range);

  const datasets = useMemo(
    () => normalizeAdminAnalytics(analyticsQuery.data),
    [analyticsQuery.data]
  );

  const {
    userGrowthData,
    resumeUploadsData,
    scoreDistributionData,
    topMissingKeywordsData,
    ticketVolumeData,
    featureUsageData,
  } = datasets;

  const exportRows = useMemo(() => {
    return toAdminAnalyticsCsvRows(datasets);
  }, [datasets]);

  const hasAnyData =
    userGrowthData.length > 0 ||
    resumeUploadsData.length > 0 ||
    scoreDistributionData.length > 0 ||
    topMissingKeywordsData.length > 0 ||
    ticketVolumeData.length > 0 ||
    featureUsageData.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Platform Analytics</h1>
          <p className="text-sm text-slate-400">Global trends across users, resumes, tickets, and feature usage</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as (typeof RANGE_OPTIONS)[number]["value"])}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none"
          >
            {RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            icon={<Download className="h-4 w-4" />}
            disabled={!hasAnyData}
            onClick={() => downloadCsv(`analytics-${range}.csv`, exportRows)}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {analyticsQuery.isLoading ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-sm text-slate-400">
          Loading analytics...
        </div>
      ) : analyticsQuery.isError ? (
        <div className="rounded-xl border border-rose-800 bg-rose-950/30 p-8 text-sm text-rose-300">
          Failed to load analytics: {String((analyticsQuery.error as Error)?.message || "Unknown error")}
        </div>
      ) : !hasAnyData ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-sm text-slate-400">
          No analytics data returned for this range.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <UserGrowthChartPanel data={userGrowthData} />
          <ResumeUploadsChartPanel data={resumeUploadsData} />
          <ScoreDistributionChartPanel data={scoreDistributionData} />
          <TopMissingKeywordsChartPanel data={topMissingKeywordsData} />
          <TicketVolumeChartPanel data={ticketVolumeData} />
          <FeatureUsageChartPanel data={featureUsageData} />
        </div>
      )}
    </div>
  );
}
