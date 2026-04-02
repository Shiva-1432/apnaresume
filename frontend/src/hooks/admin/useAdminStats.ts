"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthenticatedApi } from "@/hooks/useAuthenticatedApi";
import { ADMIN_ENDPOINTS } from "@/lib/api/endpoints";
import { admin } from "@/lib/api/queryKeys";
import type { AdminStats } from "@/types/admin";

type AdminStatsResponse = {
  success?: boolean;
  stats?: AdminStats;
};

export function useAdminStats() {
  const { request, isLoaded } = useAuthenticatedApi();

  return useQuery<AdminStats>({
    queryKey: admin.stats(),
    enabled: isLoaded,
    queryFn: async () => {
      const response = await request<AdminStatsResponse>({
        method: "GET",
        url: ADMIN_ENDPOINTS.stats,
      });

      return response.stats ?? {
        totalUsers: 0,
        totalResumes: 0,
        totalTickets: 0,
        totalSubscriptions: 0,
      };
    },
  });
}
