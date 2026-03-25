'use client';

import { Suspense } from 'react';
import { FormEvent, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

function ResetPasswordContent() {
  const params = useSearchParams();
  const email = params.get('email') || '';
  const token = params.get('token') || '';

  const hasParams = useMemo(() => Boolean(email && token), [email, token]);

  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`,
        {
          email,
          token,
          new_password: newPassword
        }
      );

      setSuccess(response.data?.message || 'Password reset successful.');
      setNewPassword('');
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'Failed to reset password'
        : 'Failed to reset password';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-neutral-50 to-primary-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md border border-neutral-200 p-6 space-y-4">
        <h1 className="text-2xl font-bold text-neutral-900">Reset Password</h1>

        {!hasParams && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
            Invalid reset link. Please request a new one.
          </div>
        )}

        {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">{error}</div>}
        {success && <div className="p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            className="w-full p-3 border border-neutral-300 rounded-lg"
            required
            minLength={8}
            disabled={!hasParams || loading}
          />
          <button
            type="submit"
            disabled={!hasParams || loading}
            className="w-full p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p className="text-sm text-neutral-600">
          Back to{' '}
          <Link href="/login" className="text-primary-600 font-semibold hover:underline">
            login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="py-10 text-center text-neutral-600">Loading reset form...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
