'use client';

import { FormEvent, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
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
        `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`,
        { email }
      );

      setSuccess(response.data?.message || 'If your email exists, a reset link has been sent.');
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'Failed to request password reset'
        : 'Failed to request password reset';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-neutral-50 to-primary-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md border border-neutral-200 p-6 space-y-4">
        <h1 className="text-2xl font-bold text-neutral-900">Forgot Password</h1>
        <p className="text-sm text-neutral-600">
          Enter your email and we&apos;ll send a secure reset link.
        </p>

        {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">{error}</div>}
        {success && <div className="p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full p-3 border border-neutral-300 rounded-lg"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="text-sm text-neutral-600">
          Remembered your password?{' '}
          <Link href="/login" className="text-primary-600 font-semibold hover:underline">
            Go to login
          </Link>
        </p>
      </div>
    </div>
  );
}
