"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthenticatedApi } from "@/hooks/useAuthenticatedApi";
import { ADMIN_ENDPOINTS } from "@/lib/api/endpoints";
import { admin } from "@/lib/api/queryKeys";
import type { BillingStats, Subscription } from "@/types/admin";

type AdminBillingResponse = {
  success?: boolean;
  subscriptions?: Subscription[];
  stats?: BillingStats;
};

export function useAdminBilling() {
  const { request, isLoaded } = useAuthenticatedApi();

  return useQuery<{ subscriptions: Subscription[]; stats: BillingStats | null }>({
    queryKey: admin.billing(),
    enabled: isLoaded,
    queryFn: async () => {
      const response = await request<AdminBillingResponse>({
        method: "GET",
        url: ADMIN_ENDPOINTS.billing,
      });

      return {
        subscriptions: response.subscriptions ?? [],
        stats: response.stats ?? null,
      };
    },
  });
}
