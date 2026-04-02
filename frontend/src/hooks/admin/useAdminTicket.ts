"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthenticatedApi } from "@/hooks/useAuthenticatedApi";
import { ADMIN_ENDPOINTS } from "@/lib/api/endpoints";
import { admin } from "@/lib/api/queryKeys";
import type { AdminTicket } from "@/types/admin";

type AdminTicketResponse = {
  success?: boolean;
  ticket?: AdminTicket;
};

export function useAdminTicket(id: string) {
  const { request, isLoaded } = useAuthenticatedApi();
  const ticketId = String(id || "").trim();

  return useQuery<AdminTicket | null>({
    queryKey: admin.ticket(ticketId),
    enabled: isLoaded && Boolean(ticketId),
    queryFn: async () => {
      const response = await request<AdminTicketResponse>({
        method: "GET",
        url: ADMIN_ENDPOINTS.ticket(ticketId),
      });

      return response.ticket ?? null;
    },
  });
}
