"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/lib/api/queryClient";
import { routeToFeature } from "@/lib/utils/routeToFeature";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const feature = routeToFeature(pathname);
    Sentry.setTag("feature", feature);
    Sentry.setTag("route", pathname);
  }, [pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}