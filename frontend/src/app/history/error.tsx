'use client';

import ErrorState from '@/components/ui/ErrorState';

export default function HistoryError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Unable to load history"
      message={error.message || 'Please try again to load your resume history.'}
      backHref="/dashboard"
      backLabel="Back to Dashboard"
      onRetry={reset}
    />
  );
}