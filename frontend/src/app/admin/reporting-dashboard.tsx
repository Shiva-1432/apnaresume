import { useEffect, useState } from 'react';
import axios from 'axios';
import Card from '../../components/ui/Card';

interface SummaryMetric {
  total: number;
  day: number;
  week: number;
  month: number;
}

interface ReportingSummary {
  users: SummaryMetric;
  resumes: SummaryMetric;
  analyses: SummaryMetric;
  payments: SummaryMetric & { revenue_total: number };
  applications: SummaryMetric;
  tickets: SummaryMetric;
  timestamp: string;
}

export default function ReportingDashboard() {
  const [summary, setSummary] = useState<ReportingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('auth_token');
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const res = await axios.get<{ summary: ReportingSummary }>(`${apiBase}/admin/reporting/summary`, {
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
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Business Reporting Dashboard</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {summary && (
        <div className="space-y-8">
          <div className="grid md:grid-cols-2 gap-4">
            <Card variant="elevated" padding="md">
              <h2 className="font-semibold mb-2">User Growth</h2>
              <ul className="text-sm">
                <li>Total: <b>{summary.users.total}</b></li>
                <li>Last 24h: <b>{summary.users.day}</b></li>
                <li>Last 7d: <b>{summary.users.week}</b></li>
                <li>Last 30d: <b>{summary.users.month}</b></li>
              </ul>
            </Card>
            <Card variant="elevated" padding="md">
              <h2 className="font-semibold mb-2">Resume Uploads</h2>
              <ul className="text-sm">
                <li>Total: <b>{summary.resumes.total}</b></li>
                <li>Last 24h: <b>{summary.resumes.day}</b></li>
                <li>Last 7d: <b>{summary.resumes.week}</b></li>
                <li>Last 30d: <b>{summary.resumes.month}</b></li>
              </ul>
            </Card>
            <Card variant="elevated" padding="md">
              <h2 className="font-semibold mb-2">Analyses</h2>
              <ul className="text-sm">
                <li>Total: <b>{summary.analyses.total}</b></li>
                <li>Last 24h: <b>{summary.analyses.day}</b></li>
                <li>Last 7d: <b>{summary.analyses.week}</b></li>
                <li>Last 30d: <b>{summary.analyses.month}</b></li>
              </ul>
            </Card>
            <Card variant="elevated" padding="md">
              <h2 className="font-semibold mb-2">Payments</h2>
              <ul className="text-sm">
                <li>Total: <b>{summary.payments.total}</b></li>
                <li>Last 24h: <b>{summary.payments.day}</b></li>
                <li>Last 7d: <b>{summary.payments.week}</b></li>
                <li>Last 30d: <b>{summary.payments.month}</b></li>
                <li className="mt-2">Revenue: <b>Rs {summary.payments.revenue_total.toFixed(0)}</b></li>
              </ul>
            </Card>
            <Card variant="elevated" padding="md">
              <h2 className="font-semibold mb-2">Job Applications</h2>
              <ul className="text-sm">
                <li>Total: <b>{summary.applications.total}</b></li>
                <li>Last 24h: <b>{summary.applications.day}</b></li>
                <li>Last 7d: <b>{summary.applications.week}</b></li>
                <li>Last 30d: <b>{summary.applications.month}</b></li>
              </ul>
            </Card>
            <Card variant="elevated" padding="md">
              <h2 className="font-semibold mb-2">Support Tickets</h2>
              <ul className="text-sm">
                <li>Total: <b>{summary.tickets.total}</b></li>
                <li>Last 24h: <b>{summary.tickets.day}</b></li>
                <li>Last 7d: <b>{summary.tickets.week}</b></li>
                <li>Last 30d: <b>{summary.tickets.month}</b></li>
              </ul>
            </Card>
          </div>
          <div className="text-xs text-gray-500 mt-4">Last updated: {new Date(summary.timestamp).toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}
