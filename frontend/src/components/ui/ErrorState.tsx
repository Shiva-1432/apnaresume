'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

type ErrorStateProps = {
  title?: string;
  message: string;
  backHref: string;
  backLabel?: string;
  onRetry: () => void;
};

export default function ErrorState({
  title = 'Something went wrong',
  message,
  backHref,
  backLabel = 'Back',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto max-w-2xl rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center shadow-sm space-y-4">
        <h1 className="text-3xl font-black text-rose-900">{title}</h1>
        <p className="text-sm text-rose-800">{message}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="danger" onClick={onRetry}>
            Try again
          </Button>
          <Link
            href={backHref}
            className="inline-flex items-center justify-center rounded-lg border border-rose-300 px-6 py-2.5 text-sm font-semibold text-rose-900 transition-colors hover:bg-rose-100"
          >
            {backLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}