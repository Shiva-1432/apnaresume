import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/nextjs';
import { API_BASE_URL } from '@/lib/apiBaseUrl';

interface PerfEndpoint { endpoint: string; avg_time: number; max_time: number; requests: number; }
interface PerfMetrics { total_requests: number; avg_response_time: number; error_rate: string; slowest_endpoints: PerfEndpoint[]; }

export default function PerformanceDashboard() {
  const { getToken } = useAuth();
  const [metrics, setMetrics] = useState<PerfMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setError('');
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Authentication required');
        }
        const res = await axios.get<{ metrics: PerfMetrics }>(`${API_BASE_URL}/admin/metrics/performance`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMetrics(res.data.metrics);
      } catch (err: any) {
        setError('Failed to load performance metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [getToken]);

  if (loading) return <div className="p-12 text-center font-black text-indigo-600 animate-pulse uppercase tracking-widest text-sm">Probing Latency...</div>;

  return (
    <div className="space-y-10 motion-fade-up">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Latency Engine</h1>
          <p className="text-neutral-500 font-bold">Real-time infrastructure performance monitoring.</p>
        </div>
      </div>

      {error && <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-600 rounded-3xl font-bold">{error}</div>}

      {metrics && (
        <div className="space-y-10">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { label: 'Total Ingress', value: metrics.total_requests, color: 'indigo' },
              { label: 'Avg Latency', value: `${metrics.avg_response_time}ms`, color: 'emerald' },
              { label: 'Fault Rate', value: metrics.error_rate, color: 'orange' }
            ].map((m, i) => (
              <div key={i} className="bg-glass p-8 rounded-[2.5rem] shadow-xl border border-white/40">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-4">{m.label}</p>
                <p className="text-4xl font-black text-neutral-900">{m.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-glass p-10 rounded-[3rem] shadow-2xl border border-white/40 backdrop-blur-3xl">
            <h2 className="text-2xl font-black text-neutral-900 mb-8 tracking-tight">Host Bottlenecks</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="pb-6 text-xs font-black uppercase tracking-widest text-neutral-400">Resource Path</th>
                    <th className="pb-6 text-xs font-black uppercase tracking-widest text-neutral-400 text-center">Avg ms</th>
                    <th className="pb-6 text-xs font-black uppercase tracking-widest text-neutral-400 text-center">Spike ms</th>
                    <th className="pb-6 text-xs font-black uppercase tracking-widest text-neutral-400 text-right">Hits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {metrics.slowest_endpoints.map((ep) => (
                    <tr key={ep.endpoint} className="hover:bg-indigo-50/10 transition-colors">
                      <td className="py-5 font-bold text-neutral-700">{ep.endpoint}</td>
                      <td className="py-5 text-center font-black text-neutral-900">{ep.avg_time}</td>
                      <td className="py-5 text-center font-bold text-orange-500">{ep.max_time}</td>
                      <td className="py-5 text-right font-black text-neutral-400">{ep.requests}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
