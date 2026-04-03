"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuthenticatedApi } from "@/hooks/useAuthenticatedApi";
import { ADMIN_ENDPOINTS } from "@/lib/api/endpoints";
import type { AuditLogRecord } from "@/types/admin";

type AuditResponse = {
  success?: boolean;
  audit?: AuditLogRecord[];
  logs?: AuditLogRecord[];
};

const ACTION_OPTIONS = ["all", "resume_delete", "ticket_status_change", "feature_flag_update", "subscription_cancel", "subscription_extend"] as const;
const RANGE_OPTIONS = ["7d", "30d", "90d", "all"] as const;

function toQueryString(params: Record<string, string>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && value !== "all") search.set(key, value);
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export default function AuditPage() {
  const { request, isLoaded } = useAuthenticatedApi();
  const [action, setAction] = useState<(typeof ACTION_OPTIONS)[number]>("all");
  const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]>("30d");

  const auditQuery = useQuery<AuditLogRecord[]>({
    queryKey: ["admin", "audit", action, range],
    enabled: isLoaded,
    queryFn: async () => {
      const response = await request<AuditResponse>({
        method: "GET",
        url: `${ADMIN_ENDPOINTS.audit}${toQueryString({ action, range })}`,
      });
      return response.audit ?? response.logs ?? [];
    },
  });

  const records = useMemo(() => auditQuery.data ?? [], [auditQuery.data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Audit Log</h1>
          <p className="text-sm text-slate-400">Read-only history of destructive admin activity</p>
        </div>
      </div>

      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-bold text-white">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Action</label>
            <select
              value={action}
              onChange={(event) => setAction(event.target.value as (typeof ACTION_OPTIONS)[number])}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none"
            >
              {ACTION_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Date range</label>
            <select
              value={range}
              onChange={(event) => setRange(event.target.value as (typeof RANGE_OPTIONS)[number])}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none"
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle className="text-base font-bold text-white">Actions</CardTitle>
        </CardHeader>
        <CardContent>
          {auditQuery.isLoading ? (
            <p className="text-sm text-slate-400">Loading audit logs...</p>
          ) : auditQuery.isError ? (
            <p className="text-sm text-rose-300">Failed to load audit logs: {String((auditQuery.error as Error)?.message || "Unknown error")}</p>
          ) : records.length === 0 ? (
            <p className="text-sm text-slate-400">No audit records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-2 py-3">Admin</th>
                    <th className="px-2 py-3">Action</th>
                    <th className="px-2 py-3">Target</th>
                    <th className="px-2 py-3">Timestamp</th>
                    <th className="px-2 py-3">Metadata</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="border-b border-slate-800/70 text-slate-200 align-top">
                      <td className="px-2 py-3">
                        <div className="font-medium text-white">{record.adminName || record.adminId}</div>
                        <div className="text-xs text-slate-400">{record.adminId}</div>
                      </td>
                      <td className="px-2 py-3 font-mono text-xs text-cyan-300">{record.action}</td>
                      <td className="px-2 py-3">
                        <div className="font-medium text-white">{record.targetType}</div>
                        <div className="text-xs text-slate-400">{record.targetId}</div>
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap">{new Date(record.timestamp).toLocaleString()}</td>
                      <td className="px-2 py-3">
                        {record.metadata && Object.keys(record.metadata).length > 0 ? (
                          <details className="group rounded-lg border border-slate-700 bg-slate-950/40 p-2">
                            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-slate-200">
                              <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                              Expand
                            </summary>
                            <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-slate-300">{JSON.stringify(record.metadata, null, 2)}</pre>
                          </details>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
