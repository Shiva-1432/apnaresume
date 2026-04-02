'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@clerk/nextjs';
import { API_BASE_URL } from '@/lib/apiBaseUrl';

type ActiveTab = 'overview' | 'users' | 'payments' | 'tickets';

type Metrics = {
  users: { total: number; active_24h: number; growth_potential: number };
  content: { total_resumes: number; total_analyses: number; analyses_this_week: number };
  revenue: { total_revenue: number; total_payments: number; payments_this_week: number };
  applications: { total: number };
  support: { total_tickets: number; open_tickets: number };
  timestamp: string;
};

type AdminUser = { _id: string; email: string; name?: string; credits?: number; created_at: string };
type PaymentItem = { _id: string; user_id?: { email?: string }; amount: number; credits_added?: number; status: string; created_at: string };
type TicketItem = { _id: string; ticket_number?: string; subject: string; status: 'open' | 'in-progress' | 'waiting-customer' | 'resolved' | 'closed'; created_at: string; user_id?: { email?: string } };

const tabs: { id: ActiveTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'payments', label: 'Payments' },
  { id: 'tickets', label: 'Support' }
];

export default function AdminDashboard() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        if (!token) {
          router.push('/sign-in');
          return;
        }
        const headers = { Authorization: `Bearer ${token}` };
        const [mRes, uRes, pRes, tRes] = await Promise.all([
          axios.get<{ metrics: Metrics }>(`${API_BASE_URL}/admin/dashboard/metrics`, { headers }),
          axios.get<{ users: AdminUser[] }>(`${API_BASE_URL}/admin/users?limit=10`, { headers }),
          axios.get<{ payments: PaymentItem[] }>(`${API_BASE_URL}/admin/payments?limit=10`, { headers }),
          axios.get<{ tickets: TicketItem[] }>(`${API_BASE_URL}/admin/support/tickets?limit=10`, { headers })
        ]);
        setMetrics(mRes.data.metrics);
        setUsers(uRes.data.users || []);
        setPayments(pRes.data.payments || []);
        setTickets(tRes.data.tickets || []);
      } catch (err) {
        console.error('Admin Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [getToken, router]);

  if (loading) return <div className="min-h-screen bg-mesh flex items-center justify-center font-black text-indigo-600 animate-pulse">Syncing Admin Node...</div>;

  return (
    <div className="min-h-screen bg-mesh py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="motion-fade-up">
            <h1 className="text-5xl font-black text-neutral-900 tracking-tight leading-tight">Admin Console</h1>
            <p className="text-neutral-500 font-bold mt-2">Platform orchestration and intelligence.</p>
          </div>
          <div className="flex gap-2 bg-white/40 p-1.5 rounded-2xl backdrop-blur-3xl border border-white/40 shadow-xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-xl font-black text-sm transition-all ${
                  activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-neutral-500 hover:bg-white/60 hover:text-neutral-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'overview' && metrics && (
          <div className="space-y-8 motion-fade-up">
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { label: 'Platform Users', value: metrics.users.total, sub: `${metrics.users.active_24h} active`, color: 'indigo' },
                { label: 'Total Revenue', value: `Rs ${metrics.revenue.total_revenue.toFixed(0)}`, sub: `${metrics.revenue.total_payments} xactions`, color: 'emerald' },
                { label: 'AI Analyses', value: metrics.content.total_analyses, sub: `${metrics.content.analyses_this_week} this week`, color: 'violet' },
                { label: 'Tickets', value: metrics.support.open_tickets, sub: 'open action items', color: 'orange' }
              ].map((m, i) => (
                <div key={i} className="bg-glass p-8 rounded-[2.5rem] shadow-xl border border-white/40 relative overflow-hidden group">
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-${m.color}-500/5 blur-3xl`} />
                  <p className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-4">{m.label}</p>
                  <p className="text-4xl font-black text-neutral-900 mb-2">{m.value}</p>
                  <p className="text-xs font-bold text-neutral-500">{m.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-glass p-10 rounded-[2.5rem] shadow-2xl border border-white/40 backdrop-blur-3xl">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-neutral-900 tracking-tight">Recent Transactions</h2>
                  <button onClick={() => setActiveTab('payments')} className="text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors">View All</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Email</th>
                        <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-right">Amount</th>
                        <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {payments.slice(0, 5).map((p) => (
                        <tr key={p._id} className="group hover:bg-indigo-50/10 transition-colors">
                          <td className="py-4 font-bold text-neutral-700">{p.user_id?.email || 'N/A'}</td>
                          <td className="py-4 font-black text-neutral-900 text-right">Rs {(p.amount / 100).toFixed(0)}</td>
                          <td className="py-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${p.status === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-glass p-10 rounded-[2.5rem] shadow-2xl border border-white/40 backdrop-blur-3xl">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-neutral-900 tracking-tight">Pending Infrastructure</h2>
                  <button onClick={() => setActiveTab('tickets')} className="text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors">View All</button>
                </div>
                <div className="space-y-4">
                  {tickets.filter(t => t.status === 'open').slice(0, 4).map((t) => (
                    <div key={t._id} className="p-6 bg-white/40 rounded-3xl border border-white/60 hover:bg-white/60 transition-all cursor-pointer group shadow-sm flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">#{t.ticket_number || t._id.slice(-6)}</p>
                        <p className="font-black text-neutral-900">{t.subject}</p>
                        <p className="text-xs font-bold text-neutral-500">{t.user_id?.email}</p>
                      </div>
                      <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        →
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'users' || activeTab === 'payments' || activeTab === 'tickets') && (
          <div className="bg-glass p-12 rounded-[3.5rem] shadow-2xl border border-white/40 backdrop-blur-3xl motion-fade-up min-h-[60vh]">
            <h2 className="text-3xl font-black text-neutral-900 tracking-tight mb-10 capitalize">{activeTab}</h2>
            <div className="overflow-x-auto pb-10">
              {activeTab === 'users' && (
                <table className="w-full">
                   <thead>
                    <tr className="border-b border-white/20 text-left">
                      <th className="pb-6 text-xs font-black uppercase tracking-widest text-neutral-400">Identity</th>
                      <th className="pb-6 text-xs font-black uppercase tracking-widest text-neutral-400">Balance</th>
                      <th className="pb-6 text-xs font-black uppercase tracking-widest text-neutral-400">Onboarded</th>
                      <th className="pb-6 text-xs font-black uppercase tracking-widest text-neutral-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {users.map((u) => (
                      <tr key={u._id} className="group hover:bg-indigo-50/10 transition-colors">
                        <td className="py-6">
                          <p className="font-black text-neutral-900 group-hover:text-indigo-600 transition-colors">{u.email}</p>
                          <p className="text-xs font-bold text-neutral-400">{u.name || 'Incognito User'}</p>
                        </td>
                        <td className="py-6 font-black text-neutral-700">{u.credits || 0} CR</td>
                        <td className="py-6 text-xs font-bold text-neutral-400">{new Date(u.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</td>
                        <td className="py-6 text-right">
                          <button className="px-5 py-2 bg-indigo-600/10 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">Command</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {activeTab === 'payments' && (
                 <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="pb-6 text-xs font-black uppercase tracking-widest text-neutral-400">Account</th>
                        <th className="pb-6 text-xs font-black uppercase tracking-widest text-neutral-400 text-center">Amount</th>
                        <th className="pb-6 text-xs font-black uppercase tracking-widest text-neutral-400 text-center">Fuel added</th>
                        <th className="pb-6 text-xs font-black uppercase tracking-widest text-neutral-400 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {payments.map((p) => (
                        <tr key={p._id} className="hover:bg-emerald-50/10 transition-colors">
                          <td className="py-6 font-black text-neutral-900">{p.user_id?.email || 'N/A'}</td>
                          <td className="py-6 text-center font-black text-emerald-600">Rs {(p.amount / 100).toFixed(0)}</td>
                          <td className="py-6 text-center text-xs font-black text-neutral-400 uppercase">{p.credits_added || 0} Credits</td>
                          <td className="py-6 text-right text-xs font-bold text-neutral-400">{new Date(p.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              )}
              {activeTab === 'tickets' && (
                 <div className="grid gap-6">
                    {tickets.map((t) => (
                      <div key={t._id} className="p-8 bg-white/40 rounded-[2.5rem] border border-white/60 hover:bg-white/60 transition-all group shadow-sm flex items-center justify-between">
                         <div className="flex gap-6 items-center">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-inner ${t.status === 'open' ? 'bg-orange-500/10 text-orange-600' : 'bg-indigo-500/10 text-indigo-600'}`}>
                              {t.status === 'open' ? '🔥' : '⚙️'}
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                  <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">#{t.ticket_number || t._id.slice(-6)}</p>
                                  <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${t.status === 'open' ? 'bg-orange-500/10 text-orange-600' : 'bg-neutral-500/10 text-neutral-500'}`}>
                                    {t.status}
                                  </span>
                                </div>
                                <h3 className="text-xl font-black text-neutral-900 group-hover:text-indigo-600 transition-colors">{t.subject}</h3>
                                <p className="text-xs font-bold text-neutral-500">{t.user_id?.email} • {new Date(t.created_at).toLocaleDateString()}</p>
                            </div>
                         </div>
                         <button className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-neutral-900 shadow-xl shadow-indigo-100 transition-all active:scale-95">Intercept</button>
                      </div>
                    ))}
                 </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
