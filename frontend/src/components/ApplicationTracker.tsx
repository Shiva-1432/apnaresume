'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { requestWithRetry } from '@/lib/http';

type Application = {
  _id: string;
  job_title: string;
  company: string;
  applied_date: string;
  status: 'applied' | 'viewed' | 'shortlisted' | 'interview' | 'rejected' | 'offer';
  match_score?: number;
};

type Stats = {
  total_applications: number;
  by_status: {
    shortlisted: number;
    interviewed: number;
  };
  success_rate: string;
};

export default function ApplicationTracker() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('auth_token');
    return {
      Authorization: `Bearer ${token}`
    };
  }, []);

  const fetchApplications = useCallback(async () => {
    try {
      const response = await requestWithRetry(() => axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/job-applications/list`,
        { headers: getAuthHeaders() }
      ));
      setApplications(response.data.applications || []);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'Failed to fetch applications'
        : 'Failed to fetch applications';
      setError(message);
    }
  }, [getAuthHeaders]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await requestWithRetry(() => axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/job-applications/application-stats`,
        { headers: getAuthHeaders() }
      ));
      setStats(response.data);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'Failed to fetch stats'
        : 'Failed to fetch stats';
      setError(message);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError('');
      Promise.all([fetchApplications(), fetchStats()])
        .finally(() => setLoading(false));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchApplications, fetchStats]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/job-applications/${id}/status`,
        { status },
        { headers: getAuthHeaders() }
      );

      setApplications((prev) => prev.map((app) => (app._id === id ? { ...app, status: status as Application['status'] } : app)));
      fetchStats();
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'Failed to update status'
        : 'Failed to update status';
      setError(message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Application Tracker</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="bg-white border rounded p-4 text-sm text-gray-600">
          Loading your applications...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded">
          <p className="text-gray-600 text-sm">Total Applications</p>
          <p className="text-3xl font-bold text-blue-600">{stats?.total_applications || 0}</p>
        </div>

        <div className="bg-yellow-50 p-4 rounded">
          <p className="text-gray-600 text-sm">Shortlisted</p>
          <p className="text-3xl font-bold text-yellow-600">{stats?.by_status?.shortlisted || 0}</p>
        </div>

        <div className="bg-green-50 p-4 rounded">
          <p className="text-gray-600 text-sm">Interviews</p>
          <p className="text-3xl font-bold text-green-600">{stats?.by_status?.interviewed || 0}</p>
        </div>

        <div className="bg-purple-50 p-4 rounded">
          <p className="text-gray-600 text-sm">Success Rate</p>
          <p className="text-3xl font-bold text-purple-600">{stats?.success_rate || 0}%</p>
        </div>
      </div>

      <div className="space-y-3">
        {!loading && applications.length === 0 && (
          <div className="bg-white p-6 rounded border text-center">
            <p className="text-neutral-800 font-semibold mb-1">No applications tracked yet</p>
            <p className="text-sm text-neutral-600">Add your first job application to start tracking progress and status updates.</p>
          </div>
        )}

        {applications.map((app) => (
          <div key={app._id} className="bg-white p-4 rounded border">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg">{app.job_title}</h3>
                <p className="text-gray-600">{app.company}</p>
              </div>
              <select
                value={app.status}
                onChange={(e) => updateStatus(app._id, e.target.value)}
                className="px-3 py-1 border rounded"
              >
                <option value="applied">Applied</option>
                <option value="viewed">Viewed</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interview">Interview</option>
                <option value="rejected">Rejected</option>
                <option value="offer">Offer</option>
              </select>
            </div>

            <div className="text-sm text-gray-600 mb-3">
              Applied: {new Date(app.applied_date).toLocaleDateString()}
              {app.match_score ? ` • Match: ${app.match_score}%` : ''}
            </div>

            {app.status === 'rejected' && (
              <div className="bg-red-50 border border-red-200 p-3 rounded mt-3">
                <p className="text-sm font-semibold text-red-900 mb-2">Improvement Suggestions:</p>
                <ul className="text-sm text-red-800 space-y-1">
                  <li>• Missing AWS keyword (mentioned in 80% of similar roles)</li>
                  <li>• Add a project showing distributed systems experience</li>
                  <li>• Consider getting AWS Solution Architect certification</li>
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
