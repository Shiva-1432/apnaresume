'use client';

import { useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/nextjs';
import { API_BASE_URL } from '@/lib/apiBaseUrl';

type SkillGapItem = {
  skill: string;
  gap_type: 'critical' | 'nice-to-have' | string;
  learning_time_hours: number;
};

type RoadmapWeek = {
  week: number;
  skills: string[];
  resources: string[];
};

type SkillGapResponse = {
  skill_gaps: SkillGapItem[];
  learning_roadmap: RoadmapWeek[];
};

export default function SkillGapAnalyzer() {
  const { getToken } = useAuth();
  const [targetRole, setTargetRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [gaps, setGaps] = useState<SkillGapResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totals = useMemo(() => {
    if (!gaps) {
      return {
        critical: 0,
        niceToHave: 0,
        totalHours: 0,
        weeksAtTenHours: 0
      };
    }

    const critical = gaps.skill_gaps.filter((g) => g.gap_type === 'critical').length;
    const niceToHave = gaps.skill_gaps.filter((g) => g.gap_type === 'nice-to-have').length;
    const totalHours = gaps.skill_gaps.reduce((sum, g) => sum + (Number(g.learning_time_hours) || 0), 0);

    return {
      critical,
      niceToHave,
      totalHours,
      weeksAtTenHours: Math.ceil(totalHours / 10)
    };
  }, [gaps]);

  const handleAnalyze = async () => {
    if (!targetRole.trim()) {
      setError('Please enter a target role.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      const response = await axios.post(
        `${API_BASE_URL}/skill-gap/analyze-skill-gaps`,
        {
          target_role: targetRole.trim(),
          job_description: jobDescription.trim()
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setGaps(response.data.skill_gaps);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'Could not analyze skill gaps'
        : 'Could not analyze skill gaps';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 bg-white p-6 rounded-lg shadow">
      <h2 className="text-3xl font-bold">Skill Gap Analysis</h2>

      <div className="space-y-3">
        <input
          type="text"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          placeholder="Target role (e.g., Backend Developer)"
          className="w-full p-2 border rounded"
        />
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste job description (optional but recommended)"
          rows={6}
          className="w-full p-2 border rounded"
        />
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="px-5 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Analyze Skill Gaps'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          {error}
        </div>
      )}

      {gaps && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-50 border border-red-200 p-4 rounded">
              <h4 className="font-bold text-red-900">Critical Gaps</h4>
              <p className="text-sm text-red-700 mt-2">
                {totals.critical} skills blocking your chances
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
              <h4 className="font-bold text-yellow-900">Nice-to-Have Gaps</h4>
              <p className="text-sm text-yellow-700 mt-2">
                {totals.niceToHave} skills to stand out
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-6 rounded">
            <h3 className="font-bold text-blue-900 mb-4">Learning Roadmap</h3>
            <div className="space-y-4">
              {(gaps.learning_roadmap || []).map((week, i) => (
                <div key={i} className="bg-white p-4 rounded border-l-4 border-blue-500">
                  <h4 className="font-bold mb-2">Week {week.week}</h4>
                  <p className="text-sm mb-2">{(week.skills || []).join(', ')}</p>
                  <div className="space-y-1">
                    {(week.resources || []).map((resource, j) => (
                      <p key={j} className="text-xs text-blue-700">
                        {resource}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded">
              <p className="text-sm font-semibold text-green-900">
                Total learning time: {totals.totalHours} hours
              </p>
              <p className="text-xs text-green-800 mt-1">
                That is about {totals.weeksAtTenHours} weeks at 10 hours/week.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
