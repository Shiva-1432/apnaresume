'use client';

import Link from 'next/link';
import { useState } from 'react';
import axios from 'axios';
import StatusMessage from '@/components/ui/StatusMessage';

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
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Login required to load AI suggestions.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/fresher-resume/fresher-resume-builder`,
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
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-0">
      <div className="mb-4 text-sm text-neutral-600 flex items-center gap-2">
        <Link href="/" className="hover:text-primary-600">Home</Link>
        <span>/</span>
        <Link href="/dashboard" className="hover:text-primary-600">Dashboard</Link>
        <span>/</span>
        <span className="text-neutral-900 font-medium">Fresher Mode</span>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-neutral-900">Fresher Resume Builder</h1>
        <p className="text-neutral-600">
          Your first resume matters. Let&apos;s build it RIGHT.
        </p>
      </div>

      {!mode ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleSelectMode('engineering')}
            className="p-6 bg-primary-50 border-2 border-primary-200 rounded hover:border-primary-500 text-left"
          >
            <h3 className="font-bold text-lg mb-2">Software Engineering</h3>
            <p className="text-sm text-neutral-600">
              Tech roles: Backend, Frontend, Full-stack, DevOps
            </p>
          </button>

          <button
            onClick={() => handleSelectMode('data')}
            className="p-6 bg-accent-50 border-2 border-accent-200 rounded hover:border-accent-500 text-left"
          >
            <h3 className="font-bold text-lg mb-2">Data Science</h3>
            <p className="text-sm text-neutral-600">
              Data scientist, ML engineer, Analytics
            </p>
          </button>

          <button
            onClick={() => handleSelectMode('mechanical')}
            className="p-6 bg-neutral-50 border-2 border-neutral-200 rounded hover:border-neutral-300 text-left"
          >
            <h3 className="font-bold text-lg mb-2">Mechanical Engineering</h3>
            <p className="text-sm text-neutral-600">
              CAD, Design, Manufacturing, Thermal
            </p>
          </button>

          <button
            onClick={() => handleSelectMode('other')}
            className="p-6 bg-success-50 border-2 border-success-200 rounded hover:border-success-500 text-left"
          >
            <h3 className="font-bold text-lg mb-2">Other</h3>
            <p className="text-sm text-neutral-600">
              Management, Finance, Design, Marketing
            </p>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {error && (
            <StatusMessage variant="error" message={error} />
          )}

          <div className="bg-success-50 border border-success-200 p-4 rounded">
            <h3 className="font-bold text-success-700 mb-2">What Makes a Strong Fresher Resume</h3>
            <ul className="space-y-2">
              <li className="text-sm text-success-700">
                Projects: Show what you can build (2-3 good projects &gt; 10 bad ones)
              </li>
              <li className="text-sm text-success-700">
                Metrics: &quot;Built app with 1000+ downloads&quot; beats &quot;Built an app&quot;
              </li>
              <li className="text-sm text-success-700">
                Competitions: Hackathons, CodeChef rank, Kaggle score
              </li>
              <li className="text-sm text-success-700">
                Certifications: AWS, Google Cloud, NPTEL (free courses count!)
              </li>
            </ul>
          </div>

          {loading && (
            <StatusMessage variant="info" message="Loading template suggestions..." />
          )}

          {template?.sections && template.sections.length > 0 && (
            <div className="bg-accent-50 border border-accent-200 p-4 rounded">
              <h3 className="font-bold text-accent-700 mb-3">Recommended Sections for This Track</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {template.sections.map((section, idx) => (
                  <div key={idx} className="bg-white p-2 rounded text-sm border border-accent-200">
                    {section}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-primary-50 border border-primary-200 p-4 rounded">
            <h3 className="font-bold text-primary-700 mb-3">Step-by-Step Builder</h3>
            <div className="space-y-3">
              <button className="w-full p-3 bg-white border border-primary-200 rounded hover:bg-primary-100 text-left">
                Step 1: Add Your Education (GPA, Relevant Coursework)
              </button>
              <button className="w-full p-3 bg-white border border-primary-200 rounded hover:bg-primary-100 text-left">
                Step 2: Add Your Top 3 Projects
              </button>
              <button className="w-full p-3 bg-white border border-primary-200 rounded hover:bg-primary-100 text-left">
                Step 3: Add Competitions and Certifications
              </button>
              <button className="w-full p-3 bg-white border border-primary-200 rounded hover:bg-primary-100 text-left">
                Step 4: Add Technical Skills
              </button>
              <button className="w-full p-3 bg-white border border-primary-200 rounded hover:bg-primary-100 text-left">
                Step 5: Review and Optimize for ATS
              </button>
            </div>
          </div>

          {guidance?.sections && guidance.sections.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-200 p-4 rounded">
              <h3 className="font-bold text-indigo-900 mb-3">AI Suggestions by Section</h3>
              <div className="space-y-3">
                {guidance.sections.map((section, idx) => (
                  <div key={idx} className="bg-white border border-indigo-200 p-3 rounded">
                    <h4 className="font-semibold text-indigo-900">{section.name}</h4>
                    <p className="text-sm text-gray-700 mt-1">{section.description}</p>
                    {section.tips?.length > 0 && (
                      <ul className="text-sm text-indigo-800 mt-2 space-y-1">
                        {section.tips.map((tip, tipIdx) => (
                          <li key={tipIdx}>- {tip}</li>
                        ))}
                      </ul>
                    )}
                    {section.examples?.length > 0 && (
                      <div className="mt-2 text-xs text-gray-600">
                        Example: {section.examples[0]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-danger-50 border border-danger-200 p-4 rounded">
            <h3 className="font-bold text-danger-700 mb-2">Common Fresher Mistakes (Do Not Do These)</h3>
            <ul className="space-y-1">
              <li className="text-sm text-danger-700">&quot;Seeking an opportunity to work in a reputed company&quot;</li>
              <li className="text-sm text-danger-700">Listing skills without proof (no projects/competitions)</li>
              <li className="text-sm text-danger-700">Making resume longer than 1 page (freshers should be 1 page)</li>
              <li className="text-sm text-danger-700">Vague project descriptions (&quot;Built a website&quot;)</li>
              <li className="text-sm text-danger-700">Listing coursework instead of projects</li>
              {(guidance?.dos_and_donts?.dont || []).map((item, idx) => (
                <li key={idx} className="text-sm text-danger-700">{item}</li>
              ))}
            </ul>
          </div>

          {guidance?.dos_and_donts?.do && guidance.dos_and_donts.do.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded">
              <h3 className="font-bold text-emerald-900 mb-2">Extra Do Items</h3>
              <ul className="space-y-1">
                {guidance.dos_and_donts.do.map((item, idx) => (
                  <li key={idx} className="text-sm text-emerald-800">{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <button
              onClick={() => {
                setMode('');
                setTemplate(null);
                setGuidance(null);
                setError('');
              }}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Back to role selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
