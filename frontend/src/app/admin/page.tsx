'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

type ActiveTab = 'overview' | 'users' | 'payments' | 'tickets';

type Metrics = {
  users: {
    total: number;
    active_24h: number;
    growth_potential: number;
  };
  content: {
    total_resumes: number;
    total_analyses: number;
    analyses_this_week: number;
  };
  revenue: {
    total_revenue: number;
    total_payments: number;
    payments_this_week: number;
  };
  applications: {
    total: number;
  };
  support: {
    total_tickets: number;
    open_tickets: number;
  };
  timestamp: string;
};

type AdminUser = {
  _id: string;
  email: string;
  name?: string;
  credits?: number;
  created_at: string;
};

type PaymentItem = {
  _id: string;
  user_id?: {
    email?: string;
  };
  amount: number;
  credits_added?: number;
  status: string;
  created_at: string;
};

type TicketItem = {
  _id: string;
  ticket_number?: string;
  subject: string;
  status: 'open' | 'in-progress' | 'waiting-customer' | 'resolved' | 'closed';
  created_at: string;
  user_id?: {
    email?: string;
  };
};

const tabs: { id: ActiveTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'payments', label: 'Payments' },
  { id: 'tickets', label: 'Support' }
];

export default function AdminDashboard() {
  const router = useRouter();
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
        const token = localStorage.getItem('auth_token');
        const headers = { Authorization: `Bearer ${token}` };

        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

        const [metricsRes, usersRes, paymentsRes, ticketsRes] = await Promise.all([
          axios.get<{ metrics: Metrics }>(`${apiBase}/admin/dashboard/metrics`, { headers }),
          axios.get<{ users: AdminUser[] }>(`${apiBase}/admin/users?limit=10`, { headers }),
          axios.get<{ payments: PaymentItem[] }>(`${apiBase}/admin/payments?limit=10`, { headers }),
          axios.get<{ tickets: TicketItem[] }>(`${apiBase}/admin/support/tickets?limit=10`, { headers })
        ]);

        setMetrics(metricsRes.data.metrics);
        setUsers(usersRes.data.users || []);
        setPayments(paymentsRes.data.payments || []);
        setTickets(ticketsRes.data.tickets || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        alert('Access denied or admin privileges required.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage ApnaResume platform</p>
        </div>

        <div className="flex gap-4 mb-8 border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-semibold border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && metrics && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <Card variant="elevated" padding="md">
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{metrics.users.total}</p>
                <p className="text-xs text-gray-500 mt-1">{metrics.users.active_24h} active (24h)</p>
              </Card>

              <Card variant="elevated" padding="md">
                <p className="text-gray-600 text-sm">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600 mt-2">Rs {metrics.revenue.total_revenue.toFixed(0)}</p>
                <p className="text-xs text-gray-500 mt-1">{metrics.revenue.total_payments} transactions</p>
              </Card>

              <Card variant="elevated" padding="md">
                <p className="text-gray-600 text-sm">Total Analyses</p>
                <p className="text-3xl font-bold text-indigo-600 mt-2">{metrics.content.total_analyses}</p>
                <p className="text-xs text-gray-500 mt-1">{metrics.content.analyses_this_week} this week</p>
              </Card>

              <Card variant="elevated" padding="md">
                <p className="text-gray-600 text-sm">Open Tickets</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{metrics.support.open_tickets}</p>
                <p className="text-xs text-gray-500 mt-1">{metrics.support.total_tickets} total</p>
              </Card>
            </div>

            <Card variant="elevated" padding="lg">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Payments</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">User</th>
                      <th className="text-left py-2">Amount</th>
                      <th className="text-left py-2">Credits</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.slice(0, 5).map((payment) => (
                      <tr key={payment._id} className="border-b hover:bg-gray-50">
                        <td className="py-3">{payment.user_id?.email || 'N/A'}</td>
                        <td className="py-3">Rs {(payment.amount / 100).toFixed(0)}</td>
                        <td className="py-3">{payment.credits_added || 0}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              payment.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {payment.status}
                          </span>
                        </td>
                        <td className="py-3">{new Date(payment.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card variant="elevated" padding="lg">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Open Support Tickets</h2>
              <div className="space-y-3">
                {tickets
                  .filter((t) => t.status === 'open')
                  .slice(0, 5)
                  .map((ticket) => (
                    <div key={ticket._id} className="flex items-start justify-between p-4 bg-gray-50 rounded">
                      <div>
                        <p className="font-semibold text-gray-900">{ticket.ticket_number || ticket._id}</p>
                        <p className="text-sm text-gray-600">{ticket.subject}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/tickets/${ticket._id}`)}>
                        Respond
                      </Button>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'users' && (
          <Card variant="elevated" padding="lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Users</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Email</th>
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">Credits</th>
                    <th className="text-left py-2">Joined</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b hover:bg-gray-50">
                      <td className="py-3">{user.email}</td>
                      <td className="py-3">{user.name || '-'}</td>
                      <td className="py-3 font-semibold">{user.credits || 0}</td>
                      <td className="py-3">{new Date(user.created_at).toLocaleDateString()}</td>
                      <td className="py-3">
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/users/${user._id}`)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'payments' && (
          <Card variant="elevated" padding="lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Payments</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">User</th>
                    <th className="text-left py-2">Amount</th>
                    <th className="text-left py-2">Credits</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment._id} className="border-b hover:bg-gray-50">
                      <td className="py-3">{payment.user_id?.email || 'N/A'}</td>
                      <td className="py-3">Rs {(payment.amount / 100).toFixed(0)}</td>
                      <td className="py-3">{payment.credits_added || 0}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            payment.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="py-3">{new Date(payment.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'tickets' && (
          <Card variant="elevated" padding="lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Support Tickets</h2>
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket._id}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded border-l-4 border-blue-500"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{ticket.ticket_number || ticket._id}</p>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          ticket.status === 'open'
                            ? 'bg-red-100 text-red-700'
                            : ticket.status === 'in-progress'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{ticket.subject}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {ticket.user_id?.email || 'Unknown user'} • {new Date(ticket.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => router.push(`/admin/tickets/${ticket._id}`)}>
                    Respond
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
