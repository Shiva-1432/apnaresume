"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuthenticatedApi } from "@/hooks/useAuthenticatedApi";
import { ADMIN_ENDPOINTS } from "@/lib/api/endpoints";
import { admin } from "@/lib/api/queryKeys";
import { toQueryString } from "@/hooks/admin/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import type { AdminTicket } from "@/types/admin";

type TicketsResponse = {
  success?: boolean;
  tickets?: AdminTicket[];
  data?: AdminTicket[];
  pagination?: {
    page?: number;
    pages?: number;
    totalPages?: number;
    total?: number;
    totalItems?: number;
  };
};

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in-progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
] as const;

const CATEGORY_OPTIONS = [
  { value: "all", label: "All" },
  { value: "bug-report", label: "Bug" },
  { value: "feature-request", label: "Feature Request" },
  { value: "account", label: "Account" },
  { value: "other", label: "Other" },
] as const;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "priority", label: "Priority" },
] as const;

function normalizeTicketId(ticket: AdminTicket & { _id?: string }) {
  return String(ticket.id || ticket._id || "");
}

function getUserLabel(ticket: AdminTicket & { userName?: string; userEmail?: string }) {
  return (
    ticket.user?.email ||
    ticket.user?.name ||
    ticket.userEmail ||
    ticket.userName ||
    ticket.userId ||
    "-"
  );
}

export default function AdminTicketsPage() {
  const { request, isLoaded } = useAuthenticatedApi();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]["value"]>("all");
  const [category, setCategory] = useState<(typeof CATEGORY_OPTIONS)[number]["value"]>("all");
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]["value"]>("newest");

  const limit = 20;

  const query = useQuery<{ tickets: AdminTicket[]; pagination?: TicketsResponse["pagination"] }>({
    queryKey: [
      ...admin.tickets(),
      page,
      limit,
      status,
      category,
      sort,
    ],
    enabled: isLoaded,
    queryFn: async () => {
      const response = await request<TicketsResponse>({
        method: "GET",
        url: `${ADMIN_ENDPOINTS.tickets}${toQueryString({
          page,
          limit,
          status,
          category,
          sort,
        })}`,
      });

      return {
        tickets: response.tickets ?? response.data ?? [],
        pagination: response.pagination,
      };
    },
  });

  const tickets = query.data?.tickets ?? [];
  const totalPages = Number(query.data?.pagination?.totalPages || query.data?.pagination?.pages || 1);
  const total = Number(query.data?.pagination?.totalItems || query.data?.pagination?.total || tickets.length);

  const pageLabel = useMemo(() => `Page ${page} of ${totalPages}`, [page, totalPages]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Tickets</h1>
          <p className="text-sm text-slate-400">Support queue across all users</p>
        </div>
        <div className="text-sm text-slate-300">{total} total tickets</div>
      </div>

      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-white">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Status</label>
            <select
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value as (typeof STATUS_OPTIONS)[number]["value"]);
              }}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Category</label>
            <select
              value={category}
              onChange={(e) => {
                setPage(1);
                setCategory(e.target.value as (typeof CATEGORY_OPTIONS)[number]["value"]);
              }}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Sort By</label>
            <select
              value={sort}
              onChange={(e) => {
                setPage(1);
                setSort(e.target.value as (typeof SORT_OPTIONS)[number]["value"]);
              }}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-white">All Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <p className="text-sm text-slate-400">Loading tickets...</p>
          ) : query.isError ? (
            <p className="text-sm text-rose-300">Failed to load tickets: {String((query.error as Error)?.message || "Unknown error")}</p>
          ) : tickets.length === 0 ? (
            <p className="text-sm text-slate-400">No tickets found for the selected filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-2 py-3">ID</th>
                    <th className="px-2 py-3">Subject</th>
                    <th className="px-2 py-3">Category</th>
                    <th className="px-2 py-3">User</th>
                    <th className="px-2 py-3">Status</th>
                    <th className="px-2 py-3">Priority</th>
                    <th className="px-2 py-3">Created</th>
                    <th className="px-2 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => {
                    const record = ticket as AdminTicket & { _id?: string; created_at?: string; category?: string; userName?: string; userEmail?: string };
                    const id = normalizeTicketId(record);
                    return (
                      <tr key={id} className="border-b border-slate-800/70 text-slate-200">
                        <td className="px-2 py-3 font-medium text-white">{ticket.ticketNumber || id.slice(0, 8)}</td>
                        <td className="px-2 py-3">{ticket.subject}</td>
                        <td className="px-2 py-3">{ticket.category || record.category || "-"}</td>
                        <td className="px-2 py-3">{getUserLabel(record)}</td>
                        <td className="px-2 py-3">{ticket.status}</td>
                        <td className="px-2 py-3">{ticket.priority || "normal"}</td>
                        <td className="px-2 py-3">
                          {ticket.createdAt || record.created_at ? new Date(ticket.createdAt || String(record.created_at)).toLocaleDateString() : "-"}
                        </td>
                        <td className="px-2 py-3">
                          <Link href={`/tickets/${id}`}>
                            <Button size="sm" variant="outline" icon={<Eye className="h-4 w-4" />}>
                              Open
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
            <Button
              size="sm"
              variant="ghost"
              disabled={page <= 1}
              icon={<ChevronLeft className="h-4 w-4" />}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-slate-400">{pageLabel}</span>
            <Button
              size="sm"
              variant="ghost"
              disabled={page >= totalPages}
              icon={<ChevronRight className="h-4 w-4" />}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
