'use client';

import ErrorState from '@/components/ui/ErrorState';

export default function ResumesError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Unable to load resumes"
      message={error.message || 'Please try again to load your resumes.'}
      backHref="/dashboard"
      backLabel="Back to Dashboard"
      onRetry={reset}
    />
  );
}