'use client';

import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/nextjs';
import StatusMessage from '@/components/ui/StatusMessage';
import { API_BASE_URL } from '@/lib/apiBaseUrl';

type ResumeVersion = {
  _id: string;
  is_version?: boolean;
  file_name?: string;
  target_role?: string;
  created_at?: string;
  applications_count?: number;
  shortlist_count?: number;
};

export default function ResumeVersionManager({ resumes }: { resumes: ResumeVersion[] }) {
  const { getToken } = useAuth();
  const [targetRole, setTargetRole] = useState('');
  const [baseResumeId, setBaseResumeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<ResumeVersion | null>(null);
  const [versions, setVersions] = useState<ResumeVersion[]>(() =>
    resumes.filter((r) => r.is_version)
  );

  const baseResumes = resumes.filter((r) => !r.is_version);
  const versionedResumes = versions;

  const formatDate = (dateValue?: string) => {
    if (!dateValue) {
      return 'N/A';
    }
    return new Date(dateValue).toLocaleDateString();
  };

  const handleCreateVersion = async () => {
    setError('');
    setInfo('');

    if (!baseResumeId || !targetRole.trim()) {
      setError('Select a resume and enter a target role.');
      return;
    }

    setLoading(true);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      const response = await axios.post<{ version: ResumeVersion }>(
        `${API_BASE_URL}/resume-versions/create-role-version`,
        {
          base_resume_id: baseResumeId,
          target_role: targetRole
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newVersion = response.data?.version;
      if (newVersion) {
        setVersions((prev) => [...prev, newVersion]);
      }

      setInfo(`Created version for ${targetRole}.`);
      setTargetRole('');
      setBaseResumeId('');
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error || 'Failed to create version'
        : 'Failed to create version';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <StatusMessage variant="error" message={error} />
      )}
      {info && (
        <StatusMessage variant="success" message={info} />
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Create Role-Optimized Resume
        </h2>
        <p className="text-gray-600 mb-6">
          Create specialized versions of your resume for different job roles.
          Each version emphasizes relevant experience for that specific role.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Choose base resume
            </label>
            <select
              value={baseResumeId}
              onChange={(e) => setBaseResumeId(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
            >
              <option value="">Select a resume...</option>
              {baseResumes.map((resume) => (
                <option key={resume._id} value={resume._id}>
                  {resume.file_name} (uploaded {formatDate(resume.created_at)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Target job role
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g., Backend Engineer, Data Scientist, etc."
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              The role you are creating this version for
            </p>
          </div>

          <button
            onClick={handleCreateVersion}
            disabled={loading || !baseResumeId || !targetRole.trim()}
            className="w-full p-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Optimized Version'}
          </button>
        </div>
      </div>

      {versionedResumes.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Your Resume Versions ({versionedResumes.length})
          </h2>

          <div className="space-y-3">
            {versionedResumes.map((version) => (
              <button
                key={version._id}
                onClick={() => setSelectedVersion(version)}
                className="w-full p-4 bg-linear-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg hover:shadow-lg transition text-left"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {version.target_role} - Optimized
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Created {formatDate(version.created_at)}
                    </p>
                  </div>

                  {(version.applications_count ?? 0) > 0 && (
                    <div className="text-right text-sm">
                      <p className="font-semibold text-gray-900">
                        {version.applications_count ?? 0} applications
                      </p>
                      {(version.shortlist_count ?? 0) > 0 && (
                        <p className="text-green-600">
                          {version.shortlist_count ?? 0} shortlists
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedVersion && (
        <div className="bg-white p-6 rounded-lg shadow border-2 border-blue-300 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {selectedVersion.target_role} - Optimized Version
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Created: {formatDate(selectedVersion.created_at)}
              </p>
            </div>
            <button
              onClick={() => setSelectedVersion(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {(selectedVersion.applications_count ?? 0) > 0 && (
            <div className="bg-blue-50 p-4 rounded">
              <h4 className="font-semibold text-gray-900 mb-2">Performance</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Applications</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedVersion.applications_count ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Shortlists</p>
                  <p className="text-2xl font-bold text-green-600">
                    {selectedVersion.shortlist_count || 0}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Success Rate</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {(selectedVersion.applications_count ?? 0) > 0
                      ? Math.round(
                          ((selectedVersion.shortlist_count || 0) /
                            (selectedVersion.applications_count ?? 0)) *
                            100
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded">
            <h4 className="font-semibold text-gray-900 mb-3">Preview</h4>
            <p className="text-sm text-gray-600 mb-3">
              This version emphasizes experience and skills relevant to {selectedVersion.target_role}
            </p>
            <button className="text-blue-600 font-semibold text-sm hover:text-blue-700">
              📄 View Full Resume
            </button>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Use This Version
            </button>
            <button className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
              Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
