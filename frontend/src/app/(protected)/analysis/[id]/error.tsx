'use client';

import ErrorState from '@/components/ui/ErrorState';

export default function AnalysisError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Something went wrong"
      message={error.message || 'Unable to load this analysis right now.'}
      backHref="/resumes"
      backLabel="Back to Resumes"
      onRetry={reset}
    />
  );
}
