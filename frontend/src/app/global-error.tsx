"use client";

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { env } from "@/lib/env";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error);
    }
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-mesh flex items-center justify-center p-6 selection:bg-rose-100 selection:text-rose-900 overflow-hidden font-sans">
        <div className="max-w-xl w-full motion-fade-up">
          <div className="bg-glass rounded-[3rem] p-12 md:p-16 border border-white/40 shadow-2xl backdrop-blur-3xl relative overflow-hidden text-center group">
            {/* 🔴 Error Glow */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-rose-500/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 opacity-60" />
            
            <div className="relative z-10 space-y-8">
              <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-3xl mx-auto flex items-center justify-center text-rose-500 shadow-xl shadow-rose-500/5">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              <div className="space-y-4">
                <h2 className="text-4xl font-black text-neutral-900 tracking-tighter leading-none">Something went wrong</h2>
                <p className="text-sm font-bold text-neutral-500 leading-relaxed uppercase tracking-[0.2em]">An unexpected error occurred.</p>
              </div>

              <p className="text-neutral-400 text-sm font-medium leading-relaxed max-w-sm mx-auto">
                We&apos;ve logged this issue and will look into it. Please try again or return to the home page.
              </p>

              <div className="pt-8 flex flex-col gap-4">
                <button
                  type="button"
                  onClick={() => reset()}
                  className="w-full py-5 bg-neutral-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all hover:bg-rose-600 active:scale-95"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={() => window.location.href = '/'}
                  className="w-full py-5 bg-white/40 border border-white/60 text-neutral-700 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white transition-all shadow-xl"
                >
                  Return to Dashboard
                </button>
              </div>

              <div className="pt-10 flex items-center justify-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-300 border-t border-white/20">
                <span>Support ID: SYS-001</span>
                <span>Error has been logged</span>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
