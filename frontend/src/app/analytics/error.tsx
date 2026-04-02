'use client';

import ErrorState from '@/components/ui/ErrorState';

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Unable to load analytics"
      message={error.message || 'Please try again to load your analytics dashboard.'}
      backHref="/dashboard"
      backLabel="Back to Dashboard"
      onRetry={reset}
    />
  );
}