'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const STEPS = [
  {
    id: 1,
    emoji: '👋',
    title: 'Welcome to ApnaResume!',
    description: "You're one step closer to landing your dream job. Let us show you around in 3 quick steps.",
    cta: "Let's Go",
    skip: false,
  },
  {
    id: 2,
    emoji: '📄',
    title: 'Upload Your Resume',
    description: 'Drop your resume on the dashboard and our AI will instantly give you an ATS score and improvement tips.',
    cta: 'Got It',
    skip: true,
  },
  {
    id: 3,
    emoji: '🎯',
    title: 'Match With Jobs',
    description: 'Paste any job description into the Job Matcher and see how well your resume fits — then optimize it in seconds.',
    cta: 'Go to Dashboard',
    skip: false,
  },
];

const STORAGE_KEY = 'apnaresume_onboarding_done';

export default function OnboardingModal() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      // Small delay so the dashboard loads first
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setAnimating(true);
      setTimeout(() => {
        setStep(s => s + 1);
        setAnimating(false);
      }, 200);
    } else {
      dismiss();
      router.push('/dashboard');
    }
  };

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm">
      <div
        className={`relative w-full max-w-md bg-glass rounded-[3rem] p-10 border border-white/40 shadow-2xl backdrop-blur-3xl transition-all duration-200 ${animating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
      >
        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-indigo-600' : 'w-2 bg-neutral-200'}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center space-y-4 mb-10">
          <div className="text-6xl mb-4">{current.emoji}</div>
          <h2 className="text-3xl font-black text-neutral-900 tracking-tight">{current.title}</h2>
          <p className="text-neutral-500 font-medium leading-relaxed">{current.description}</p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={next}
            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-neutral-900 shadow-xl shadow-indigo-100 transition-all active:scale-95"
          >
            {current.cta}
          </button>
          {current.skip && (
            <button
              onClick={dismiss}
              className="w-full py-3 text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-700 transition-colors"
            >
              Skip Tour
            </button>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/60 text-neutral-400 hover:text-neutral-900 hover:bg-white transition-all text-sm font-black"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
