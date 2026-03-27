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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Resume Version A/B Testing Dashboard</h1>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b">Version</th>
                <th className="px-4 py-2 border-b">Applications</th>
                <th className="px-4 py-2 border-b">Shortlists</th>
                <th className="px-4 py-2 border-b">Interviews</th>
                <th className="px-4 py-2 border-b">Offers</th>
                <th className="px-4 py-2 border-b">Success Rate (%)</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((stat) => (
                <tr key={stat.version}>
                  <td className="px-4 py-2 border-b font-mono">{stat.version}</td>
                  <td className="px-4 py-2 border-b">{stat.applications}</td>
                  <td className="px-4 py-2 border-b">{stat.shortlists}</td>
                  <td className="px-4 py-2 border-b">{stat.interviews}</td>
                  <td className="px-4 py-2 border-b">{stat.offers}</td>
                  <td className="px-4 py-2 border-b">{stat.successRate.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ResumeABTestingDashboard;
