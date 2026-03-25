'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { User } from '@/types';
import StatusMessage from '@/components/ui/StatusMessage';
import { getStoredSession } from '@/lib/session';

interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'session-expired') {
      setError('Your session expired. Please login again.');
      return;
    }

    if (reason === 'unauthorized') {
      setError('Please login to continue.');
      return;
    }

    if (reason === 'logged-out') {
      setInfo('You have been logged out successfully.');
    }
  }, [searchParams]);

  useEffect(() => {
    const { token, user: storedUser } = getStoredSession();
    if (token && storedUser) {
      router.push('/dashboard');
    }
  }, [router]);

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    setValidationMessage('');
    if (!isValidEmail(normalizedEmail)) {
      setValidationMessage('Please enter a valid email address.');
      return;
    }

    if (!password.trim()) {
      setValidationMessage('Password is required.');
      return;
    }

    setLoading(true);
    setError('');
    setInfo('');

    try {
      const response = await axios.post<LoginResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        { email: normalizedEmail, password }
      );

      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      router.push('/dashboard');
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'Login failed'
        : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Enter your email first to resend verification.');
      return;
    }

    setResendLoading(true);
    setError('');
    setInfo('');

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/resend-verification`,
        { email }
      );
      setInfo(response.data?.message || 'Verification email request sent.');
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'Failed to resend verification email'
        : 'Failed to resend verification email';
      setError(message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      {error && (
        <StatusMessage variant="error" message={error} />
      )}
      {validationMessage && (
        <StatusMessage variant="error" message={validationMessage} />
      )}
      {info && (
        <StatusMessage variant="success" message={info} />
      )}

      <div>
        <label htmlFor="login-email" className="block text-sm font-semibold text-gray-700 mb-1">
          Email
        </label>
      <input
        id="login-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full p-2 border rounded"
        autoComplete="email"
        required
      />
      </div>

      <div>
        <label htmlFor="login-password" className="block text-sm font-semibold text-gray-700 mb-1">
          Password
        </label>
      <input
        id="login-password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full p-2 border rounded"
        autoComplete="current-password"
        required
      />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full p-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>

      <p className="text-sm text-gray-600 text-center">
        <Link href="/forgot-password" className="text-blue-600 hover:underline">
          Forgot password?
        </Link>
      </p>

      <button
        type="button"
        onClick={handleResendVerification}
        disabled={resendLoading}
        className="w-full p-2 border border-blue-300 text-blue-700 rounded hover:bg-blue-50 disabled:opacity-50"
      >
        {resendLoading ? 'Sending...' : 'Resend verification email'}
      </button>
    </form>
  );
}
