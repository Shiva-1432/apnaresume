'use client';

import ErrorState from '@/components/ui/ErrorState';

export default function MyResumesError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Unable to load resumes"
      message={error.message || 'Please try again to load your saved resumes.'}
      backHref="/dashboard"
      backLabel="Back to Dashboard"
      onRetry={reset}
    />
  );
}