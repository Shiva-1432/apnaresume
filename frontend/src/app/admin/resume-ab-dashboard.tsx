"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface ResumeVersionStats {
  version: string;
  applications: number;
  shortlists: number;
  interviews: number;
  offers: number;
  successRate: number;
}

const ResumeABTestingDashboard: React.FC = () => {
  const [stats, setStats] = useState<ResumeVersionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/resume-versions/performance-stats');
        setStats(response.data.stats || []);
        setError(null);
      } catch (err: any) {
        setError('Failed to fetch resume version stats.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-12 text-center font-black text-indigo-600 animate-pulse uppercase tracking-widest text-sm">Parsing A/B Metrics...</div>;

  return (
    <div className="space-y-10 motion-fade-up">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Variant Intelligence</h1>
          <p className="text-neutral-500 font-bold">A/B Testing and conversion optimization analytics.</p>
        </div>
      </div>

      {error && <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-600 rounded-3xl font-bold">{error}</div>}

      <div className="bg-glass p-10 rounded-[3rem] shadow-2xl border border-white/40 backdrop-blur-3xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl -mr-20 -mt-20" />
        <h2 className="text-2xl font-black text-neutral-900 mb-8 tracking-tight">Performance Matrix</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/20">
                <th className="pb-6 text-xs font-black uppercase tracking-widest text-neutral-400">Version ID</th>
                <th className="pb-6 text-xs font-black uppercase tracking-widest text-neutral-400 text-center">Volume</th>
                <th className="pb-6 text-xs font-black uppercase tracking-widest text-neutral-400 text-center">Shortlists</th>
                <th className="pb-6 text-xs font-black uppercase tracking-widest text-neutral-400 text-center">Interviews</th>
                <th className="pb-6 text-xs font-black uppercase tracking-widest text-neutral-400 text-right">Yield %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {stats.map((stat) => (
                <tr key={stat.version} className="hover:bg-indigo-50/10 transition-colors">
                  <td className="py-5 font-mono text-xs font-black text-neutral-900">{stat.version}</td>
                  <td className="py-5 text-center font-bold text-neutral-500">{stat.applications}</td>
                  <td className="py-5 text-center font-bold text-neutral-700">{stat.shortlists}</td>
                  <td className="py-5 text-center font-bold text-neutral-700">{stat.interviews}</td>
                  <td className="py-5 text-right font-black text-indigo-600 text-lg">
                    {stat.successRate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {stats.length === 0 && (
            <div className="py-12 text-center text-neutral-400 font-bold italic">No variants active in the current cycle.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeABTestingDashboard;
