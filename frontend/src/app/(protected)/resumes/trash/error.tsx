'use client';

import ErrorState from '@/components/ui/ErrorState';

export default function ResumesTrashError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Unable to load trash"
      message={error.message || 'Please try again to load deleted resumes.'}
      backHref="/dashboard"
      backLabel="Back to Dashboard"
      onRetry={reset}
    />
  );
}