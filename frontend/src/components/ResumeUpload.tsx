'use client';

import { useState } from 'react';
import axios from 'axios';

interface AnalysisResult {
  success: boolean;
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
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationMessage, setValidationMessage] = useState('');

  const MAX_SIZE_BYTES = 5 * 1024 * 1024;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setValidationMessage('Please select a PDF resume first.');
      return;
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setValidationMessage('Only PDF files are supported.');
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setValidationMessage('File is too large. Maximum size is 5MB.');
      return;
    }

    setLoading(true);
    setError('');
    setValidationMessage('');

    const formData = new FormData();
    formData.append('resume', file);
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser) as { email?: string };
        if (user.email) {
          formData.append('email', user.email);
        }
      } catch {
        // Ignore malformed user data.
      }
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/analysis/upload-and-analyze`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      const analysis: AnalysisResult = response.data;
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
        disabled={!file || loading}
        className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Analyzing...' : 'Analyze Resume'}
      </button>
    </form>
  );
}
