"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, Send, Save } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAuthenticatedApi } from "@/hooks/useAuthenticatedApi";
import { ADMIN_ENDPOINTS } from "@/lib/api/endpoints";
import { admin } from "@/lib/api/queryKeys";
import { logAdminAction } from "@/lib/utils/auditLog";
import type { AdminTicket, AdminTicketReply } from "@/types/admin";

type TicketResponse = {
  success?: boolean;
  ticket?: AdminTicket & {
    _id?: string;
    user_id?: string;
    name?: string;
    email?: string;
    category?: string;
    created_at?: string;
    updated_at?: string;
    attachments?: Array<{ filename?: string; url: string; uploaded_at?: string }>;
    responses?: Array<{ _id?: string; responder_id?: string; message: string; created_at: string }>;
    internal_notes?: string;
  };
};

const STATUS_OPTIONS = ["open", "in-progress", "resolved", "closed"] as const;
const PRIORITY_OPTIONS = ["normal", "high", "urgent"] as const;

function mapPriorityToApi(priority: (typeof PRIORITY_OPTIONS)[number]) {
  if (priority === "normal") return "medium";
  if (priority === "urgent") return "critical";
  return "high";
}

function mapPriorityFromApi(priority?: string): (typeof PRIORITY_OPTIONS)[number] {
  if (priority === "critical" || priority === "urgent") return "urgent";
  if (priority === "high") return "high";
  return "normal";
}

