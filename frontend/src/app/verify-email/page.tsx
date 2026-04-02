'use client';

import Link from 'next/link';
export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-6">
      <div className="w-full max-w-md motion-fade-up">
        <div className="bg-glass p-10 rounded-[2.5rem] shadow-2xl border border-white/40 backdrop-blur-3xl text-center">
          <div className="text-4xl mb-6">✉️</div>
          <h1 className="text-3xl font-black text-neutral-900 mb-6 tracking-tight">Verify Your Identity</h1>

          <p className="text-sm text-neutral-500 font-medium leading-relaxed">
            Email verification is handled by Clerk. Continue to sign in and complete verification there.
          </p>

          <div className="mt-8 pt-8 border-t border-white/40">
            <Link href="/sign-in" className="w-full inline-block py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95">
              Continue to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
