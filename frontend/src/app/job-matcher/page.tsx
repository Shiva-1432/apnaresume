'use client';

import { useState } from 'react';
import axios from 'axios';
import StatusMessage from '@/components/ui/StatusMessage';

type MatchAnalysis = {
  match_percentage: number;
  match_score: string;
  match_explanation?: string;
  strengths_for_role?: string[];
  weaknesses_for_role?: string[];
  missing_skills?: string[];
  improvements?: string[];
};

type JobAnalysis = {
  title?: string;
  company?: string;
};

type OptimizedExperienceItem = {
  original: string;
  optimized: string;
  why: string;
};

type Optimizations = {
  optimized_experience?: OptimizedExperienceItem[];
};

type JobMatcherResult = {
  job_match_id: string;
  match_analysis: MatchAnalysis;
  job_analysis: JobAnalysis;
  optimizations?: Optimizations;
};

export default function JobMatcher() {
  const [step, setStep] = useState<'input' | 'loading' | 'results'>('input');
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [resumeId, setResumeId] = useState('');
  const [results, setResults] = useState<JobMatcherResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleAnalyze = async () => {
    setError('');
    setInfo('');

    if (!jobDescription.trim()) {
      setError('Please paste a job description.');
      return;
    }

    if (!resumeId.trim()) {
      setError('Please enter a resume ID.');
      return;
    }

    setStep('loading');
    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/job-matching/match-resume-to-job`,
        {
          job_description: jobDescription,
          job_title: jobTitle || 'Unknown',
          company: company || 'Unknown',
          resume_id: resumeId.trim()
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const analysis: JobMatcherResult = response.data;
      setResults(analysis);
      setStep('results');
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error || 'Analysis failed'
        : 'Analysis failed';
      setError(message);
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!results?.job_match_id) {
      setError('No optimized resume is available to download yet.');
      return;
    }

    setError('');
    setInfo('');

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/job-matching/download-optimized/${results.job_match_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const blob = new Blob([response.data.optimized_resume], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${response.data.job_title || 'optimized'}-resume.txt`;
      a.click();
      URL.revokeObjectURL(url);
      setInfo('Optimized resume downloaded successfully.');
    } catch {
      setError('Download failed. Please try again.');
    }
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-neutral-50 to-primary-50">
        <div className="text-center space-y-6 motion-fade-up">
          <div className="inline-block animate-spin">
            <svg className="w-16 h-16 text-primary-600" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.1" />
              <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-neutral-900">ApnaResume Matcher</h2>
            <div className="mt-4 space-y-2 text-sm text-neutral-600">
              <p>Analyzing job requirements...</p>
              <p>Matching your resume...</p>
              <p>Generating optimizations...</p>
            </div>
          </div>

          <p className="text-xs text-neutral-500">This usually takes 30-45 seconds</p>
        </div>
      </div>
    );
  }

  if (step === 'results') {
    const match = results?.match_analysis;
    const optimizations = results?.optimizations;

    if (!results || !match) {
      return null;
    }

    return (
      <div className="min-h-screen bg-linear-to-br from-neutral-50 to-primary-50 py-8">
        <div className="max-w-5xl mx-auto space-y-6 px-4">
          {error && (
            <StatusMessage variant="error" message={error} />
          )}
          {info && (
            <StatusMessage variant="success" message={info} />
          )}

          <div className="text-center mb-8 motion-fade-up">
            <h1 className="text-4xl font-bold text-neutral-900 mb-2">ApnaResume Matcher Results</h1>
            <p className="text-neutral-600">
              for {results.job_analysis?.title} @ {results.job_analysis?.company}
            </p>
          </div>

          <div
            className={`bg-linear-to-r p-8 rounded-xl text-white text-center shadow-lg transform transition hover:scale-105 ${
              match.match_percentage >= 80
                ? 'from-success-600 to-success-700'
                : match.match_percentage >= 60
                  ? 'from-primary-600 to-primary-700'
                  : match.match_percentage >= 40
                    ? 'from-accent-600 to-accent-700'
                    : 'from-danger-600 to-danger-700'
            } motion-soft-pop`}
          >
            <div className="text-6xl font-bold mb-2">{match.match_percentage}%</div>
            <div className="text-xl font-semibold">{match.match_score} Match</div>
            <p className="mt-4 text-sm opacity-90">{match.match_explanation}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-success-700 mb-4">Your Strengths</h3>
              <div className="space-y-3">
                {match.strengths_for_role?.map((strength: string, i: number) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-success-600 font-bold">✓</span>
                    <p className="text-sm text-neutral-700">{strength}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-danger-700 mb-4">Areas to Improve</h3>
              <div className="space-y-3">
                {match.weaknesses_for_role?.map((weakness: string, i: number) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-danger-600 font-bold">!</span>
                    <p className="text-sm text-neutral-700">{weakness}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {match.missing_skills && match.missing_skills.length > 0 && (
            <div className="bg-accent-50 border-2 border-accent-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-accent-700 mb-4">Missing Skills</h3>
              <p className="text-sm text-accent-700 mb-4">
                These skills are mentioned in the job but not in your resume:
              </p>
              <div className="space-y-2">
                {match.missing_skills.map((skill: string, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-white p-3 rounded">
                    <span className="font-semibold text-neutral-800">{skill}</span>
                    <button className="text-sm text-primary-600 hover:text-primary-700">Learn</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-primary-50 border-2 border-primary-200 rounded-lg p-6">
            <h3 className="text-xl font-bold text-primary-700 mb-4">Action Plan</h3>
            <ol className="space-y-3">
              {match.improvements?.map((improvement: string, i: number) => (
                <li key={i} className="flex gap-3">
                  <span className="font-bold text-primary-600 shrink-0">{i + 1}.</span>
                  <p className="text-sm text-neutral-800">{improvement}</p>
                </li>
              ))}
            </ol>
          </div>

          {(optimizations?.optimized_experience?.length ?? 0) > 0 && (
            <div className="bg-success-50 border-2 border-success-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-success-700 mb-4">Optimized Bullet Points</h3>
              <p className="text-sm text-success-700 mb-4">
                Here are your experience bullets rewritten for this role:
              </p>
              <div className="space-y-3">
                {(optimizations?.optimized_experience || []).map((item: OptimizedExperienceItem, i: number) => (
                  <div key={i} className="bg-white p-4 rounded border-l-4 border-success-500">
                    <p className="text-xs text-neutral-500 mb-2">Original:</p>
                    <p className="text-sm text-neutral-700 mb-3 line-through opacity-50">{item.original}</p>
                    <p className="text-xs text-neutral-500 mb-2">Optimized for {results.job_analysis?.title}:</p>
                    <p className="text-sm font-semibold text-neutral-900 mb-2">{item.optimized}</p>
                    <p className="text-xs text-success-700">Why: {item.why}</p>
                    <button className="mt-3 text-sm text-success-600 hover:text-success-700 font-semibold">Copy to Clipboard</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={() => {
                setStep('input');
                setResults(null);
              }}
              className="px-6 py-3 bg-white border-2 border-primary-600 text-primary-600 rounded-lg font-semibold hover:bg-primary-50"
            >
              Match Another Job
            </button>
            <button
              onClick={handleDownload}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700"
            >
              Download Optimized Resume
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-neutral-50 to-primary-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 motion-fade-up">
          {error && (
            <StatusMessage variant="error" message={error} className="mb-6" />
          )}
          {info && (
            <StatusMessage variant="success" message={info} className="mb-6" />
          )}

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-neutral-900 mb-2">ApnaResume Matcher</h1>
            <p className="text-neutral-600 text-lg">Paste a job description to get role-specific resume insights instantly.</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">Resume ID *</label>
              <input
                type="text"
                value={resumeId}
                onChange={(e) => setResumeId(e.target.value)}
                placeholder="Paste your resume ID"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">Job Title (Optional)</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., Senior Backend Engineer"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">Company (Optional)</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g., Google, Amazon, Flipkart"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">Job Description *</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the complete job description here..."
                rows={12}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-primary-500 font-mono text-sm"
              />
              <p className="text-xs text-neutral-500 mt-2">Copy from LinkedIn, job portal, or company website</p>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !jobDescription.trim() || !resumeId.trim()}
              className="w-full py-3 bg-linear-to-r from-primary-600 to-primary-700 text-white font-bold rounded-lg hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Analyzing...' : 'Analyze Job Fit'}
            </button>

            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 text-sm text-neutral-700">
              <p className="font-semibold mb-2">How it works:</p>
              <p>1. Paste any job description from LinkedIn, job portal, or company website</p>
              <p>2. ApnaResume analyzes the job requirements (takes 30-45 seconds)</p>
              <p>3. Get a match percentage and optimized resume for that specific job</p>
              <p>4. Copy optimized bullets or download your tailored resume</p>
              <p className="text-xs text-neutral-500 mt-3">Costs 3 credits per analysis</p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-lg p-8 motion-fade-up">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Example Job Description Sources</h2>
          <p className="text-sm text-neutral-600 mb-4">Want to see how it works? Try pasting a job description from:</p>
          <div className="grid md:grid-cols-2 gap-4">
            <a href="#" className="p-4 bg-primary-50 rounded-lg hover:bg-primary-100 text-sm font-semibold text-primary-600 hover-lift-soft">
              LinkedIn Jobs
            </a>
            <a href="#" className="p-4 bg-accent-50 rounded-lg hover:bg-accent-100 text-sm font-semibold text-accent-600 hover-lift-soft">
              Naukri.com
            </a>
            <a href="#" className="p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 text-sm font-semibold text-neutral-700 hover-lift-soft">
              Indeed
            </a>
            <a href="#" className="p-4 bg-success-50 rounded-lg hover:bg-success-100 text-sm font-semibold text-success-600 hover-lift-soft">
              Company Websites
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
