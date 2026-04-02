'use client';

import ErrorState from '@/components/ui/ErrorState';

export default function SettingsError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Unable to load settings"
      message={error.message || 'Please try again to open your settings.'}
      backHref="/dashboard"
      backLabel="Back to Dashboard"
      onRetry={reset}
    />
  );
}