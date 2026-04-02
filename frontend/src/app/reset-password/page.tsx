'use client';

import Link from 'next/link';
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-6">
      <div className="w-full max-w-md motion-fade-up">
        <div className="bg-glass p-10 rounded-[2.5rem] shadow-2xl border border-white/40 backdrop-blur-3xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-neutral-900 mb-2 tracking-tight">Security Update</h1>
            <p className="text-neutral-500 font-bold">Password reset is managed by Clerk.</p>
          </div>

          <p className="text-sm text-neutral-500 font-medium leading-relaxed text-center">
            Open the reset link from your email and complete recovery via the Clerk sign-in screen.
          </p>

          <div className="mt-8">
            <Link
              href="/sign-in"
              className="w-full inline-block py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 text-center"
            >
              Continue to Sign In
            </Link>
          </div>

          <div className="mt-10 pt-8 border-t border-white/40 text-center text-sm font-bold text-neutral-500">
            Back to <Link href="/sign-in" className="text-indigo-600 hover:text-indigo-800">Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
