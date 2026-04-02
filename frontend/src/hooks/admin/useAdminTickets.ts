"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthenticatedApi } from "@/hooks/useAuthenticatedApi";
import { ADMIN_ENDPOINTS } from "@/lib/api/endpoints";
import { admin } from "@/lib/api/queryKeys";
import type { AdminTicket, AdminTicketsFilters } from "@/types/admin";
import { toQueryString } from "./utils";

type AdminTicketsResponse = {
  success?: boolean;
  tickets?: AdminTicket[];
};

export function useAdminTickets(filters?: AdminTicketsFilters) {
  const { request, isLoaded } = useAuthenticatedApi();

  return useQuery<AdminTicket[]>({
    queryKey: filters
      ? admin.ticketsFiltered(filters as Record<string, unknown>)
      : admin.tickets(),
    enabled: isLoaded,
    queryFn: async () => {
      const response = await request<AdminTicketsResponse>({
        method: "GET",
        url: `${ADMIN_ENDPOINTS.tickets}${toQueryString(filters as Record<string, unknown> | undefined)}`,
      });

      return response.tickets ?? [];
    },
  });
}
