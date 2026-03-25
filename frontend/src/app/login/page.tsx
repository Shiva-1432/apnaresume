import { Suspense } from 'react';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="py-20">
      <Suspense fallback={<div className="text-center text-neutral-600">Loading login...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
