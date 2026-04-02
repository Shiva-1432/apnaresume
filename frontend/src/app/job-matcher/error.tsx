'use client';

import ErrorState from '@/components/ui/ErrorState';

export default function JobMatcherError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Unable to load job matcher"
      message={error.message || 'Please try again to open the job matcher.'}
      backHref="/dashboard"
      backLabel="Back to Dashboard"
      onRetry={reset}
    />
  );
}