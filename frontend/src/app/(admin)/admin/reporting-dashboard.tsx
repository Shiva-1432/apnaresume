import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/nextjs';
import { API_BASE_URL } from '@/lib/apiBaseUrl';

interface SummaryMetric { total: number; day: number; week: number; month: number; }
interface ReportingSummary { users: SummaryMetric; resumes: SummaryMetric; analyses: SummaryMetric; payments: SummaryMetric & { revenue_total: number }; applications: SummaryMetric; tickets: SummaryMetric; timestamp: string; }

export default function ReportingDashboard() {
  const { getToken } = useAuth();
  const [summary, setSummary] = useState<ReportingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setError('');
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Authentication required');
        }
        const res = await axios.get<{ summary: ReportingSummary }>(`${API_BASE_URL}/admin/reporting/summary`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSummary(res.data.summary);
      } catch (err: any) {
        setError('Failed to load reporting summary.');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [getToken]);

  if (loading) return <div className="p-12 text-center font-black text-indigo-600 animate-pulse uppercase tracking-widest text-sm">Aggregating Global Data...</div>;

  return (
    <div className="space-y-10 motion-fade-up">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Intelligence Reporting</h1>
          <p className="text-neutral-500 font-bold">Comprehensive growth and financial analytics.</p>
        </div>
      </div>

      {error && <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-600 rounded-3xl font-bold">{error}</div>}

      {summary && (
        <div className="space-y-10">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { label: 'Total Revenue', value: `Rs ${summary.payments.revenue_total.toFixed(0)}`, color: 'emerald' },
              { label: 'Global Users', value: summary.users.total, color: 'indigo' },
              { label: 'Job Success', value: summary.applications.total, color: 'violet' }
            ].map((m, i) => (
              <div key={i} className="bg-glass p-8 rounded-[2.5rem] shadow-xl border border-white/40">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-4">{m.label}</p>
                <p className="text-4xl font-black text-neutral-900">{m.value}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              { title: 'User Trajectory', data: summary.users, color: 'indigo' },
              { title: 'Resumes Ingested', data: summary.resumes, color: 'emerald' },
              { title: 'AI Throughput', data: summary.analyses, color: 'violet' },
              { title: 'Support Traffic', data: summary.tickets, color: 'orange' }
            ].map((sect, i) => (
              <div key={i} className="bg-glass p-10 rounded-[3rem] shadow-2xl border border-white/40 backdrop-blur-3xl relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-${sect.color}-500/5 blur-3xl`} />
                <h3 className="text-xl font-black text-neutral-900 mb-8 tracking-tight">{sect.title}</h3>
                <div className="grid grid-cols-2 gap-y-6">
                  <div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Last 24h</p>
                    <p className="text-2xl font-black text-neutral-900">+{sect.data.day}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Last 7d</p>
                    <p className="text-2xl font-black text-neutral-900">+{sect.data.week}</p>
                  </div>
                  <div className="col-span-2 pt-6 border-t border-white/20 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">30 Day Volume</p>
                      <p className="text-3xl font-black text-neutral-900">{sect.data.month}</p>
                    </div>
                    <div className="text-[10px] font-bold text-neutral-400">Total Lifecycle: {sect.data.total}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] pt-10">
            Quantum Analytics Engine • Last Update: {new Date(summary.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
}
