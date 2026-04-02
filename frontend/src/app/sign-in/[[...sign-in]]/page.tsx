"use client";

import { SignIn } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';

export default function SignInPage() {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect_url');
  const redirectUrl = redirectParam && redirectParam.startsWith('/')
    ? redirectParam
    : '/dashboard';

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-6">
      <SignIn forceRedirectUrl={redirectUrl} />
    </div>
  );
}