function toReplies(ticket: TicketResponse["ticket"] | null | undefined) {
  const repliesFromAdminType = ticket?.replies ?? [];
  const repliesFromLegacy = (ticket?.responses ?? []).map((response, index) => ({
    id: String(response._id || `${response.created_at}-${index}`),
    authorId: response.responder_id,
    authorName: response.responder_id ? "Admin" : "User",
    isAdmin: Boolean(response.responder_id),
    message: response.message,
    createdAt: response.created_at,
  })) as AdminTicketReply[];

  return (repliesFromAdminType.length ? repliesFromAdminType : repliesFromLegacy)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

function toTicketId(ticket: TicketResponse["ticket"] | null | undefined, paramsId: string) {
  return String(ticket?.id || ticket?._id || paramsId || "");
}

export default function AdminTicketDetailPage() {
  const params = useParams<{ ticketId: string }>();
  const queryClient = useQueryClient();
  const { request, isLoaded } = useAuthenticatedApi();
  const { user } = useUser();

  const routeTicketId = String(params?.ticketId || "").trim();
  const [replyMessage, setReplyMessage] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const ticketQuery = useQuery<TicketResponse["ticket"] | null>({
    queryKey: admin.ticket(routeTicketId),
    enabled: isLoaded && Boolean(routeTicketId),
    queryFn: async () => {
      const response = await request<TicketResponse>({
        method: "GET",
        url: ADMIN_ENDPOINTS.ticket(routeTicketId),
      });

      return response.ticket ?? null;
    },
  });

  const ticketId = toTicketId(ticketQuery.data, routeTicketId);

  const statusMutation = useMutation({
    mutationFn: async (payload: { status?: (typeof STATUS_OPTIONS)[number]; priority?: (typeof PRIORITY_OPTIONS)[number] }) => {
      await logAdminAction({
        adminId: user?.id || "unknown",
        action: payload.status ? "ticket_status_change" : "ticket_priority_change",
        targetType: "ticket",
        targetId: ticketId,
        metadata: payload,
      });
      await request({
        method: "PATCH",
        url: ADMIN_ENDPOINTS.ticket(ticketId),
        data: {
          ...(payload.status ? { status: payload.status } : {}),
          ...(payload.priority ? { priority: mapPriorityToApi(payload.priority) } : {}),
        },
      });
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: admin.ticket(ticketId) });
      await queryClient.invalidateQueries({ queryKey: admin.tickets() });
      const action = variables?.status ? "Status updated" : "Priority updated";
      toast.success(action);
    },
    onError: (mutationError) => {
      const message = mutationError instanceof Error ? mutationError.message : "Failed to update ticket";
      toast.error(message);
    },
  });

  const replyMutation = useMutation({
    mutationFn: async (message: string) => {
      await request({
        method: "POST",
        url: ADMIN_ENDPOINTS.ticketReply(ticketId),
        data: { message },
      });
    },
    onSuccess: async () => {
      setReplyMessage("");
      await queryClient.invalidateQueries({ queryKey: admin.ticket(ticketId) });
      await queryClient.invalidateQueries({ queryKey: admin.tickets() });
      toast.success("Reply sent");
    },
    onError: (mutationError) => {
      const message = mutationError instanceof Error ? mutationError.message : "Failed to send reply";
      toast.error(message);
    },
  });

  const notesMutation = useMutation({
    mutationFn: async (notes: string) => {
      await request({
        method: "POST",
        url: ADMIN_ENDPOINTS.ticketNotes(ticketId),
        data: { notes },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: admin.ticket(ticketId) });
      toast.success("Internal notes saved");
    },
    onError: (mutationError) => {
      const message = mutationError instanceof Error ? mutationError.message : "Failed to save notes";
      toast.error(message);
    },
  });

  const optimisticReplies = useMemo(() => {
    const baseReplies = toReplies(ticketQuery.data);
    if (!replyMutation.variables || !replyMutation.isPending) {
      return baseReplies;
    }

    return [
      ...baseReplies,
      {
        id: "optimistic-reply",
        authorId: "admin",
        authorName: "Admin",
        isAdmin: true,
        message: replyMutation.variables,
        createdAt: new Date().toISOString(),
      } as AdminTicketReply,
    ];
  }, [ticketQuery.data, replyMutation.variables, replyMutation.isPending]);

  const currentStatus = (ticketQuery.data?.status || "open") as (typeof STATUS_OPTIONS)[number];
  const currentPriority = mapPriorityFromApi(ticketQuery.data?.priority);
  const category = ticketQuery.data?.category || "other";
  const userName = ticketQuery.data?.user?.name || ticketQuery.data?.name || "Unknown User";
  const userEmail = ticketQuery.data?.user?.email || ticketQuery.data?.email || "-";
  const createdAt = ticketQuery.data?.createdAt || ticketQuery.data?.created_at;
  const subject = ticketQuery.data?.subject || "Untitled Ticket";
  const originalMessage = ticketQuery.data?.description || ticketQuery.data?.message || "No message provided.";
  const attachments = (ticketQuery.data?.attachments ?? []).map((attachment) => ({
    filename: attachment.filename || "attachment",
    url: attachment.url,
    uploadedAt: attachment.uploadedAt,
  }));
  const noteValue = internalNotes || ticketQuery.data?.internalNotes || ticketQuery.data?.internal_notes || "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/tickets" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200">
          <ArrowLeft className="h-4 w-4" />
          Back to Tickets
        </Link>
      </div>

      {ticketQuery.isLoading ? (
        <Card className="border-slate-800 bg-slate-900 text-slate-300">
          <CardContent className="py-10">Loading ticket...</CardContent>
        </Card>
      ) : ticketQuery.isError || !ticketQuery.data ? (
        <Card className="border-slate-800 bg-slate-900 text-rose-300">
          <CardContent className="py-10">Failed to load ticket: {String((ticketQuery.error as Error)?.message || "Not found")}</CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-6">
            <Card className="border-slate-800 bg-slate-900 text-slate-100">
              <CardHeader>
                <CardTitle className="text-xl font-black text-white">{subject}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-300">
                <p>Category: <span className="text-white">{category}</span></p>
                <p>
                  Status: <span className="inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-xs font-bold uppercase text-cyan-300">{currentStatus}</span>
                </p>
                <p>User: <span className="text-white">{userName}</span></p>
                <p>Email: <span className="text-white">{userEmail}</span></p>
                <p>Created: <span className="text-white">{createdAt ? new Date(createdAt).toLocaleString() : "-"}</span></p>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900 text-slate-100">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white">Original Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="whitespace-pre-wrap text-sm text-slate-200">{originalMessage}</p>

                {attachments.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Attachments</p>
                    {attachments.map((attachment, index) => (
                      <a key={`${attachment.url}-${index}`} href={attachment.url} target="_blank" rel="noreferrer" className="block">
                        <Button variant="secondary" size="sm" icon={<Download className="h-4 w-4" />}>
                          Download {attachment.filename}
                        </Button>
                      </a>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900 text-slate-100">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white">Thread</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {optimisticReplies.length === 0 ? (
                  <p className="text-sm text-slate-400">No conversation history yet.</p>
                ) : (
                  optimisticReplies.map((reply) => (
                    <div
                      key={reply.id}
                      className={[
                        "rounded-xl border px-3 py-2",
                        reply.isAdmin
                          ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-100"
                          : "border-slate-700 bg-slate-800 text-slate-100",
                      ].join(" ")}
                    >
                      <div className="mb-1 text-xs uppercase tracking-wide text-slate-300">
                        {(reply.isAdmin ? "Admin" : reply.authorName || "User")} • {new Date(reply.createdAt).toLocaleString()}
                      </div>
                      <p className="whitespace-pre-wrap text-sm">{reply.message}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900 text-slate-100">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white">Reply</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={5}
                  placeholder="Write your response to the user"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
                />
                <Button
                  variant="primary"
                  size="sm"
                  loading={replyMutation.isPending}
                  icon={<Send className="h-4 w-4" />}
                  disabled={!replyMessage.trim()}
                  onClick={() => replyMutation.mutate(replyMessage.trim())}
                >
                  Send Reply
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-slate-800 bg-slate-900 text-slate-100">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white">Status Control</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  value={currentStatus}
                  onChange={(e) => statusMutation.mutate({ status: e.target.value as (typeof STATUS_OPTIONS)[number] })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900 text-slate-100">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white">Priority</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-2">
                {PRIORITY_OPTIONS.map((option) => (
                  <Button
                    key={option}
                    size="sm"
                    variant={currentPriority === option ? "primary" : "outline"}
                    loading={statusMutation.isPending && statusMutation.variables?.priority === option}
                    onClick={() => statusMutation.mutate({ priority: option })}
                  >
                    {option[0].toUpperCase() + option.slice(1)}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900 text-slate-100">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white">Internal Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  value={noteValue}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={7}
                  placeholder="Visible only to admin staff"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
                />
                <Button
                  variant="success"
                  size="sm"
                  loading={notesMutation.isPending}
                  icon={<Save className="h-4 w-4" />}
                  onClick={() => notesMutation.mutate(noteValue)}
                >
                  Save Notes
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
