'use client';

import ErrorState from '@/components/ui/ErrorState';

export default function SupportError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Unable to load support"
      message={error.message || 'Please try again to open support.'}
      backHref="/dashboard"
      backLabel="Back to Dashboard"
      onRetry={reset}
    />
  );
}