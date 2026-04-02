'use client';

import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/nextjs';
import StatusMessage from '@/components/ui/StatusMessage';
import { API_BASE_URL } from '@/lib/apiBaseUrl';

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
  const { getToken } = useAuth();
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
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      const response = await axios.post(
        `${API_BASE_URL}/job-matching/match-resume-to-job`,
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
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      const response = await axios.get(
        `${API_BASE_URL}/job-matching/download-optimized/${results.job_match_id}`,
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-mesh">
        <div className="text-center space-y-8 motion-fade-up">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto" />
            <div className="absolute inset-0 flex items-center justify-center font-black text-indigo-600">AI</div>
          </div>
          <div>
            <h2 className="text-3xl font-black text-neutral-900 tracking-tight">Matching Precisely...</h2>
            <div className="mt-4 flex flex-col items-center gap-2 text-neutral-500 font-medium">
              <span className="animate-pulse">Analyzing job requirements...</span>
              <span className="animate-pulse delay-75">Analyzing your skills...</span>
              <span className="animate-pulse delay-150">Generating optimization roadmap...</span>
            </div>
          </div>
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Est. time: 30-45 seconds</p>
        </div>
      </div>
    );
  }

  if (step === 'results') {
    const match = results?.match_analysis;
    const optimizations = results?.optimizations;
    if (!results || !match) return null;

    return (
      <div className="min-h-screen bg-mesh py-12 pb-32">
        <div className="max-w-5xl mx-auto space-y-12 px-6">
          <div className="text-center motion-fade-up">
            <h1 className="text-4xl sm:text-5xl font-black text-neutral-900 mb-3 tracking-tight">Match Analysis</h1>
            <p className="text-neutral-500 font-bold">
              {results.job_analysis?.title} <span className="text-neutral-400 mx-2">@</span> {results.job_analysis?.company}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            {/* Score Ring */}
            <div className="lg:col-span-1 flex flex-col items-center motion-soft-pop">
              <div className={`relative w-48 h-48 rounded-full flex items-center justify-center border-8 shadow-2xl ${
                match.match_percentage >= 80 ? 'border-emerald-500 shadow-emerald-100' :
                match.match_percentage >= 60 ? 'border-indigo-500 shadow-indigo-100' :
                'border-fuchsia-500 shadow-fuchsia-100'
              }`}>
                <div className="text-center">
                  <div className="text-5xl font-black text-neutral-900">{match.match_percentage}%</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Match</div>
                </div>
              </div>
              <div className="mt-8 px-6 py-2 bg-white rounded-full border border-neutral-100 shadow-sm font-black text-neutral-700 uppercase tracking-widest text-xs">
                {match.match_score} Rating
              </div>
            </div>

            {/* Explanation Card */}
            <div className="lg:col-span-2 bg-glass p-8 rounded-[2rem] border border-white/40 shadow-xl motion-fade-up stagger-1">
              <h3 className="text-lg font-black text-neutral-900 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                AI Insights
              </h3>
              <p className="text-neutral-600 leading-relaxed font-medium">{match.match_explanation}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-glass p-8 rounded-[2rem] border border-white/40 shadow-lg motion-fade-up stagger-2">
              <h3 className="text-lg font-black text-emerald-600 mb-6 flex items-center gap-2 uppercase tracking-wide">
                <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[10px]">✓</span>
                Key Strengths
              </h3>
              <div className="space-y-4">
                {match.strengths_for_role?.map((strength, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-white/60 rounded-2xl border border-white/50">
                    <p className="text-sm text-neutral-700 font-bold leading-relaxed">{strength}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-glass p-8 rounded-[2rem] border border-white/40 shadow-lg motion-fade-up stagger-3">
              <h3 className="text-lg font-black text-fuchsia-600 mb-6 flex items-center gap-2 uppercase tracking-wide">
                <span className="w-5 h-5 rounded-full bg-fuchsia-100 flex items-center justify-center text-[10px]">!</span>
                Growth Areas
              </h3>
              <div className="space-y-4">
                {match.weaknesses_for_role?.map((weakness, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-white/60 rounded-2xl border border-white/50">
                    <p className="text-sm text-neutral-700 font-bold leading-relaxed">{weakness}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {match.missing_skills && match.missing_skills.length > 0 && (
            <div className="bg-glass p-8 rounded-[25rem] border border-white/40 shadow-xl motion-fade-up">
               <h3 className="text-lg font-black text-indigo-600 mb-6 flex items-center gap-2 px-8 uppercase tracking-wide">
                Missing Keywords
              </h3>
              <div className="flex flex-wrap gap-3 px-8 pb-4 leading-none">
                {match.missing_skills.map((skill, i) => (
                  <div key={i} className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black uppercase tracking-wider border border-indigo-100">
                    {skill}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Roadmap */}
          <div className="bg-neutral-900 rounded-[3rem] p-10 sm:p-16 text-white relative overflow-hidden motion-fade-up">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 blur-3xl" />
            <h3 className="text-2xl font-black mb-8 relative z-10">Optimization Roadmap</h3>
            <div className="space-y-6 relative z-10">
              {match.improvements?.map((improvement, i) => (
                <div key={i} className="flex gap-6 group">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center font-black group-hover:bg-indigo-600 transition-colors shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-lg text-neutral-300 font-medium leading-relaxed">{improvement}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-10">
            <button
              onClick={() => { setStep('input'); setResults(null); }}
              className="px-8 py-4 bg-white border-2 border-indigo-600 text-indigo-600 rounded-2xl font-black hover:bg-indigo-50 transition-all active:scale-95"
            >
              Analyze New Job
            </button>
            <button
              onClick={handleDownload}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
            >
              Download Tailored Resume
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-glass rounded-[2.5rem] p-8 sm:p-12 shadow-2xl border border-white/40 motion-fade-up">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black text-neutral-900 mb-4 tracking-tight">Job Matcher</h1>
            <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Essential Analysis for your Next Career Move</p>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-4">Job Title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Backend Engineer"
                  className="w-full px-8 py-5 bg-white rounded-[1.5rem] border border-neutral-100 focus:outline-none focus:border-indigo-500 shadow-sm font-bold text-neutral-800 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-neutral-300"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-4">Company</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Google"
                  className="w-full px-8 py-5 bg-white rounded-[1.5rem] border border-neutral-100 focus:outline-none focus:border-indigo-500 shadow-sm font-bold text-neutral-800 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-neutral-300"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-4">Resume ID *</label>
              <input
                type="text"
                value={resumeId}
                onChange={(e) => setResumeId(e.target.value)}
                placeholder="Paste your unique resume reference"
                className="w-full px-8 py-5 bg-white rounded-[1.5rem] border border-neutral-100 focus:outline-none focus:border-indigo-500 shadow-sm font-bold font-mono text-sm focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-neutral-300"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-4">Job Description *</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                rows={8}
                className="w-full px-8 py-5 bg-white rounded-[1.5rem] border border-neutral-100 focus:outline-none focus:border-indigo-500 shadow-sm font-bold text-neutral-800 focus:ring-4 focus:ring-indigo-500/10 transition-all min-h-[200px] placeholder:text-neutral-300"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !jobDescription.trim() || !resumeId.trim()}
              className="w-full py-5 bg-indigo-600 text-white font-black text-xl rounded-2xl hover:bg-indigo-700 shadow-2xl shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {loading ? 'Analyzing...' : 'Analyze Role Fit'}
            </button>
            <p className="text-center text-[10px] font-black text-neutral-400 uppercase tracking-widest">Costs 3 Credits</p>
          </div>
        </div>
      </div>
    </div>
  );
}
