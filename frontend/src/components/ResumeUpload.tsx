'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/apiBaseUrl';

interface AnalysisResult {
  success: boolean;
  status?: string;
  resume_id?: string;
  resumeId?: string;
  id?: string;
  analysis: {
    ats_score: number;
    score_breakdown: {
      format: number;
      keywords: number;
      experience: number;
      education: number;
    };
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
  credits_remaining: number;
}

interface ResumeUploadProps {
  onAnalysisComplete: (data: AnalysisResult) => void;
}

export default function ResumeUpload({ onAnalysisComplete }: ResumeUploadProps) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [asyncResumeId, setAsyncResumeId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const [pollError, setPollError] = useState('');
  const [pollStartedAt, setPollStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  const MAX_SIZE = 5 * 1024 * 1024;

  const clearPollingTimers = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (elapsedRef.current) {
      clearInterval(elapsedRef.current);
      elapsedRef.current = null;
    }
  }, []);

  const extractResumeId = (payload: unknown): string | null => {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const data = payload as Record<string, unknown>;
    const direct = data.resume_id || data.resumeId || data.id;
    if (typeof direct === 'string' && direct.trim()) {
      return direct;
    }

    if (data.resume && typeof data.resume === 'object') {
      const nested = data.resume as Record<string, unknown>;
      const nestedId = nested._id || nested.id || nested.resume_id;
      if (typeof nestedId === 'string' && nestedId.trim()) {
        return nestedId;
      }
    }

    return null;
  };

  const extractStatus = (payload: unknown): string | null => {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const data = payload as Record<string, unknown>;
    if (typeof data.status === 'string') {
      return data.status.toLowerCase();
    }

    if (data.analysis && typeof data.analysis === 'object') {
      const analysisObj = data.analysis as Record<string, unknown>;
      if (typeof analysisObj.status === 'string') {
        return analysisObj.status.toLowerCase();
      }
    }

    return null;
  };

  const isAnalysisComplete = (payload: unknown): boolean => {
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    const data = payload as Record<string, unknown>;
    if (data.analysis && typeof data.analysis === 'object') {
      return true;
    }

    return false;
  };

  const pollResume = useCallback(async (resumeId: string) => {
    const token = await getToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await axios.get(`${API_BASE_URL}/analysis/resume/${resumeId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const payload = response.data;
    const status = extractStatus(payload);
    const done = status ? status !== 'analyzing' : isAnalysisComplete(payload);

    if (done) {
      clearPollingTimers();
      setIsPolling(false);
      setPollTimedOut(false);
      setPollError('');
      setAsyncResumeId(null);
      router.push(`/analysis/${resumeId}`);
    }
  }, [clearPollingTimers, getToken, router]);

  const startPolling = useCallback((resumeId: string) => {
    clearPollingTimers();
    setAsyncResumeId(resumeId);
    setIsPolling(true);
    setPollTimedOut(false);
    setPollError('');
    setPollStartedAt(Date.now());
    setElapsedMs(0);

    pollResume(resumeId).catch(() => {
      // Ignore transient polling errors; timeout handles terminal state.
    });

    pollIntervalRef.current = setInterval(() => {
      pollResume(resumeId).catch(() => {
        // Ignore transient polling errors; timeout handles terminal state.
      });
    }, 3000);

    elapsedRef.current = setInterval(() => {
      setElapsedMs((prev) => prev + 1000);
    }, 1000);

    timeoutRef.current = setTimeout(() => {
      clearPollingTimers();
      setIsPolling(false);
      setPollTimedOut(true);
      setPollError('Analysis is taking longer than expected. Please try polling again.');
    }, 60000);
  }, [clearPollingTimers, pollResume]);

  useEffect(() => {
    return () => {
      clearPollingTimers();
    };
  }, [clearPollingTimers]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setValidationMessage('Please select a resume first.');
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setValidationMessage('Only PDF and DOCX allowed');
      return;
    }

    if (file.size > MAX_SIZE) {
      setValidationMessage('File must be under 5MB');
      return;
    }

    setLoading(true);
    setError('');
    setValidationMessage('');

    const formData = new FormData();
    formData.append('resume', file);
    if (user?.primaryEmailAddress?.emailAddress) {
      formData.append('email', user.primaryEmailAddress.emailAddress);
    }

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      const response = await axios.post(
        `${API_BASE_URL}/analysis/upload-and-analyze`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      const analysis: AnalysisResult = response.data;
      const responseStatus = typeof analysis.status === 'string'
        ? analysis.status.toLowerCase()
        : null;

      if (responseStatus === 'analyzing') {
        const resumeId = extractResumeId(analysis);
        if (!resumeId) {
          setError('Analysis started, but no resume ID was returned for tracking.');
          return;
        }

        startPolling(resumeId);
        return;
      }

      onAnalysisComplete(analysis);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'Upload failed'
        : 'Upload failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const steps = ['Parsing', 'Scoring', 'Keyword Match', 'Complete'];
  const progressRatio = Math.min(1, elapsedMs / 60000);
  const activeStepIndex = Math.min(steps.length - 1, Math.floor(progressRatio * steps.length));
  const isAsyncPanelVisible = !!asyncResumeId;

  return (
    <form onSubmit={handleUpload} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800">
          {error}
        </div>
      )}

      {validationMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800">
          {validationMessage}
        </div>
      )}

      {isAsyncPanelVisible && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-4">
          <p className="text-sm font-semibold text-blue-900">Analyzing your resume...</p>

          <div className="space-y-3">
            {steps.map((step, index) => {
              const completed = index < activeStepIndex;
              const active = index === activeStepIndex && isPolling;
              const pending = index > activeStepIndex;

              return (
                <div key={step} className="flex items-center gap-3">
                  <div
                    className={[
                      'h-3 w-3 rounded-full',
                      completed ? 'bg-green-500' : '',
                      active ? 'bg-blue-500 animate-pulse' : '',
                      pending ? 'bg-gray-300' : ''
                    ].join(' ')}
                  />
                  <span className={[
                    'text-sm',
                    completed ? 'text-green-700 font-medium' : '',
                    active ? 'text-blue-700 font-semibold' : '',
                    pending ? 'text-gray-600' : ''
                  ].join(' ')}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          {pollTimedOut && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 space-y-2">
              <p className="text-sm text-amber-900">{pollError}</p>
              <button
                type="button"
                onClick={() => {
                  if (asyncResumeId) {
                    startPolling(asyncResumeId);
                  }
                }}
                className="inline-flex items-center rounded bg-amber-600 px-3 py-1.5 text-sm text-white hover:bg-amber-700"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      )}

      <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center">
        <label htmlFor="file-input" className="cursor-pointer">
          <p className="text-gray-600">Click to select a PDF resume</p>
          {file && <p className="text-green-600 font-semibold mt-2">{file.name}</p>}
        </label>
        <input
          id="file-input"
          type="file"
          accept=".pdf"
          onChange={(e) => {
            setValidationMessage('');
            setFile(e.target.files?.[0] || null);
          }}
          className="hidden"
        />
      </div>

      <p className="text-xs text-gray-500">Accepted format: PDF, max size 5MB.</p>

      <button
        type="submit"
        disabled={!file || loading || isPolling}
        className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading || isPolling ? 'Analyzing...' : 'Analyze Resume'}
      </button>
    </form>
  );
}
