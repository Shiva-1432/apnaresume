'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/nextjs';
import { API_BASE_URL } from '@/lib/apiBaseUrl';

type ResumeItem = {
  _id: string;
  file_name?: string;
  version_name?: string;
  target_role?: string;
  created_at: string;
  is_version: boolean;
  applications_count?: number;
  shortlist_count?: number;
};

export default function ResumeSelector({ onSelect }: { onSelect: (resumeId: string) => void }) {
  const { getToken } = useAuth();
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [versions, setVersions] = useState<ResumeItem[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchResumes = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setError('Login required to load resumes.');
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/analysis/user-resumes`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const allResumes: ResumeItem[] = response.data.resumes || [];
      const baseResumes = allResumes.filter((r) => !r.is_version);
      const versionedResumes = allResumes.filter((r) => r.is_version);

      setResumes(baseResumes);
      setVersions(versionedResumes);

      if (baseResumes.length > 0) {
        setSelectedId(baseResumes[0]._id);
        onSelect(baseResumes[0]._id);
      }
    } catch (requestError) {
      console.error('Error fetching resumes:', requestError);
      setError('Could not fetch resumes.');
    } finally {
      setLoading(false);
    }
  }, [getToken, onSelect]);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  if (loading) {
    return <div>Loading resumes...</div>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Your Original Resumes
        </label>
        <div className="space-y-2">
          {resumes.map((resume) => (
            <button
              key={resume._id}
              onClick={() => {
                setSelectedId(resume._id);
                onSelect(resume._id);
              }}
              className={`w-full p-3 rounded-lg border-2 text-left transition ${
                selectedId === resume._id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <p className="font-semibold text-gray-900">
                {resume.file_name || 'Resume'}
              </p>
              <p className="text-xs text-gray-500">
                Uploaded {new Date(resume.created_at).toLocaleDateString()}
              </p>
            </button>
          ))}
        </div>
      </div>

      {versions.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Role-Optimized Versions
          </label>
          <div className="space-y-2">
            {versions.map((version) => (
              <button
                key={version._id}
                onClick={() => {
                  setSelectedId(version._id);
                  onSelect(version._id);
                }}
                className={`w-full p-3 rounded-lg border-2 text-left transition ${
                  selectedId === version._id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-gray-900">
                  {(version.target_role || 'Role')} - Optimized
                </p>
                <p className="text-xs text-gray-500">
                  {version.version_name || 'Custom version'}
                </p>
                {!!version.applications_count && (
                  <p className="text-xs text-green-600 mt-1">
                    Used in {version.applications_count} applications
                    {(version.shortlist_count || 0) > 0 && ` • ${version.shortlist_count} shortlists`}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        className="w-full p-3 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 font-semibold hover:bg-blue-50"
      >
        + Create new version for another role
      </button>
    </div>
  );
}
