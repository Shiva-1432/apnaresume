"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertCircle, ArrowRight, CalendarClock, CreditCard, RotateCcw } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { logAdminAction } from "@/lib/utils/auditLog";

type PlanFilter = "all" | "free" | "pro" | "enterprise";
type StatusFilter = "all" | "active" | "canceled" | "past_due";

type SubscriptionRow = {
  id: string;
  userId: string;
  user: string;
  plan: "free" | "pro" | "enterprise";
  status: "active" | "canceled" | "past_due";
  startedAt: string;
  nextBillingAt?: string;
  amount: number;
};

type RevenuePoint = {
  month: string;
  mrr: number;
};

type ModalState =
  | { type: "cancel"; subscription: SubscriptionRow }
  | { type: "extend"; subscription: SubscriptionRow }
  | null;

const mockSubscriptions: SubscriptionRow[] = [
  { id: "sub_001", userId: "usr_101", user: "Aarav Sharma", plan: "pro", status: "active", startedAt: "2025-10-14", nextBillingAt: "2026-05-14", amount: 29 },
  { id: "sub_002", userId: "usr_102", user: "Neha Gupta", plan: "enterprise", status: "active", startedAt: "2025-07-04", nextBillingAt: "2026-05-04", amount: 199 },
  { id: "sub_003", userId: "usr_103", user: "Rohan Mehta", plan: "free", status: "active", startedAt: "2025-12-01", amount: 0 },
  { id: "sub_004", userId: "usr_104", user: "Sara Khan", plan: "pro", status: "past_due", startedAt: "2025-11-18", nextBillingAt: "2026-04-18", amount: 29 },
  { id: "sub_005", userId: "usr_105", user: "Ishan Verma", plan: "free", status: "canceled", startedAt: "2025-09-09", amount: 0 },
  { id: "sub_006", userId: "usr_106", user: "Mira Iyer", plan: "pro", status: "active", startedAt: "2026-01-15", nextBillingAt: "2026-05-15", amount: 29 },
  { id: "sub_007", userId: "usr_107", user: "Kabir Ali", plan: "enterprise", status: "active", startedAt: "2025-08-21", nextBillingAt: "2026-05-21", amount: 249 },
  { id: "sub_008", userId: "usr_108", user: "Priya Nair", plan: "free", status: "active", startedAt: "2026-02-02", amount: 0 },
  { id: "sub_009", userId: "usr_109", user: "Yash Patel", plan: "pro", status: "canceled", startedAt: "2025-05-30", amount: 29 },
  { id: "sub_010", userId: "usr_110", user: "Anika Das", plan: "enterprise", status: "past_due", startedAt: "2025-10-20", nextBillingAt: "2026-04-20", amount: 199 },
];

const revenueHistory: RevenuePoint[] = [
  { month: "May", mrr: 4900 },
  { month: "Jun", mrr: 5200 },
  { month: "Jul", mrr: 5600 },
  { month: "Aug", mrr: 6100 },
  { month: "Sep", mrr: 6400 },
  { month: "Oct", mrr: 6900 },
  { month: "Nov", mrr: 7200 },
  { month: "Dec", mrr: 7600 },
  { month: "Jan", mrr: 8100 },
  { month: "Feb", mrr: 8600 },
  { month: "Mar", mrr: 9200 },
  { month: "Apr", mrr: 9800 },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
}

function getSummaryStats(rows: SubscriptionRow[]) {
  const activePaid = rows.filter((sub) => sub.status === "active" && sub.plan !== "free");
  const freeUsers = rows.filter((sub) => sub.plan === "free" && sub.status === "active");
  const canceledThisMonth = rows.filter((sub) => sub.status === "canceled").length;
  const newSubscriptionsThisMonth = rows.filter((sub) => new Date(sub.startedAt).getMonth() === new Date().getMonth()).length;
  const totalPaidMrr = rows.reduce((total, sub) => (sub.plan === "free" || sub.status === "canceled" ? total : total + sub.amount), 0);

  return {
    mrr: totalPaidMrr,
    payingUsers: activePaid.length,
    freeUsers: freeUsers.length,
    churnRate: rows.length ? Math.round((canceledThisMonth / rows.length) * 100) : 0,
    newSubscriptionsThisMonth,
  };
}

