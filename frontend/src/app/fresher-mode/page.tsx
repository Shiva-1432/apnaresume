'use client';

import Link from 'next/link';
import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/nextjs';
import StatusMessage from '@/components/ui/StatusMessage';
import { API_BASE_URL } from '@/lib/apiBaseUrl';

type ModeKey = 'engineering' | 'data' | 'mechanical' | 'other' | '';

type GuidanceSection = {
  name: string;
  description: string;
  tips: string[];
  examples: string[];
};

type FresherGuidance = {
  sections: GuidanceSection[];
  dos_and_donts?: {
    do?: string[];
    dont?: string[];
  };
};

type FresherTemplate = {
  sections: string[];
};

export default function FresherMode() {
  const { getToken } = useAuth();
  const [mode, setMode] = useState<ModeKey>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [template, setTemplate] = useState<FresherTemplate | null>(null);
  const [guidance, setGuidance] = useState<FresherGuidance | null>(null);

  const roleMap: Record<Exclude<ModeKey, ''>, string> = {
    engineering: 'software_engineering',
    data: 'data_science',
    mechanical: 'mechanical_engineering',
    other: 'software_engineering'
  };

  const loadFresherGuidance = async (selectedMode: Exclude<ModeKey, ''>) => {
    const token = await getToken();
    if (!token) {
      setError('Login required to load AI suggestions.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(
        `${API_BASE_URL}/fresher-resume/fresher-resume-builder`,
        { role: roleMap[selectedMode] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTemplate(response.data.template || null);
      setGuidance(response.data.guidance || null);
    } catch (requestError) {
      console.error('Fresher guidance error:', requestError);
      setError('Could not load fresher guidance right now.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMode = async (selectedMode: Exclude<ModeKey, ''>) => {
    setMode(selectedMode);
    await loadFresherGuidance(selectedMode);
  };

  return (
    <div className="min-h-screen bg-mesh pb-20">
      <div className="max-w-5xl mx-auto py-12 px-6">
        <div className="mb-8 text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-3">
          <Link href="/" className="hover:text-indigo-600 transition-colors">Home</Link>
          <span className="w-1 h-1 rounded-full bg-neutral-300" />
          <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
          <span className="w-1 h-1 rounded-full bg-neutral-300" />
          <span className="text-neutral-900">Fresher Mode</span>
        </div>

        <div className="mb-12 motion-fade-up">
          <h1 className="text-4xl sm:text-5xl font-black text-neutral-900 mb-4 tracking-tight">Fresher Resume Builder</h1>
          <p className="text-neutral-500 font-bold text-lg max-w-2xl leading-relaxed">
            Your first resume is your most important career asset. Build it with AI guidance for maximum impact.
          </p>
        </div>

        {!mode ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { key: 'engineering', title: 'Software Engineering', desc: 'Dev, Frontend, Backend, Full-stack', color: 'indigo', icon: '💻' },
              { key: 'data', title: 'Data Science', desc: 'Analyst, ML Engineer, Data Scientist', color: 'violet', icon: '📊' },
              { key: 'mechanical', title: 'Mechanical Eng.', desc: 'CAD, Manufacturing, Thermal Systems', color: 'slate', icon: '⚙️' },
              { key: 'other', title: 'Custom Role', desc: 'Finance, Marketing, Design, HR', color: 'emerald', icon: '⚡' }
            ].map((role, i) => (
              <button
                key={role.key}
                onClick={() => handleSelectMode(role.key as Exclude<ModeKey, ''>)}
                className={`group relative p-10 bg-glass rounded-[2.5rem] border border-white/40 shadow-xl text-left hover-lift motion-soft-pop stagger-${i+1} overflow-hidden min-h-[280px] flex flex-col`}
              >
                <div className={`absolute top-0 right-0 w-48 h-48 bg-${role.color}-600/5 blur-[100px] group-hover:bg-${role.color}-600/10 transition-colors`} />
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-neutral-100 flex items-center justify-center text-3xl mb-8 group-hover:rotate-6 transition-transform">
                  {role.icon}
                </div>
                <h3 className="font-black text-2xl text-neutral-900 mb-3 tracking-tight">{role.title}</h3>
                <p className="text-sm text-neutral-500 font-bold leading-relaxed mb-8 flex-grow">{role.desc}</p>
                <div className="flex items-center gap-3 text-xs font-black text-indigo-600 uppercase tracking-[0.2em] group-hover:gap-5 transition-all">
                  Build Now <span className="text-lg leading-none">→</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            <button
              onClick={() => { setMode(''); setTemplate(null); setGuidance(null); setError(''); }}
              className="px-6 py-2 bg-white rounded-full border border-neutral-100 text-xs font-black text-neutral-400 uppercase tracking-widest hover:text-indigo-600 transition-colors shadow-sm"
            >
              ← Change Track
            </button>

            {error && <StatusMessage variant="error" message={error} />}

            <div className="bg-emerald-950 rounded-[3rem] p-12 text-white relative overflow-hidden motion-fade-up border border-emerald-800 shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/10 blur-[120px]" />
              <div className="flex items-center gap-3 mb-10 relative z-10">
                <span className="w-2 h-8 bg-emerald-500 rounded-full" />
                <h3 className="text-2xl font-black tracking-tight">Strategy for Freshers</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                {[
                  "Highlight 2-3 deep technical projects over 10 minor assignments.",
                  "Quantify impact: \"Reduced latency by 20%\" beats \"Optimized code\".",
                  "Include hackathons, Kaggle rankings, or open-source contributions.",
                  "Professional certifications (AWS, GCP) add massive credibility."
                ].map((tip, idx) => (
                  <div key={idx} className="flex gap-6 p-6 bg-white/5 rounded-3xl border border-white/5 shadow-inner hover:bg-white/10 transition-colors">
                     <span className="text-emerald-400 font-black text-xl leading-none pt-1 opacity-50">{(idx + 1).toString().padStart(2, '0')}</span>
                     <p className="text-sm font-bold text-neutral-200 leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {loading && <StatusMessage variant="info" message="AI is drafting your career strategy..." />}

            {template?.sections && (
              <div className="bg-glass p-8 rounded-[2rem] border border-white/40 shadow-xl motion-fade-up">
                <h3 className="text-lg font-black text-neutral-900 mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-violet-600 rounded-full" />
                  Recommended Blueprint
                </h3>
                <div className="flex flex-wrap gap-3">
                  {template.sections.map((section, idx) => (
                    <div key={idx} className="px-4 py-2 bg-violet-50 text-violet-700 rounded-xl text-xs font-black uppercase tracking-wider border border-violet-100">
                      {section}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {guidance?.sections && (
               <div className="motion-fade-up">
                <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
                  <span className="w-2 h-8 bg-indigo-600 rounded-full" />
                  AI Deep-Dive Guidance
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {guidance.sections.map((section, idx) => (
                    <div key={idx} className="bg-glass p-8 rounded-[2rem] border border-white/40 shadow-lg hover-lift">
                      <h4 className="font-black text-neutral-900 mb-2 uppercase tracking-tight text-lg">{section.name}</h4>
                      <p className="text-sm text-neutral-500 font-medium mb-4 leading-relaxed">{section.description}</p>
                      
                      <div className="space-y-4 pt-4 border-t border-neutral-100">
                        <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Pro Tips</div>
                        {section.tips?.map((tip, tipIdx) => (
                          <div key={tipIdx} className="flex gap-3 text-xs font-bold text-neutral-700 leading-relaxed">
                            <span className="text-indigo-600">•</span> {tip}
                          </div>
                        ))}
                      </div>

                      {section.examples?.length > 0 && (
                        <div className="mt-6 p-4 bg-white/50 rounded-2xl border border-white/50 border-dashed">
                          <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">AI Draft Example</div>
                          <p className="text-xs text-neutral-600 font-mono leading-relaxed">{section.examples[0]}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-fuchsia-100 border border-fuchsia-200 p-8 rounded-[2rem] motion-fade-up">
              <h3 className="text-lg font-black text-fuchsia-900 mb-6 flex items-center gap-2 uppercase tracking-wide">
                Strict Rulebook (Mistakes to Avoid)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-x-12">
                {[
                  "Objective statements like 'Seeking an opportunity...'",
                  "listing skills without project proof",
                  "Resumes longer than 1 page for freshers",
                  "Vague impact descriptions ('Worked on java')",
                ].concat(guidance?.dos_and_donts?.dont || []).map((item, idx) => (
                  <div key={idx} className="flex gap-3 text-sm font-bold text-fuchsia-800 leading-relaxed group text-left">
                    <span className="text-fuchsia-500 group-hover:scale-125 transition-transform shrink-0 whitespace-nowrap leading-none">×</span> 
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
