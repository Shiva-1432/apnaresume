"use client";

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error);
    }
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-gray-50 p-6 text-gray-900">
        <div className="mx-auto mt-12 max-w-xl rounded-xl border border-red-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-red-700">Something went wrong</h2>
          <p className="mt-2 text-sm text-gray-700">
            We logged this issue and will look into it.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-4 rounded-md bg-primary-600 px-4 py-2 font-semibold text-white hover:bg-primary-700"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
