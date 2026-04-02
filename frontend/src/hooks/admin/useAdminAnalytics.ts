"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthenticatedApi } from "@/hooks/useAuthenticatedApi";
import { ADMIN_ENDPOINTS } from "@/lib/api/endpoints";
import { admin } from "@/lib/api/queryKeys";
import type { AdminAnalytics } from "@/types/admin";
import { toQueryString } from "./utils";

type AdminAnalyticsResponse = {
  success?: boolean;
  analytics?: AdminAnalytics;
};

export function useAdminAnalytics(range?: string) {
  const { request, isLoaded } = useAuthenticatedApi();

  return useQuery<AdminAnalytics | null>({
    queryKey: admin.analytics(range),
    enabled: isLoaded,
    queryFn: async () => {
      const response = await request<AdminAnalyticsResponse>({
        method: "GET",
        url: `${ADMIN_ENDPOINTS.analytics}${toQueryString({ range })}`,
      });

      return response.analytics ?? null;
    },
  });
}
