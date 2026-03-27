import { useEffect, useState } from 'react';
import axios from 'axios';
import Card from '../../components/ui/Card';

interface PerfEndpoint {
  endpoint: string;
  avg_time: number;
  max_time: number;
  requests: number;
}

interface PerfMetrics {
  total_requests: number;
  avg_response_time: number;
  error_rate: string;
  slowest_endpoints: PerfEndpoint[];
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerfMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('auth_token');
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const res = await axios.get<{ metrics: PerfMetrics }>(`${apiBase}/admin/metrics/performance`, {
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
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Performance Dashboard</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {metrics && (
        <>
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card variant="elevated" padding="md">
              <p className="text-gray-600 text-sm">Total Requests</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{metrics.total_requests}</p>
            </Card>
            <Card variant="elevated" padding="md">
              <p className="text-gray-600 text-sm">Avg Response Time</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{metrics.avg_response_time} ms</p>
            </Card>
            <Card variant="elevated" padding="md">
              <p className="text-gray-600 text-sm">Error Rate</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{metrics.error_rate}</p>
            </Card>
          </div>
          <Card variant="elevated" padding="lg">
            <h2 className="text-xl font-semibold mb-4">Slowest Endpoints</h2>
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">Endpoint</th>
                  <th>Avg Time (ms)</th>
                  <th>Max Time (ms)</th>
                  <th>Requests</th>
                </tr>
              </thead>
              <tbody>
                {metrics.slowest_endpoints.map((ep) => (
                  <tr key={ep.endpoint}>
                    <td className="pr-4 py-1">{ep.endpoint}</td>
                    <td className="text-center">{ep.avg_time}</td>
                    <td className="text-center">{ep.max_time}</td>
                    <td className="text-center">{ep.requests}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
