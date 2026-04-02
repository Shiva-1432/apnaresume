"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthenticatedApi } from "@/hooks/useAuthenticatedApi";
import { ADMIN_ENDPOINTS } from "@/lib/api/endpoints";
import { admin } from "@/lib/api/queryKeys";
import type { FeatureFlag } from "@/types/admin";

type AdminFlagsResponse = {
  success?: boolean;
  flags?: FeatureFlag[];
};

export function useAdminFlags() {
  const { request, isLoaded } = useAuthenticatedApi();

  return useQuery<FeatureFlag[]>({
    queryKey: admin.flags(),
    enabled: isLoaded,
    queryFn: async () => {
      const response = await request<AdminFlagsResponse>({
        method: "GET",
        url: ADMIN_ENDPOINTS.flags,
      });

      return response.flags ?? [];
    },
  });
}
