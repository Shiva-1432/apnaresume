'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

function VerifyEmailContent() {
  const params = useSearchParams();
  const email = params.get('email') || '';
  const token = params.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const verify = async () => {
      if (!email || !token) {
        setError('Invalid verification link.');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email`, {
          email,
          token
        });
        setSuccess(response.data?.message || 'Email verified successfully.');
      } catch (err) {
        const message = axios.isAxiosError(err)
          ? err.response?.data?.error || 'Email verification failed'
          : 'Email verification failed';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void verify();
  }, [email, token]);

  return (
    <div className="min-h-screen bg-linear-to-br from-neutral-50 to-primary-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md border border-neutral-200 p-6 space-y-4 text-center">
        <h1 className="text-2xl font-bold text-neutral-900">Email Verification</h1>

        {loading && <p className="text-neutral-600">Verifying your email...</p>}
        {!loading && error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">{error}</div>
        )}
        {!loading && success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">{success}</div>
        )}

        <Link href="/login" className="inline-block text-primary-600 font-semibold hover:underline">
          Continue to login
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="py-10 text-center text-neutral-600">Loading verification...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
