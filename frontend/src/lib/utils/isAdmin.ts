import { auth } from '@clerk/nextjs/server';

type AdminClaims = {
  metadata?: {
    role?: string;
  };
};

export async function isAdmin(): Promise<boolean> {
  const { sessionClaims } = await auth();
  const claims = sessionClaims as AdminClaims | null | undefined;
  return claims?.metadata?.role === 'admin';
}
