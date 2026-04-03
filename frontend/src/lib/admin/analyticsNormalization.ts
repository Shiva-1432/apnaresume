export type GenericRecord = Record<string, unknown>;

export type UserGrowthPoint = { label: string; signups: number };
export type ResumeUploadsPoint = { label: string; uploads: number };
export type ScoreDistributionPoint = { tier: string; resumes: number };
export type MissingKeywordPoint = { keyword: string; count: number };
export type TicketVolumePoint = { week: string; opened: number; resolved: number };
export type FeatureUsagePoint = { feature: string; usage: number };

const EMPTY_RECORD: GenericRecord = {};

function toArray(value: unknown): GenericRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is GenericRecord => Boolean(item) && typeof item === "object");
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toLabel(value: unknown, fallback: string): string {
  const s = String(value ?? "").trim();
  return s || fallback;
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes("\n") || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function normalizeAdminAnalytics(input: unknown) {
  const record = (input as GenericRecord | null) ?? EMPTY_RECORD;

  const userGrowthData: UserGrowthPoint[] = (() => {
    const source = toArray(record.userGrowth ?? record.user_growth ?? record.signupsByDay);

    if (!source.length && Array.isArray(record.series)) {
      const fallback = toArray(record.series).map((point, index) => ({
        label: toLabel(point.label, `Day ${index + 1}`),
        value: toNumber(point.value),
      }));

      return fallback.map((point) => ({ label: point.label, signups: point.value }));
    }

    return source.map((point, index) => ({
      label: toLabel(point.date ?? point.label, `Day ${index + 1}`),
      signups: toNumber(point.signups ?? point.count ?? point.value),
    }));
  })();

  const resumeUploadsData: ResumeUploadsPoint[] = toArray(
    record.resumeUploads ?? record.resume_uploads ?? record.uploadsByDay
  ).map((point, index) => ({
    label: toLabel(point.date ?? point.label, `Day ${index + 1}`),
    uploads: toNumber(point.uploads ?? point.count ?? point.value),
  }));

  const scoreDistributionData: ScoreDistributionPoint[] = (() => {
    const source = record.scoreDistribution ?? record.score_distribution;

    if (source && typeof source === "object" && !Array.isArray(source)) {
      const mapped = source as GenericRecord;
      return [
        { tier: "poor", resumes: toNumber(mapped.poor) },
        { tier: "average", resumes: toNumber(mapped.average) },
        { tier: "good", resumes: toNumber(mapped.good) },
      ];
    }

    return toArray(source).map((point) => ({
      tier: toLabel(point.tier ?? point.label, "unknown"),
      resumes: toNumber(point.resumes ?? point.count ?? point.value),
    }));
  })();

  const topMissingKeywordsData: MissingKeywordPoint[] = toArray(
    record.topMissingKeywords ?? record.top_missing_keywords ?? record.keywordGaps
  )
    .map((point, index) => ({
      keyword: toLabel(point.keyword ?? point.label, `keyword-${index + 1}`),
      count: toNumber(point.count ?? point.value),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const ticketVolumeData: TicketVolumePoint[] = toArray(
    record.ticketVolume ?? record.ticket_volume ?? record.ticketsByWeek
  ).map((point, index) => ({
    week: toLabel(point.week ?? point.label, `Week ${index + 1}`),
    opened: toNumber(point.opened ?? point.created ?? point.incoming),
    resolved: toNumber(point.resolved ?? point.closed ?? point.completed),
  }));

  const featureUsageData: FeatureUsagePoint[] = (() => {
    const source = record.featureUsage ?? record.feature_usage;

    if (source && typeof source === "object" && !Array.isArray(source)) {
      const mapped = source as GenericRecord;
      return [
        { feature: "upload", usage: toNumber(mapped.upload) },
        { feature: "job matcher", usage: toNumber(mapped.jobMatcher ?? mapped.job_matcher) },
        { feature: "skill gap", usage: toNumber(mapped.skillGap ?? mapped.skill_gap) },
        { feature: "history", usage: toNumber(mapped.history) },
      ];
    }

    return toArray(source).map((point, index) => ({
      feature: toLabel(point.feature ?? point.label, `feature-${index + 1}`),
      usage: toNumber(point.usage ?? point.count ?? point.value),
    }));
  })();

  return {
    userGrowthData,
    resumeUploadsData,
    scoreDistributionData,
    topMissingKeywordsData,
    ticketVolumeData,
    featureUsageData,
  };
}

export function toAdminAnalyticsCsvRows(datasets: ReturnType<typeof normalizeAdminAnalytics>): string[][] {
  const rows: string[][] = [["section", "label", "metric", "value"]];

  datasets.userGrowthData.forEach((point) => {
    rows.push(["user_growth", point.label, "signups", String(point.signups)]);
  });

  datasets.resumeUploadsData.forEach((point) => {
    rows.push(["resume_uploads", point.label, "uploads", String(point.uploads)]);
  });

  datasets.scoreDistributionData.forEach((point) => {
    rows.push(["score_distribution", point.tier, "resumes", String(point.resumes)]);
  });

  datasets.topMissingKeywordsData.forEach((point) => {
    rows.push(["top_missing_keywords", point.keyword, "count", String(point.count)]);
  });

  datasets.ticketVolumeData.forEach((point) => {
    rows.push(["ticket_volume", point.week, "opened", String(point.opened)]);
    rows.push(["ticket_volume", point.week, "resolved", String(point.resolved)]);
  });

  datasets.featureUsageData.forEach((point) => {
    rows.push(["feature_usage", point.feature, "usage", String(point.usage)]);
  });

  return rows;
}

export function downloadCsv(filename: string, rows: string[][]) {
  const csvContent = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
