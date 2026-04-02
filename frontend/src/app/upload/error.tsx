'use client';

import ErrorState from '@/components/ui/ErrorState';

export default function UploadError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Unable to load upload page"
      message={error.message || 'Please try again to open the upload flow.'}
      backHref="/dashboard"
      backLabel="Back to Dashboard"
      onRetry={reset}
    />
  );
}