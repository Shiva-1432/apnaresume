'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClerk, useUser } from '@clerk/nextjs';
import * as Sentry from '@sentry/nextjs';

export function useAuth() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { isLoaded, isSignedIn, user } = useUser();

  const redirectAfterSignOut = () => {
    router.push('/');
  };

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (isSignedIn && user) {
      Sentry.setUser({
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
      });
      return;
    }

    Sentry.setUser(null);
  }, [isLoaded, isSignedIn, user]);

  const logout = async () => {
    try {
      Sentry.setUser(null);
      await signOut({ redirectUrl: '/' });
      return;
    } catch (error) {
      console.error('Logout failed:', error);
    }

    Sentry.setUser(null);
    redirectAfterSignOut();
  };

  return { logout, redirectAfterSignOut };
}
