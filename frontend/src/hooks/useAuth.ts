'use client';

import { useRouter } from 'next/navigation';
import { clearStoredSession, getStoredSession } from '@/lib/session';

export function useAuth() {
  const router = useRouter();

  const logout = async () => {
    const { token } = getStoredSession();

    try {
      if (token) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }

    clearStoredSession();

    router.push('/login?reason=logged-out');
  };

  return { logout };
}
