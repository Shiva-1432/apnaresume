'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import StatusMessage from '@/components/ui/StatusMessage';

export default function SignupForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const router = useRouter();

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isStrongPassword = (value: string) => value.length >= 8
    && /[a-z]/.test(value)
    && /[A-Z]/.test(value)
    && /\d/.test(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    setValidationMessage('');
    if (trimmedName.length < 2 || trimmedName.length > 80) {
      setValidationMessage('Name must be between 2 and 80 characters.');
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setValidationMessage('Please enter a valid email address.');
      return;
    }

    if (!isStrongPassword(password)) {
      setValidationMessage('Password must include uppercase, lowercase, and a number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        { name: trimmedName, email: normalizedEmail, password }
      );

      // Save token to localStorage
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Redirect to dashboard
      router.push('/dashboard');

    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'Signup failed'
        : 'Signup failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Sign Up for ApnaResume</h2>

      {error && (
        <StatusMessage variant="error" message={error} className="mb-4" />
      )}
      {validationMessage && (
        <StatusMessage variant="error" message={validationMessage} className="mb-4" />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="signup-name" className="block text-sm font-semibold text-gray-700 mb-1">
            Full Name
          </label>
        <input
          id="signup-name"
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded"
          autoComplete="name"
          required
        />
        </div>

        <div>
          <label htmlFor="signup-email" className="block text-sm font-semibold text-gray-700 mb-1">
            Email
          </label>
        <input
          id="signup-email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          autoComplete="email"
          required
        />
        </div>

        <div>
          <label htmlFor="signup-password" className="block text-sm font-semibold text-gray-700 mb-1">
            Password
          </label>
        <input
          id="signup-password"
          type="password"
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
          minLength={8}
          autoComplete="new-password"
        />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>

      <p className="mt-4 text-sm">
        Already have an account? <Link href="/login" className="text-blue-600">Login</Link>
      </p>
    </div>
  );
}
