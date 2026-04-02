'use client';

import ErrorState from '@/components/ui/ErrorState';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Unable to load dashboard"
      message={error.message || 'Please try again to load your dashboard.'}
      backHref="/dashboard"
      backLabel="Back to Dashboard"
      onRetry={reset}
    />
  );
}