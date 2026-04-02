'use client';

import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-6">
      <div className="w-full max-w-md motion-fade-up">
        <div className="bg-glass p-10 rounded-[2.5rem] shadow-2xl border border-white/40 backdrop-blur-3xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-neutral-900 mb-2 tracking-tight">Recover Account</h1>
            <p className="text-neutral-500 font-bold">Password recovery is handled securely by Clerk.</p>
          </div>

          <p className="text-sm text-neutral-500 font-medium leading-relaxed text-center">
            Use the forgot password option on the sign-in page to receive a recovery email.
          </p>

          <div className="mt-8">
            <Link
              href="/sign-in"
              className="w-full inline-block py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 text-center"
            >
              Continue to Sign In
            </Link>
          </div>

          <div className="mt-10 pt-8 border-t border-white/40 text-center">
            <Link href="/sign-in" className="text-sm font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