export default function BillingAdminPage() {
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [modalState, setModalState] = useState<ModalState>(null);
  const [trialDays, setTrialDays] = useState(14);
  const [rows, setRows] = useState<SubscriptionRow[]>(mockSubscriptions);
  const { user } = useUser();

  const filteredRows = useMemo(() => {
    return rows.filter((subscription) => {
      const planMatches = planFilter === "all" || subscription.plan === planFilter;
      const statusMatches = statusFilter === "all" || subscription.status === statusFilter;
      return planMatches && statusMatches;
    });
  }, [planFilter, statusFilter, rows]);

  const summary = useMemo(() => getSummaryStats(rows), [rows]);

  const onCancelSubscription = (subscription: SubscriptionRow) => {
    void logAdminAction({
      adminId: user?.id || "unknown",
      action: "subscription_cancel",
      targetType: "subscription",
      targetId: subscription.id,
      metadata: { userId: subscription.userId, plan: subscription.plan },
    });
    // TODO: POST /api/admin/billing/:subId/cancel
    setRows((current) =>
      current.map((row) =>
        row.id === subscription.id ? { ...row, status: "canceled" } : row
      )
    );
    toast.success(`Cancellation queued for ${subscription.user}`);
    setModalState(null);
  };

  const onExtendTrial = (subscription: SubscriptionRow) => {
    void logAdminAction({
      adminId: user?.id || "unknown",
      action: "subscription_extend",
      targetType: "subscription",
      targetId: subscription.id,
      metadata: { userId: subscription.userId, plan: subscription.plan, days: trialDays },
    });
    // TODO: POST /api/admin/billing/:subId/extend with { days }
    toast.success(`Extended free access for ${subscription.user} by ${trialDays} days`);
    setModalState(null);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-100">
        Billing integration pending — connect Stripe or Razorpay
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Billing</h1>
          <p className="text-sm text-slate-400">Revenue dashboard and subscription controls</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "MRR", value: formatCurrency(summary.mrr), icon: CreditCard },
          { label: "Total paying users", value: String(summary.payingUsers), icon: ArrowRight },
          { label: "Free tier users", value: String(summary.freeUsers), icon: AlertCircle },
          { label: "Churn rate this month", value: `${summary.churnRate}%`, icon: RotateCcw },
          { label: "New subscriptions this month", value: String(summary.newSubscriptionsThisMonth), icon: CalendarClock },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border-slate-800 bg-slate-900 text-slate-100">
              <CardContent className="flex items-start justify-between gap-4 py-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{card.label}</p>
                  <p className="mt-2 text-2xl font-black text-white">{card.value}</p>
                </div>
                <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-300">
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle className="text-base font-bold text-white">Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tickFormatter={(value) => `$${Number(value) / 1000}k`} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #334155" }}
                labelStyle={{ color: "#cbd5e1" }}
                formatter={(value) => [formatCurrency(Number(value ?? 0)), "MRR"]}
              />
              <Line type="monotone" dataKey="mrr" stroke="#22d3ee" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle className="text-base font-bold text-white">Subscription Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Plan</label>
            <select
              value={planFilter}
              onChange={(event) => setPlanFilter(event.target.value as PlanFilter)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none"
            >
              <option value="all">All</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Status</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="canceled">Cancelled</option>
              <option value="past_due">Past Due</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle className="text-base font-bold text-white">Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-2 py-3">User</th>
                  <th className="px-2 py-3">Plan</th>
                  <th className="px-2 py-3">Status</th>
                  <th className="px-2 py-3">Started</th>
                  <th className="px-2 py-3">Next Billing</th>
                  <th className="px-2 py-3">Amount</th>
                  <th className="px-2 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((subscription) => (
                  <tr key={subscription.id} className="border-b border-slate-800/70 text-slate-200">
                    <td className="px-2 py-3 font-medium text-white">{subscription.user}</td>
                    <td className="px-2 py-3 capitalize">{subscription.plan}</td>
                    <td className="px-2 py-3 capitalize">{subscription.status.replace("_", " ")}</td>
                    <td className="px-2 py-3">{formatDate(subscription.startedAt)}</td>
                    <td className="px-2 py-3">{formatDate(subscription.nextBillingAt)}</td>
                    <td className="px-2 py-3">{formatCurrency(subscription.amount)}</td>
                    <td className="px-2 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/admin/users/${subscription.userId}`}>
                          <Button size="sm" variant="outline">View user</Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setModalState({ type: "cancel", subscription })}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setModalState({ type: "extend", subscription })}
                        >
                          Grant free access
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {modalState ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-2xl">
            {modalState.type === "cancel" ? (
              <>
                <h2 className="text-xl font-black text-white">Cancel subscription</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Cancel billing for {modalState.subscription.user}? This is currently stubbed and will be wired to Stripe or Razorpay later.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setModalState(null)}>Close</Button>
                  <Button variant="danger" onClick={() => onCancelSubscription(modalState.subscription)}>
                    Confirm cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-black text-white">Grant free access</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Extend trial / free access for {modalState.subscription.user}.
                </p>
                <div className="mt-4">
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Days</label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={trialDays}
                    onChange={(event) => setTrialDays(Number(event.target.value) || 1)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none"
                  />
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setModalState(null)}>Close</Button>
                  <Button variant="secondary" onClick={() => onExtendTrial(modalState.subscription)}>
                    Confirm extend
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
